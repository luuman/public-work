import { parentPort, workerData } from 'worker_threads'
import { DbWorker } from './dbWorker'
import { LogWorker } from '../log4jsWorker'

export interface DBWorkerData {
  dbPath: string
  dbKey: string
}

// 集成数据库和日志的Worker类
export class sqlite3Worker extends LogWorker {
  private db: DbWorker

  constructor(workerData: DBWorkerData) {
    super(workerData)
    this.initializeDatabase()
  }

  /**
   * 初始化数据库
   */
  private initializeDatabase(): void {
    const { dbPath, dbKey } = this.workerData

    try {
      this.db = new DbWorker(dbPath, dbKey)
      this.log('database', 'info', `Database worker initialized: ${dbPath}`)
    } catch (error) {
      this.log(
        'database',
        'error',
        `Failed to initialize database: ${(error as Error).message}`,
      )
      throw error
    }
  }

  /**
   * 执行数据库操作（带自动日志记录）
   */
  public async executeDbOperation(method: string, args: any[]): Promise<any> {
    try {
      // 记录操作开始
      this.log('database', 'info', `DB Operation START: ${method}`, { args })

      if (typeof (this.db as any)[method] !== 'function') {
        throw new Error(`Unknown database method: ${method}`)
      }

      // 执行操作
      const result = await (this.db as any)[method](...args)

      // 记录操作成功
      this.log('database', 'info', `DB Operation SUCCESS: ${method}`)

      return result
    } catch (error) {
      // 记录操作失败
      this.log('database', 'error', `DB Operation FAILED: ${method}`, {
        error: (error as Error).message,
        args,
      })
      throw error
    }
  }

  /**
   * 设置数据（带日志）
   */
  public async set(key: string, value: any): Promise<void> {
    return this.executeDbOperation('set', [key, value])
  }

  /**
   * 获取数据（带日志）
   */
  public async get(key: string): Promise<any> {
    return this.executeDbOperation('get', [key])
  }

  /**
   * 删除数据（带日志）
   */
  public async delete(key: string): Promise<void> {
    return this.executeDbOperation('delete', [key])
  }

  /**
   * 获取所有数据（带日志）
   */
  public async getAll(): Promise<Record<string, any>> {
    return this.executeDbOperation('getAll', [])
  }

  /**
   * 处理消息
   */
  //   public handleMessage(data: any): void {
  //     const { id, type, payload } = data

  //     try {
  //       if (type === 'db-operation') {
  //         this.handleDbOperation(id, payload)
  //       } else if (type === 'log') {
  //         this.handleLogOperation(id, payload)
  //       } else {
  //         throw new Error(`Unknown message type: ${type}`)
  //       }
  //     } catch (error) {
  //       this.bufferedLog(
  //         'error',
  //         `Error processing message: ${(error as Error).message}`,
  //       )
  //       this.sendResponse(id, 'error', null, (error as Error).message)
  //     }
  //   }

  /**
   * 处理数据库操作
   */
  private async handleDbOperation(
    id: string | number,
    payload: any,
  ): Promise<void> {
    const { method, args } = payload
    const result = await this.executeDbOperation(method, args)
    this.sendResponse(id, 'success', result)
  }

  /**
   * 处理日志操作
   */
  private handleLogOperation(id: string | number, payload: any): void {
    const { fileName, message, level } = payload

    if (level) {
      this.log(fileName || 'default', level, message)
    } else {
      this.bufferedLog(fileName || 'default', message)
    }

    this.sendResponse(id, 'success', 'logged')
  }

  /**
   * 发送响应
   */
  private sendResponse(
    id: string | number,
    type: 'success' | 'error',
    result?: any,
    error?: string,
  ): void {
    if (parentPort) {
      parentPort.postMessage({ id, type, result, error })
    }
  }
}
