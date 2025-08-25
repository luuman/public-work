// MainDBWorker.ts
import { parentPort } from 'worker_threads'
import { BaseLogWorker } from './BaseLogWorker'
import { BaseDBWorker } from './BaseDBWorker'
import { CombinedWorkerData } from './types'

export class MainDBWorker {
  private logWorker: BaseLogWorker
  private dbWorkers: Map<string, BaseDBWorker> = new Map()
  private mainDB: BaseDBWorker

  constructor(workerData: CombinedWorkerData) {
    // 初始化日志工作者
    this.logWorker = new BaseLogWorker(workerData)

    // 初始化主数据库
    this.mainDB = new BaseDBWorker(workerData, this.logWorker)
    this.dbWorkers.set('main', this.mainDB)

    this.setupMessageHandler()
    this.initializeDatabases()
  }

  private async initializeDatabases(): Promise<void> {
    try {
      await this.mainDB.connect()
      await this.createLogTable()
      this.logWorker.info('Main database worker initialized')
    } catch (error) {
      this.logWorker.error('Failed to initialize main database: ' + error)
    }
  }

  private async createLogTable(): Promise<void> {
    await this.mainDB.exec(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        db_name TEXT,
        operation TEXT
      )
    `)
  }

  private async logToDatabase(
    level: string,
    message: string,
    dbName?: string,
    operation?: string,
  ): Promise<void> {
    try {
      await this.mainDB.run(
        'INSERT INTO system_logs (level, message, db_name, operation) VALUES (?, ?, ?, ?)',
        [level, message, dbName || 'system', operation || ''],
      )
    } catch (error) {
      this.logWorker.error('Failed to log to database: ' + error)
    }
  }

  private setupMessageHandler(): void {
    if (!parentPort) return

    parentPort.on('message', async (message: any) => {
      try {
        const { id, type, operation, targetDb } = message

        let result: any
        switch (type) {
          case 'system':
            result = await this.handleSystemOperation(operation)
            break
          case 'db':
            result = await this.handleDBOperation(operation, targetDb)
            break
          case 'log':
            result = await this.handleLogOperation(operation)
            break
          default:
            throw new Error(`Unknown message type: ${type}`)
        }

        this.sendResponse(id, { success: true, data: result })
      } catch (error) {
        this.logWorker.error('Message handling failed: ' + error)
        this.sendResponse(message.id, {
          success: false,
          error: (error as Error).message,
        })
      }
    })
  }

  private async handleSystemOperation(operation: any): Promise<any> {
    switch (operation.action) {
      case 'createDatabase':
        return await this.createDatabaseWorker(operation.data)
      case 'listDatabases':
        return this.listDatabases()
      case 'getDatabaseInfo':
        return this.getDatabaseInfo(operation.data.dbName)
      default:
        throw new Error(`Unknown system operation: ${operation.action}`)
    }
  }

  private async handleDBOperation(
    operation: any,
    dbName: string,
  ): Promise<any> {
    const dbWorker = this.dbWorkers.get(dbName)
    if (!dbWorker) {
      throw new Error(`Database not found: ${dbName}`)
    }

    switch (operation.action) {
      case 'queryAll':
        return await dbWorker.queryAll(
          operation.data.sql,
          operation.data.params,
        )
      case 'queryGet':
        return await dbWorker.queryGet(
          operation.data.sql,
          operation.data.params,
        )
      case 'run':
        return await dbWorker.run(operation.data.sql, operation.data.params)
      case 'exec':
        return await dbWorker.exec(operation.data.sql)
      default:
        throw new Error(`Unknown DB operation: ${operation.action}`)
    }
  }

  private async handleLogOperation(operation: any): Promise<any> {
    await this.logToDatabase(
      operation.data.level,
      operation.data.message,
      operation.data.dbName,
      operation.data.operation,
    )
    return true
  }

  private async createDatabaseWorker(dbConfig: any): Promise<any> {
    const dbWorker = new BaseDBWorker(dbConfig, this.logWorker)
    await dbWorker.connect()
    this.dbWorkers.set(dbConfig.dbName, dbWorker)

    this.logWorker.info(`Created database worker: ${dbConfig.dbName}`)
    return { success: true, dbName: dbConfig.dbName }
  }

  private listDatabases(): any {
    const databases: any[] = []
    this.dbWorkers.forEach((worker, name) => {
      databases.push(worker.getDatabaseInfo())
    })
    return databases
  }

  private getDatabaseInfo(dbName: string): any {
    const worker = this.dbWorkers.get(dbName)
    if (!worker) {
      throw new Error(`Database not found: ${dbName}`)
    }
    return worker.getDatabaseInfo()
  }

  private sendResponse(id: number, response: any): void {
    if (parentPort) {
      parentPort.postMessage({ id, ...response })
    }
  }

  async destroy(): Promise<void> {
    for (const [name, worker] of this.dbWorkers) {
      await worker.disconnect()
    }
    this.logWorker.info('All database workers destroyed')
  }
}
