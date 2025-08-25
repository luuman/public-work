import { LogWorker } from '@/lib/log4jsWorker'

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'TRACE' | 'FATAL'
export class CategoryLogger {
  constructor(
    private category: string,
    private logWorker: LogWorker,
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
    // const fileName = `${this.category}.${level}.log`
    // this.logWorker.postMessage({ level, message, fileName })
    this.logWorker.log(this.category, level, message)
  }

  public info(...args: any[]) {
    const message = this.formatMessage(args)
    console.log(`📅[DBLog ${this.category}] [INFO]`, message)
    this.logToFile('INFO', message)
  }

  public warn(...args: any[]) {
    const message = this.formatMessage(args)
    console.warn(`📅[DBLog ${this.category}] [WARN]`, message)
    this.logToFile('WARN', message)
  }

  public error(...args: any[]) {
    const message = this.formatMessage(args)
    console.error(`📅[DBLog ${this.category}] [ERROR]`, message)
    this.logToFile('ERROR', message)
  }

  public debug(...args: any[]) {
    const message = this.formatMessage(args)
    console.debug(`📅[DBLog ${this.category}] [DEBUG]`, message)
    this.logToFile('DEBUG', message)
  }

  public trace(...args: any[]) {
    const message = this.formatMessage(args)
    console.trace(`📅[DBLog ${this.category}] [TRACE]`, message)
    this.logToFile('TRACE', message)
  }

  public fatal(...args: any[]) {
    const message = this.formatMessage(args)
    console.log(`📅[DBLog ${this.category}] [FATAL]`, message)
    this.logToFile('FATAL', message)
  }
}
