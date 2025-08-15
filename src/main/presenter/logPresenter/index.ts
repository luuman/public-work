import { WorkerManager } from '@/worker/workerManager'
import path from 'path'
import { app } from 'electron'
import { appenderNames, categoryNames } from './config'

export class LogPresenter {
  private logWorker: WorkerManager

  constructor() {
    // const workerPath = path.resolve(__dirname, './worker/logWorker.js')
    const workerPath = path.resolve(__dirname, './worker/log4jsWorker.js')

    this.logWorker = new WorkerManager(workerPath, {
      logPath: path.join(app.getPath('userData')),
      isDev: !app.isPackaged,
      appenderNames,
      categoryNames,
      APP_NAME: app.getName(),
    })
  }

  public log(fileName: string, level: string, message: string) {
    this.logWorker.postMessage({ level, message, fileName })
  }

  public destroy() {
    this.logWorker.terminate()
  }
}
