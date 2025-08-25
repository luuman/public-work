import { parentPort } from 'worker_threads'
import log4js from 'log4js'
import { handleConfig, initLogConfig } from './config'
import crypto from 'crypto' // 引入加密模块

/**
 * 日志工作线程初始化参数类型
 * 可配置缓冲区大小与刷新间隔，支持日志加密
 */
export interface LogWorkerData {
  logPath: string
  isDev: boolean
  appenderNames: string[]
  categoryNames: string[]
  APP_NAME: string
  flushInterval?: number
  bufferLimit?: number
  // ==== 新增加密相关参数 ====
  encryptionEnabled?: boolean        // 是否启用日志加密
  encryptionAlgorithm?: string       // 加密算法（如 'aes-256-cbc'、'aes-192-cbc'、'aes-128-cbc'）
  encryptionKey?: string             // 加密密钥（长度由算法决定）
}

/**
 * 单条日志缓冲项
 */
export interface LogBufferItem {
  fileName: string
  message: string
}

/**
 * 主线程与日志 worker 通信消息格式
 */
export interface WorkerMessage {
  level: keyof typeof log4js.levels
  message: string
  fileName?: string
}

/**
 * 日志 worker 运行状态统计
 */
export interface LogWorkerStats {
  totalLogsProcessed: number
  bufferSize: number
  lastFlushTime: number
  isInitialized: boolean
}

/**
 * 日志工作线程（带加密能力）
 */
export class LogWorker {
  private buffer: LogBufferItem[] = []
  private errorBuffer: LogBufferItem[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private readonly FLUSH_INTERVAL: number
  private readonly BUFFER_LIMIT: number
  private isInitialized: boolean = false
  private totalLogsProcessed: number = 0
  private lastFlushTime: number = Date.now()
  private loggerCache: Map<string, log4js.Logger> = new Map()
  private messageListener: ((data: WorkerMessage) => void) | null = null
  private errorListener: ((error: Error) => void) | null = null
  // ==== 加密配置 ====
  private readonly encryptionEnabled: boolean
  private readonly encryptionAlgorithm: string
  private readonly encryptionKey: string

  /**
   * 构造函数，初始化日志配置与状态
   * @param workerData 日志配置参数
   * @param isDbWorker 是否为数据库日志worker
   */
  constructor(
    private workerData: LogWorkerData,
    private isDbWorker = false,
  ) {
    this.FLUSH_INTERVAL = workerData.flushInterval ?? 3000
    this.BUFFER_LIMIT = workerData.bufferLimit ?? 1000
    // ==== 加密相关初始化 ====
    this.encryptionEnabled = !!workerData.encryptionEnabled
    this.encryptionAlgorithm = workerData.encryptionAlgorithm || 'aes-256-cbc'
    this.encryptionKey = workerData.encryptionKey || ''
    this.initialize()
  }

  /**
   * 校验配置参数完整性，缺失则抛出异常
   */
  private validateConfig(): void {
    const { logPath, appenderNames, categoryNames, APP_NAME, encryptionEnabled, encryptionAlgorithm, encryptionKey } = this.workerData
    if (!logPath) throw new Error('logPath is required')
    if (!APP_NAME) throw new Error('APP_NAME is required')
    if (!appenderNames?.length && !categoryNames?.length)
      throw new Error('appenderNames is required')
    // 加密参数校验
    if (encryptionEnabled) {
      if (!encryptionAlgorithm) throw new Error('encryptionAlgorithm is required when encryptionEnabled')
      if (!encryptionKey) throw new Error('encryptionKey is required when encryptionEnabled')
    }
  }

  /**
   * 初始化 log4js 配置、消息监听、logger缓存等
   */
  private initialize(): void {
    try {
      this.validateConfig()

      if (!parentPort) {
        throw new Error('This file must be run as a Worker')
      }

      const { logPath, isDev, appenderNames, categoryNames, APP_NAME } = this.workerData
      const password = !isDev ? '' : 'empty'

      // 初始化 log4js 配置对象
      const config = initLogConfig(logPath, APP_NAME, '6M', password)
      handleConfig(config, { appenderNames, categoryNames }, logPath)

      // 注册自定义日志格式
      log4js.addLayout('mypattern', () => (logEvent) => {
        return `[${logEvent.startTime.toISOString()}] [${logEvent.level.levelStr}] ${logEvent.data.join(' ')}`
      })

      // 应用日志配置
      log4js.configure(config)

      // 非DB日志worker则绑定消息和错误监听
      if (!this.isDbWorker) {
        this.messageListener = (data: WorkerMessage) => this.handleMessage(data)
        this.errorListener = (error: Error) => {
          this.emergencyLog('system', 'ERROR', `Worker error: ${error.message}`)
        }
        parentPort.on('message', this.messageListener)
        parentPort.on('error', this.errorListener)
      }

      this.isInitialized = true
      this.log('system', 'INFO', 'Log worker initialized successfully')
    } catch (error) {
      console.error('Failed to initialize LogWorker:', error)
      throw error
    }
  }

  /**
   * 获取（或缓存）指定类别/文件名的 logger 实例
   * @param fileName 日志类别或文件名
   */
  private getLogger(fileName: string): log4js.Logger {
    if (!this.loggerCache.has(fileName)) {
      this.loggerCache.set(fileName, log4js.getLogger(fileName))
    }
    return this.loggerCache.get(fileName)!
  }

  /**
   * 日志加密工具（支持常见对称加密，默认 aes-256-cbc）
   * @param plainText 明文内容
   * @returns 加密后的字符串（base64）
   */
  private encryptLog(plainText: string): string {
    // 兼容不同算法初始化向量长度
    const ivLength = parseInt(this.encryptionAlgorithm.split('-')[1], 10) / 8
    const iv = crypto.randomBytes(ivLength)
    const cipher = crypto.createCipheriv(this.encryptionAlgorithm, Buffer.from(this.encryptionKey, 'utf8'), iv)
    let encrypted = cipher.update(plainText, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    return iv.toString('base64') + ':' + encrypted // IV和密文用冒号分隔
  }

  /**
   * 处理主线程发送的日志消息：缓冲写入
   * @param data WorkerMessage 消息体
   */
  private handleMessage(data: WorkerMessage): void {
    try {
      const { message, fileName = 'default', level = 'INFO' } = data
      this.bufferedWrite(fileName, message)
    } catch (error) {
      this.emergencyLog('system', 'ERROR', `Error handling message: ${(error as Error).message}`)
    }
  }

  /**
   * 写入日志到缓冲区，并检测是否需要强制刷新
   * 自动加密日志内容（如启用加密）
   * @param fileName 日志类别或文件名
   * @param message 日志内容
   */
  private bufferedWrite(fileName: string, message: string): void {
    let finalMessage = message
    if (this.encryptionEnabled) {
      finalMessage = this.encryptLog(message)
    }
    this.buffer.push({ fileName, message: finalMessage })

    // 未设置刷新定时器则启动
    if (!this.flushTimer) {
      this.resetFlushTimer()
    }

    // 缓冲区溢出保护
    if (this.buffer.length > this.BUFFER_LIMIT) {
      this.emergencyLog('system', 'WARN', `Log buffer overflow (${this.buffer.length} items), forcing flush`)
      this.flushLogs()
    }
  }

  /**
   * 启动或重置刷新定时器
   */
  private resetFlushTimer(): void {
    if (this.flushTimer) clearTimeout(this.flushTimer)
    this.flushTimer = setTimeout(() => this.flushLogs(), this.FLUSH_INTERVAL)
  }

  /**
   * 刷新所有缓冲区日志到文件
   * 包括上次 flush 失败暂存的 errorBuffer 重试
   */
  private flushLogs(): void {
    if (this.buffer.length === 0 && this.errorBuffer.length === 0) {
      if (this.flushTimer) {
        clearTimeout(this.flushTimer)
        this.flushTimer = null
      }
      return
    }

    const batch = [...this.errorBuffer, ...this.buffer]
    const startTime = Date.now()
    let failed: LogBufferItem[] = []

    try {
      batch.forEach(({ fileName, message }) => {
        try {
          const logger = this.getLogger(fileName || 'default')
          logger.info(message)
        } catch (err) {
          failed.push({ fileName, message })
        }
      })

      this.totalLogsProcessed += batch.length - failed.length
      this.lastFlushTime = Date.now()

      // 大批量处理性能日志
      if (batch.length > 100) {
        const duration = Date.now() - startTime
        const logger = this.getLogger('performance')
        logger.info(`Flushed ${batch.length} logs in ${duration}ms`)
      }
    } catch (error) {
      console.error('Failed to flush logs:', error)
    } finally {
      this.buffer.length = 0
      this.errorBuffer = failed
      if (this.flushTimer) {
        clearTimeout(this.flushTimer)
        this.flushTimer = null
      }
      // 若有失败日志，延迟重试
      if (this.errorBuffer.length > 0) {
        setTimeout(() => this.flushLogs(), 500)
      }
    }
  }

  /**
   * 直接写入日志（不缓冲），初始化失败时降级到控制台
   * 自动加密日志内容（如启用加密）
   * @param fileName 日志类别或文件名
   * @param level 日志级别
   * @param message 日志内容
   */
  public log(
    fileName: string,
    level: keyof typeof log4js.levels,
    message: string,
  ): void {
    let finalMessage = message
    if (this.encryptionEnabled) {
      finalMessage = this.encryptLog(message)
    }
    if (!this.isInitialized) {
      console.log(`[${fileName}][${level}] ${finalMessage}`)
      return
    }
    const logger = this.getLogger(fileName || 'default')
    const logMethod = level.toLowerCase() as keyof typeof logger
    if (typeof logger[logMethod] === 'function') {
      ;(logger[logMethod] as any)(finalMessage)
    } else {
      logger.info(finalMessage)
    }
  }

  /**
   * 紧急日志：立即刷新缓冲区再直接写入
   * @param fileName 日志类别或文件名
   * @param level 日志级别
   * @param message 日志内容
   */
  public emergencyLog(
    fileName: string,
    level: keyof typeof log4js.levels,
    message: string,
  ): void {
    this.flushImmediately()
    this.log(fileName, level, `[URGENT] ${message}`)
  }

  /**
   * 获取当前日志统计信息
   * @returns LogWorkerStats
   */
  public getStats(): LogWorkerStats {
    return {
      totalLogsProcessed: this.totalLogsProcessed,
      bufferSize: this.buffer.length,
      lastFlushTime: this.lastFlushTime,
      isInitialized: this.isInitialized,
    }
  }

  /**
   * 立即刷新缓冲区日志
   */
  public flushImmediately(): void {
    this.flushLogs()
  }

  /**
   * 释放资源，解绑事件监听、清空缓存
   */
  public dispose(): void {
    this.flushImmediately()
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    // 解绑主线程事件监听
    if (!this.isDbWorker && parentPort) {
      if (this.messageListener) parentPort.off('message', this.messageListener)
      if (this.errorListener) parentPort.off('error', this.errorListener)
    }
    this.buffer.length = 0
    this.errorBuffer.length = 0
    this.isInitialized = false
    this.loggerCache.clear()
  }
}
