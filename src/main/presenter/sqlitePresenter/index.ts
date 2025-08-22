import path from 'path'
import { WorkerManager } from '../../lib/workerManager'

export class SQLitePresenter {
  private dbWorker: WorkerManager

  constructor(dbPath: string, workerPath: string) {
    if (__DEV__) performance.mark('sqlite:start')
    const dbDir = path.dirname(dbPath)

    // console.log('🤚 SQLitePresenter:dbPath', dbPath)
    // console.log('🤚 SQLitePresenter:dbDir', dbDir)
    // console.log('🤚 SQLitePresenter:workerPath', workerPath)

    const dbKey = 'mySecretKey'
    const cipherMode = 'aes-256-cbc'

    this.dbWorker = new WorkerManager(workerPath, {
      dbDir,
      dbPath,
      dbKey,
      cipherMode,
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
