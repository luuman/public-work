import path from 'path'
import { app } from 'electron'
import { appenderNames, categoryNames } from './config'
import { WorkerManager } from '../../lib/workerManager'
import { CategoryLogger } from './categorysLogger'

// LogPresenter
export class LogPresenter {
  private logWorker: WorkerManager
  private loggers: Record<string, CategoryLogger> = {}

  constructor() {
    const originalConsole = { ...console }
    ;['log', 'warn', 'error', 'debug', 'info'].forEach((method) => {
      console[method] = (...args) => {
        const timestamp = new Date().toISOString()
        originalConsole[method](`[${timestamp}]`, ...args)
      }
    })

    const workerPath = path.resolve(__dirname, './worker/log4jsWorker.js')
    // const workerPath = path.resolve(__dirname, './worker/logWorker.js')

    this.logWorker = new WorkerManager(workerPath, {
      logPath: path.join(app.getPath('userData')),
      isDev: !app.isPackaged,
      appenderNames,
      categoryNames,
      APP_NAME: app.getName(),
    })

    // 为每个 category 创建单独 logger 实例
    categoryNames.forEach((category: any) => {
      this.loggers[category.categoryName] = new CategoryLogger(
        category.categoryName,
        this.logWorker,
      )
    })
    appenderNames.forEach((category: any) => {
      this.loggers[category.appenderName] = new CategoryLogger(
        category.appenderName,
        this.logWorker,
      )
    })
  }

  // 通过 category 获取 logger
  public getLogger(category: string): CategoryLogger {
    return this.loggers[category || app.getName()]
  }

  public destroy() {
    this.logWorker.terminate()
  }
}

// 使用单例
export const logPresenter = new LogPresenter()
