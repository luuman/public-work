// BaseLogWorker.ts
import { parentPort, workerData } from 'worker_threads'
import fs from 'fs'
import path from 'path'

export class BaseLogWorker {
  private logFile: string
  private logLevel: string
  private maxLogSize: number
  private backupCount: number

  constructor(workerData: LogWorkerData) {
    this.logFile = workerData.logFile
    this.logLevel = workerData.logLevel || 'info'
    this.maxLogSize = workerData.maxLogSize || 10 * 1024 * 1024 // 10MB
    this.backupCount = workerData.backupCount || 5

    this.initializeLogFile()
    this.setupMessageHandler()
  }

  private initializeLogFile(): void {
    const logDir = path.dirname(this.logFile)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
  }

  private setupMessageHandler(): void {
    if (!parentPort) return

    parentPort.on('message', (message: any) => {
      if (message.type === 'log') {
        this.handleLogMessage(message)
      }
    })
  }

  private handleLogMessage(message: any): void {
    const { level, message: logMessage, timestamp = new Date() } = message

    if (this.shouldLog(level)) {
      this.writeLog(level, logMessage, timestamp)
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'fatal']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)

    return messageLevelIndex >= currentLevelIndex
  }

  private writeLog(level: string, message: string, timestamp: Date): void {
    const logEntry = `[${timestamp.toISOString()}] [${level.toUpperCase()}] ${message}\n`

    try {
      // 检查日志文件大小
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile)
        if (stats.size > this.maxLogSize) {
          this.rotateLogs()
        }
      }

      fs.appendFileSync(this.logFile, logEntry, 'utf8')
    } catch (error) {
      console.error('Failed to write log:', error)
    }
  }

  private rotateLogs(): void {
    try {
      // 删除最旧的备份
      const oldestBackup = `${this.logFile}.${this.backupCount}`
      if (fs.existsSync(oldestBackup)) {
        fs.unlinkSync(oldestBackup)
      }

      // 重命名现有备份
      for (let i = this.backupCount - 1; i >= 1; i--) {
        const oldFile = `${this.logFile}.${i}`
        const newFile = `${this.logFile}.${i + 1}`
        if (fs.existsSync(oldFile)) {
          fs.renameSync(oldFile, newFile)
        }
      }

      // 重命名当前日志文件
      if (fs.existsSync(this.logFile)) {
        fs.renameSync(this.logFile, `${this.logFile}.1`)
      }
    } catch (error) {
      console.error('Log rotation failed:', error)
    }
  }

  public log(level: string, message: string): void {
    if (parentPort) {
      parentPort.postMessage({
        type: 'log',
        level,
        message,
        timestamp: new Date(),
      })
    }
  }

  public debug(message: string): void {
    this.log('debug', message)
  }

  public info(message: string): void {
    this.log('info', message)
  }

  public warn(message: string): void {
    this.log('warn', message)
  }

  public error(message: string): void {
    this.log('error', message)
  }

  public fatal(message: string): void {
    this.log('fatal', message)
  }
}
