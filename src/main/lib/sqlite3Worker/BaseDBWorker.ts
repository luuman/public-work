// BaseDBWorker.ts
import Database from 'better-sqlite3-multiple-ciphers'
import { dbLogs } from '@/lib/log4jsWorker'
import { parentPort } from 'worker_threads'
import { isNumber } from 'lodash'
import path from 'path'
import fs from 'fs'
import { CategoryLogger } from '@/lib/log4jsWorker/categorysLogger'

/**
 * SQLite数据库基础工作类
 * 提供数据库连接、断开连接、执行SQL语句等基础操作
 */
export class BaseDBWorker {
  // 数据库实例
  protected db: Database.Database | null = null
  // 数据库文件路径
  protected dbPath: string
  // 数据库加密密钥
  protected dbKey: string
  // 数据库名称（用于日志标识）
  protected dbName: string
  // 日志工作实例
  protected dbLogs: CategoryLogger
  // 数据库连接状态标志
  protected isConnected: boolean = false

  /**
   * 构造函数
   * @param workerData 工作线程数据，包含数据库路径、密钥和名称
   * @param dbLogs 日志工作实例，用于记录日志
   */
  constructor(workerData: any, dbLogs: CategoryLogger) {
    this.dbPath = workerData.dbPath
    this.dbKey = workerData.dbKey
    this.dbName = workerData.dbName
    this.dbLogs = dbLogs
    const dbDir = path.dirname(this.dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    console.log('🫁 log:start', this.dbPath)
  }

  /**
   * 连接到数据库
   * @returns 连接成功返回true，失败抛出异常
   */
  async connect(): Promise<boolean> {
    try {
      // 检查是否已连接
      if (this.isConnected) {
        this.dbLogs.warn(`Database ${this.dbName} already connected`)
        return true
      }

      // 创建数据库实例
      this.db = new Database(this.dbPath)

      // 设置加密密钥（如果提供了密钥）
      if (this.dbKey) {
        this.db.pragma(`key='${this.dbKey}'`)
      }

      // 优化数据库设置
      this.db.pragma('foreign_keys = ON') // 启用外键约束
      this.db.pragma('journal_mode = WAL') // 使用WAL日志模式提高并发性能
      this.db.pragma('synchronous = NORMAL') // 设置同步模式为NORMAL平衡性能和数据安全

      this.isConnected = true
      this.dbLogs.info(`Database ${this.dbName} connected: ${this.dbPath}`)

      return true
    } catch (error) {
      this.dbLogs.error(`Database ${this.dbName} connection failed: ${error}`)
      throw error
    }
  }

  /**
   * 断开数据库连接
   * @returns 断开成功返回true，失败抛出异常
   */
  async disconnect(): Promise<boolean> {
    try {
      if (this.db) {
        this.db.close()
        this.db = null
        this.isConnected = false
        this.dbLogs.info(`Database ${this.dbName} disconnected`)
      }
      return true
    } catch (error) {
      this.dbLogs.error(
        `Database ${this.dbName} disconnection failed: ${error}`,
      )
      throw error
    }
  }

  /**
   * 执行SQL语句（不返回结果）
   * @param sql 要执行的SQL语句
   * @returns 执行成功返回true，失败抛出异常
   */
  async exec(sql: string): Promise<boolean> {
    this.ensureConnected()
    try {
      this.db!.exec(sql)
      this.dbLogs.debug(`[${this.dbName}] Executed SQL: ${sql}`)
      return true
    } catch (error) {
      this.dbLogs.error(
        `[${this.dbName}] SQL execution failed: ${sql}, Error: ${error}`,
      )
      throw error
    }
  }

  /**
   * 查询多条记录
   * @template T 返回结果的类型
   * @param sql 查询SQL语句
   * @param params 查询参数数组
   * @returns 查询结果数组
   */
  async queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    this.ensureConnected()
    try {
      const stmt = this.db!.prepare(sql)
      const result = stmt.all(...params) as T[]
      this.dbLogs.debug(`[${this.dbName}] Query executed: ${sql}`)
      return result
    } catch (error) {
      this.dbLogs.error(
        `[${this.dbName}] Query failed: ${sql}, Error: ${error}`,
      )
      throw error
    }
  }

  /**
   * 查询单条记录
   * @template T 返回结果的类型
   * @param sql 查询SQL语句
   * @param params 查询参数数组
   * @returns 查询结果或null（未找到时）
   */
  async queryGet<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    this.ensureConnected()
    try {
      const stmt = this.db!.prepare(sql)
      const result = stmt.get(...params) as T
      this.dbLogs.debug(`[${this.dbName}] Query executed: ${sql}`)
      return result || null
    } catch (error) {
      this.dbLogs.error(
        `[${this.dbName}] Query failed: ${sql}, Error: ${error}`,
      )
      throw error
    }
  }

  /**
   * 执行INSERT、UPDATE、DELETE等操作
   * @param sql 要执行的SQL语句
   * @param params 参数数组
   * @returns 执行结果（包含lastInsertRowid和changes等信息）
   */
  async run(sql: string, params: any[] = []): Promise<any> {
    this.ensureConnected()
    try {
      const stmt = this.db!.prepare(sql)
      const result = stmt.run(...params)
      this.dbLogs.debug(`[${this.dbName}] Run executed: ${sql}`)
      return result
    } catch (error) {
      this.dbLogs.error(`[${this.dbName}] Run failed: ${sql}, Error: ${error}`)
      throw error
    }
  }

  /**
   * 确保数据库已连接
   * @throws 如果数据库未连接则抛出错误
   */
  protected ensureConnected(): void {
    if (!this.isConnected || !this.db) {
      throw new Error(`Database ${this.dbName} not connected`)
    }
  }

  private getDBInfo(): void {
    const info = [
      // 查询当前用户版本（user_version）
      'user_version',
      // 查询数据库页大小
      'page_size',
      // 查询加密算法类型
      'cipher',
      'schema_version',
      // 'cipher_list',
      'legacy',
      'legacy_page_size',
      // 查询 KDF 迭代次数
      'kdf_iter',
      'fast_kdf_iter',
      'hmac_use',
      'hmac_pgno',
      'hmac_salt_mask',
      // 查询 KDF 算法
      'kdf_algorithm',
      // 查询 HMAC 算法
      'hmac_algorithm',
      'hmac_algorithm_compat',
      'plaintext_header_size',
    ]
    info.forEach((pragma) =>
      console.log(`${pragma}:`, this.db!.pragma(pragma, { simple: true })),
    )
  }

  getSchemaVersion(): number {
    return this.db!.pragma('schema_version', { simple: true })
  }

  getSQLiteVersion(): string {
    const { sqlite_version: version } = this.db
      .prepare('select sqlite_version() AS sqlite_version')
      .get()

    return version
  }

  setUserVersion(version: number): void {
    if (!isNumber(version)) {
      throw new Error(`setUserVersion: version ${version} is not a number`)
    }
    this.db!.pragma(`user_version = ${version}`)
  }

  //   getUserVersion(): number {
  //     return this.db!.pragma('user_version', { simple: true })
  //   }

  /**
   * 获取或设置用户版本号
   * @param version 可选版本号，不提供时获取当前版本
   * @returns 版本号或设置结果
   */
  getUserVersion(version?: number): number | boolean {
    this.ensureConnected() // 确保数据库已连接

    if (version !== undefined) {
      // 设置版本号
      this.db!.pragma(`user_version = ${version}`)
      this.dbLogs.debug(`[${this.dbName}] Set user_version to: ${version}`)
      return true
    } else {
      // 获取版本号
      const result = this.db!.pragma('user_version', { simple: true }) as number
      this.dbLogs.debug(`[${this.dbName}] Get user_version: ${result}`)
      return result
    }
  }

  getSQLCipherVersion() {
    return this.db!.pragma('cipher_version', { simple: true })
  }

  /**
   * 获取数据库信息
   * @returns 包含数据库名称、路径和连接状态的对象
   */
  getDatabaseInfo(): any {
    return {
      name: this.dbName,
      path: this.dbPath,
      isConnected: this.isConnected,
    }
  }
}
