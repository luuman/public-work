import { parentPort } from 'worker_threads'
import log4js from 'log4js'
import { handleConfig, initLogConfig } from './config'

// 定义类型
export interface LogWorkerData {
  logPath: string
  isDev: boolean
  appenderNames: string[]
  categoryNames: string[]
  APP_NAME: string
}

export interface LogBufferItem {
  fileName: string
  message: string
}

export interface WorkerMessage {
  level: keyof typeof log4js.levels
  message: string
  fileName?: string
}

export interface LogWorkerStats {
  totalLogsProcessed: number
  bufferSize: number
  lastFlushTime: number
  isInitialized: boolean
}

export class LogWorker {
  private buffer: LogBufferItem[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private readonly FLUSH_INTERVAL: number = 3000
  private isInitialized: boolean = false
  private totalLogsProcessed: number = 0
  private lastFlushTime: number = Date.now()

  constructor(
    private workerData: LogWorkerData,
    private isDbWorker = false,
  ) {
    this.initialize()
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    console.log('🚀[Worker] LogWorkerData', this.workerData)

    const { logPath, appenderNames, categoryNames, APP_NAME } = this.workerData

    if (!logPath) throw new Error('logPath is required')
    if (!APP_NAME) throw new Error('APP_NAME is required')
    if (!appenderNames?.length && !categoryNames?.length)
      throw new Error('appenderNames is required')
  }

  /**
   * 初始化日志配置
   */
  private initialize(): void {
    try {
      this.validateConfig()

      if (!parentPort) {
        throw new Error('This file must be run as a Worker')
      }

      const { logPath, isDev, appenderNames, categoryNames, APP_NAME } =
        this.workerData
      const password = !isDev ? '' : 'empty'

      // 初始化配置
      const config = initLogConfig(logPath, APP_NAME, '6M', password)
      handleConfig(config, { appenderNames, categoryNames }, logPath)

      // 自定义日志格式
      log4js.addLayout('mypattern', () => (logEvent) => {
        return `[${logEvent.startTime.toISOString()}] [${logEvent.level.levelStr}] ${logEvent.data.join(' ')}`
      })

      // 应用配置
      log4js.configure(config)

      if (!this.isDbWorker) {
        // 设置消息监听器
        parentPort.on('message', (data: WorkerMessage) => {
          this.handleMessage(data)
        })

        // 错误处理
        parentPort.on('error', (error) => {
          this.emergencyLog('system', 'ERROR', `Worker error: ${error.message}`)
        })
      }

      this.isInitialized = true
      this.log('system', 'INFO', 'Log worker initialized successfully')
    } catch (error) {
      console.error('Failed to initialize LogWorker:', error)
      throw error
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: WorkerMessage): void {
    try {
      const { message, fileName, level = 'INFO' } = data
      this.bufferedWrite(fileName || 'default', `${message}`)
    } catch (error) {
      this.emergencyLog(
        'system',
        'ERROR',
        `Error handling message: ${(error as Error).message}`,
      )
    }
  }

  /**
   * 缓冲写入日志
   */
  private bufferedWrite(fileName: string, message: string): void {
    this.buffer.push({ fileName, message })

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushLogs()
      }, this.FLUSH_INTERVAL)
    }

    // 缓冲区保护机制
    if (this.buffer.length > 1000) {
      this.emergencyLog(
        'system',
        'WARN',
        `Log buffer overflow (${this.buffer.length} items), forcing flush`,
      )
      this.flushLogs()
    }
  }

  /**
   * 刷新日志到文件
   */
  private flushLogs(): void {
    if (this.buffer.length === 0) return

    const startTime = Date.now()
    const batchSize = this.buffer.length

    try {
      // 批量写入日志
      this.buffer.forEach(({ fileName, message }) => {
        const logger = log4js.getLogger(fileName || 'default')
        logger.info(message)
      })

      // 更新统计信息
      this.totalLogsProcessed += batchSize
      this.lastFlushTime = Date.now()

      // 记录大批次处理性能
      if (batchSize > 100) {
        const duration = Date.now() - startTime
        const logger = log4js.getLogger('performance')
        logger.info(`Flushed ${batchSize} logs in ${duration}ms`)
      }
    } catch (error) {
      console.error('Failed to flush logs:', error)
    } finally {
      // 清空缓冲区
      this.buffer.length = 0

      // 清除计时器
      if (this.flushTimer) {
        clearTimeout(this.flushTimer)
        this.flushTimer = null
      }
    }
  }

  /**
   * 记录日志
   */
  public log(
    fileName: string,
    level: keyof typeof log4js.levels,
    message: string,
  ): void {
    if (!this.isInitialized) {
      console.log(`[${level}] ${message}`) // 降级到控制台
      return
    }

    const logger = log4js.getLogger(fileName || 'default')
    const logMethod = level.toLowerCase() as keyof typeof logger

    if (typeof logger[logMethod] === 'function') {
      ;(logger[logMethod] as any)(message)
    } else {
      logger.info(message)
    }
  }

  /**
   * 紧急日志（绕过缓冲区）
   */
  public emergencyLog(
    fileName: string,
    level: keyof typeof log4js.levels,
    message: string,
  ): void {
    this.flushImmediately() // 先刷新现有日志
    this.log(fileName, level, `[URGENT] ${message}`)
  }

  /**
   * 获取统计信息
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
   * 立即刷新缓冲区
   */
  public flushImmediately(): void {
    this.flushLogs()
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    this.flushImmediately()

    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    this.buffer.length = 0
    this.isInitialized = false
  }
}
