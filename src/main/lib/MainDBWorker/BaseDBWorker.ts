// BaseDBWorker.ts
import Database from 'better-sqlite3-multiple-ciphers'
import { BaseLogWorker } from './BaseLogWorker'
import { parentPort } from 'worker_threads'

export class BaseDBWorker {
  protected db: Database.Database | null = null
  protected dbPath: string
  protected dbKey: string
  protected dbName: string
  protected logWorker: BaseLogWorker
  protected isConnected: boolean = false

  constructor(workerData: any, logWorker: BaseLogWorker) {
    this.dbPath = workerData.dbPath
    this.dbKey = workerData.dbKey
    this.dbName = workerData.dbName
    this.logWorker = logWorker
  }

  async connect(): Promise<boolean> {
    try {
      if (this.isConnected) {
        this.logWorker.warn(`Database ${this.dbName} already connected`)
        return true
      }

      this.db = new Database(this.dbPath)

      // 设置加密密钥
      if (this.dbKey) {
        this.db.pragma(`key='${this.dbKey}'`)
      }

      // 优化设置
      this.db.pragma('foreign_keys = ON')
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('synchronous = NORMAL')

      this.isConnected = true
      this.logWorker.info(`Database ${this.dbName} connected: ${this.dbPath}`)

      return true
    } catch (error) {
      this.logWorker.error(
        `Database ${this.dbName} connection failed: ${error}`,
      )
      throw error
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      if (this.db) {
        this.db.close()
        this.db = null
        this.isConnected = false
        this.logWorker.info(`Database ${this.dbName} disconnected`)
      }
      return true
    } catch (error) {
      this.logWorker.error(
        `Database ${this.dbName} disconnection failed: ${error}`,
      )
      throw error
    }
  }

  async exec(sql: string): Promise<boolean> {
    this.ensureConnected()
    try {
      this.db!.exec(sql)
      this.logWorker.debug(`[${this.dbName}] Executed SQL: ${sql}`)
      return true
    } catch (error) {
      this.logWorker.error(
        `[${this.dbName}] SQL execution failed: ${sql}, Error: ${error}`,
      )
      throw error
    }
  }

  async queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    this.ensureConnected()
    try {
      const stmt = this.db!.prepare(sql)
      const result = stmt.all(...params) as T[]
      this.logWorker.debug(`[${this.dbName}] Query executed: ${sql}`)
      return result
    } catch (error) {
      this.logWorker.error(
        `[${this.dbName}] Query failed: ${sql}, Error: ${error}`,
      )
      throw error
    }
  }

  async queryGet<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    this.ensureConnected()
    try {
      const stmt = this.db!.prepare(sql)
      const result = stmt.get(...params) as T
      this.logWorker.debug(`[${this.dbName}] Query executed: ${sql}`)
      return result || null
    } catch (error) {
      this.logWorker.error(
        `[${this.dbName}] Query failed: ${sql}, Error: ${error}`,
      )
      throw error
    }
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    this.ensureConnected()
    try {
      const stmt = this.db!.prepare(sql)
      const result = stmt.run(...params)
      this.logWorker.debug(`[${this.dbName}] Run executed: ${sql}`)
      return result
    } catch (error) {
      this.logWorker.error(
        `[${this.dbName}] Run failed: ${sql}, Error: ${error}`,
      )
      throw error
    }
  }

  protected ensureConnected(): void {
    if (!this.isConnected || !this.db) {
      throw new Error(`Database ${this.dbName} not connected`)
    }
  }

  getDatabaseInfo(): any {
    return {
      name: this.dbName,
      path: this.dbPath,
      isConnected: this.isConnected,
    }
  }
}
