console.log('😊 CategoryLogger')

import { WorkerManager } from '../../lib/workerManager'

type LogLevel = 'info' | 'warn' | 'error'

export class CategoryLogger {
  constructor(
    private category: string,
    private logWorker: WorkerManager,
  ) {}

  private formatMessage(args: any[]): string {
    return args
      .map((arg) => {
        if (arg === null) return 'null'
        if (arg === undefined) return 'undefined'
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch {
            return '[Circular]'
          }
        }
        return String(arg)
      })
      .join(' ')
  }

  private logToFile(level: LogLevel, message: string) {
    const fileName = `${this.category}.${level}.log`
    this.logWorker.postMessage({ level, message, fileName })
  }

  public info(...args: any[]) {
    const message = this.formatMessage(args)
    // console.log(`🚀[${this.category}] [INFO]`, message)
    this.logToFile('info', message)
  }

  public warn(...args: any[]) {
    const message = this.formatMessage(args)
    // console.warn(`🚀[${this.category}] [WARN]`, message)
    this.logToFile('warn', message)
  }

  public error(...args: any[]) {
    const message = this.formatMessage(args)
    // console.error(`🚀[${this.category}] [ERROR]`, message)
    this.logToFile('error', message)
  }
}
