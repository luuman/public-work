import path from 'path'
// import { appenderNames, categoryNames } from './config'
import { WorkerManager } from '../../lib/workerManager'
// import { CategoryLogger } from './categorysLogger'

// SQLitePresenter
export class SQLitePresenter {
  private dbWorker: WorkerManager

  constructor(dbPath: string, workerPath: string) {
    if (__DEV__) performance.mark('sqlite:start')
    const dbDir = path.dirname(dbPath)

    console.log('🤚 SQLitePresenter:dbPath', dbPath)
    console.log('🤚 SQLitePresenter:dbDir', dbDir)
    console.log('🤚 SQLitePresenter:workerPath', workerPath)

    const dbKey = 'mySecretKey'
    const cipherMode = 'aes-256-cbc'

    this.dbWorker = new WorkerManager(workerPath, {
      dbDir,
      dbPath,
      dbKey,
      cipherMode,
    })
  }

  //   // 执行 SQL（增删改）
  //   run(sql: string, params: any[] = []) {
  //     return this.dbWorker.postMessage('run', sql, params)
  //   }

  //   // 获取单条数据
  //   get(sql: string, params: any[] = []) {
  //     return this.dbWorker.postMessage('get', sql, params)
  //   }

  //   // 获取多条数据
  //   all(sql: string, params: any[] = []) {
  //     return this.dbWorker.postMessage('all', sql, params)
  //   }

  terminate() {
    this.dbWorker.terminate()
  }
}

// 使用单例
// export const sqlitePresenter = new SQLitePresenter()
