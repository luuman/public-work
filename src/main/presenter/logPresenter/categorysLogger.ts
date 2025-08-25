import { WorkerManager } from '../../lib/workerManager'

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'trace' | 'fatal' | 'log'
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
    console.log(`📅[Log ${this.category}] [INFO]`, message)
    this.logToFile('info', message)
  }

  public warn(...args: any[]) {
    const message = this.formatMessage(args)
    console.warn(`📅[Log ${this.category}] [WARN]`, message)
    this.logToFile('warn', message)
  }

  public error(...args: any[]) {
    const message = this.formatMessage(args)
    console.error(`📅[Log ${this.category}] [ERROR]`, message)
    this.logToFile('error', message)
  }

  public debug(...args: any[]) {
    const message = this.formatMessage(args)
    console.debug(`📅[Log ${this.category}] [DEBUG]`, message)
    this.logToFile('debug', message)
  }

  public trace(...args: any[]) {
    const message = this.formatMessage(args)
    console.trace(`📅[Log ${this.category}] [TRACE]`, message)
    this.logToFile('trace', message)
  }

  public fatal(...args: any[]) {
    const message = this.formatMessage(args)
    console.log(`📅[Log ${this.category}] [FATAL]`, message)
    this.logToFile('fatal', message)
  }

  public log(...args: any[]) {
    const message = this.formatMessage(args)
    console.log(`📅[Log ${this.category}] [LOG]`, message)
    this.logToFile('log', message)
  }
}
