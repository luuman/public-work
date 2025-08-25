import { parentPort } from 'worker_threads'
import log from 'electron-log'
import path from 'path'

export interface LogWorkerData {
  logPath?: string
  isDev: boolean
}

export interface LogMessage {
  level: keyof typeof log
  message: string
}

export class LogWorker {
  private buffer: string[] = []
  private flushInterval: number = 3000
  private flushTimer: NodeJS.Timeout | null = null
  private isInitialized: boolean = false

  constructor(private workerData: LogWorkerData) {
    this.initialize()
  }

  /**
   * 初始化日志配置
   */
  private initialize(): void {
    if (!parentPort) {
      throw new Error('This file must be run as a Worker')
    }

    const { logPath, isDev } = this.workerData

    // 设置日志文件路径
    if (logPath) {
      log.transports.file.resolvePathFn = () => path.join(logPath, 'logs.log')
    }

    // 设置日志级别
    log.transports.file.level = 'info'
    log.transports.console.level = isDev ? 'debug' : 'info'

    // 设置日志格式
    log.transports.file.format =
      '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

    // 设置消息监听器
    parentPort.on('message', (data: LogMessage) => {
      this.handleMessage(data)
    })

    this.isInitialized = true
    this.log('info', 'Log worker initialized successfully')
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: LogMessage): void {
    const { level, message } = data
    this.bufferedWrite(`[${level.toUpperCase()}] ${message}`)
  }

  /**
   * 缓冲写入日志
   */
  private bufferedWrite(message: string): void {
    this.buffer.push(message)

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushLogs()
      }, this.flushInterval)
    }

    // 如果缓冲区太大，立即刷新
    if (this.buffer.length > 100) {
      this.flushLogs()
    }
  }

  /**
   * 刷新日志到文件
   */
  private flushLogs(): void {
    if (this.buffer.length === 0) {
      return
    }

    // 批量写入日志
    const batchMessage = this.buffer.join('\n')
    log.info(batchMessage)

    // 清空缓冲区
    this.buffer.length = 0

    // 清除计时器
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * 直接记录日志（不经过缓冲区）
   */
  public log(level: keyof typeof log, message: string): void {
    if (!this.isInitialized) {
      throw new Error('Log worker is not initialized')
    }

    const formattedMessage = `[${level.toUpperCase()}] ${message}`

    switch (level) {
      case 'error':
        log.error(formattedMessage)
        break
      case 'warn':
        log.warn(formattedMessage)
        break
      case 'info':
        log.info(formattedMessage)
        break
      case 'verbose':
        log.verbose(formattedMessage)
        break
      case 'debug':
        log.debug(formattedMessage)
        break
      case 'silly':
        log.silly(formattedMessage)
        break
      default:
        log.info(formattedMessage)
    }
  }

  /**
   * 获取缓冲区状态
   */
  public getBufferStatus(): { count: number; size: number } {
    return {
      count: this.buffer.length,
      size: new TextEncoder().encode(this.buffer.join('')).length,
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
  }
}
