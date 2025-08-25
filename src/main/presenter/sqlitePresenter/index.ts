import path from 'path'
import { app } from 'electron'
import { WorkerManager } from '../../lib/workerManager'

export class SQLitePresenter {
  private dbWorker: WorkerManager

  constructor(dbName: string, workerPath: string, dbKey?: string) {
    if (__DEV__) performance.mark('sqlite:start')
    const dbDir = path.join(app.getPath('userData'), 'app_db', dbName)
    const dbPath = path.join(dbDir, dbName + '.db')

    console.log('🤚 SQLitePresenter:dbPath', dbPath)
    console.log('🤚 SQLitePresenter:dbName', dbName)
    console.log('🤚 SQLitePresenter:workerPath', workerPath)

    const cipherMode = 'aes-256-cbc'

    this.dbWorker = new WorkerManager(workerPath, {
      dbName,
      dbPath,
      dbKey,
      cipherMode,
      isDev: !app.isPackaged,
    })
  }

  get proxy() {
    return new Proxy(
      {},
      {
        get: (_, method: string) => {
          return (...args: any[]) => this.dbWorker.call(method, ...args)
        },
      },
    ) as any
  }

  terminate() {
    this.dbWorker.terminate()
  }
}
