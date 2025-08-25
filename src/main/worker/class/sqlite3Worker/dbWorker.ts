import Database from 'better-sqlite3-multiple-ciphers'
import { parentPort, workerData } from 'worker_threads'

// 定义类型
export interface DbWorkerData {
  dbPath: string
  dbKey: string
  schema?: TableSchema[]
  options?: Database.Options
}

export interface TableSchema {
  name: string
  columns: ColumnDefinition[]
  indexes?: IndexDefinition[]
}

export interface ColumnDefinition {
  name: string
  type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'NUMERIC'
  constraints?: string[]
}

export interface IndexDefinition {
  name: string
  columns: string[]
  unique?: boolean
}

export interface QueryResult {
  success: boolean
  data?: any
  error?: string
  changes?: number
  lastInsertRowid?: number
}

export class DbWorker {
  private db: Database.Database | null = null
  private preparedStatements: Map<string, Database.Statement> = new Map()
  private isInitialized: boolean = false

  constructor(private workerData: DbWorkerData) {
    this.initialize()
  }

  /**
   * 初始化数据库连接
   */
  private initialize(): void {
    try {
      const { dbPath, dbKey, options = {} } = this.workerData

      // 创建数据库连接
      this.db = new Database(dbPath, {
        verbose: console.log, // 可选：用于调试
        ...options,
      })

      // 设置加密密钥
      if (dbKey) {
        this.db.pragma(`key = '${dbKey}'`)
      }

      // 性能优化设置
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('synchronous = NORMAL')
      this.db.pragma('foreign_keys = ON')

      // 初始化表结构
      this.initSchema()

      this.isInitialized = true

      // 设置消息监听器
      if (parentPort) {
        parentPort.on('message', (data: any) => {
          this.handleMessage(data)
        })
      }
    } catch (error) {
      console.error('Failed to initialize DbWorker:', error)
      throw error
    }
  }

  /**
   * 初始化数据库表结构
   */
  private initSchema(): void {
    const { schema } = this.workerData

    if (!schema || schema.length === 0) {
      // 默认表结构
      this.createTable('config', [
        { name: 'key', type: 'TEXT', constraints: ['PRIMARY KEY', 'NOT NULL'] },
        { name: 'value', type: 'TEXT', constraints: ['NOT NULL'] },
        {
          name: 'created_at',
          type: 'INTEGER',
          constraints: ["DEFAULT (strftime('%s','now'))"],
        },
        {
          name: 'updated_at',
          type: 'INTEGER',
          constraints: ["DEFAULT (strftime('%s','now'))"],
        },
      ])

      this.createTable('data', [
        { name: 'id', type: 'TEXT', constraints: ['PRIMARY KEY', 'NOT NULL'] },
        { name: 'value', type: 'TEXT', constraints: ['NOT NULL'] },
        { name: 'type', type: 'TEXT', constraints: ['NOT NULL'] },
        {
          name: 'created_at',
          type: 'INTEGER',
          constraints: ["DEFAULT (strftime('%s','now'))"],
        },
        {
          name: 'updated_at',
          type: 'INTEGER',
          constraints: ["DEFAULT (strftime('%s','now'))"],
        },
      ])

      // 创建索引
      this.createIndex('data', 'idx_data_type', ['type'])
      return
    }

    // 使用提供的schema创建表
    schema.forEach((table) => {
      this.createTable(table.name, table.columns)

      // 创建索引
      if (table.indexes) {
        table.indexes.forEach((index) => {
          this.createIndex(table.name, index.name, index.columns, index.unique)
        })
      }
    })
  }

  /**
   * 创建表
   */
  private createTable(tableName: string, columns: ColumnDefinition[]): void {
    if (!this.db) throw new Error('Database not initialized')

    const columnDefs = columns
      .map((col) => {
        const constraints = col.constraints ? col.constraints.join(' ') : ''
        return `${col.name} ${col.type} ${constraints}`.trim()
      })
      .join(', ')

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefs})`
    this.db.exec(sql)
  }

  /**
   * 创建索引
   */
  private createIndex(
    tableName: string,
    indexName: string,
    columns: string[],
    unique: boolean = false,
  ): void {
    if (!this.db) throw new Error('Database not initialized')

    const uniqueClause = unique ? 'UNIQUE' : ''
    const columnsList = columns.join(', ')
    const sql = `CREATE ${uniqueClause} INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${columnsList})`

    this.db.exec(sql)
  }

  /**
   * 准备SQL语句（带缓存）
   */
  private prepareStatement(sql: string): Database.Statement {
    if (!this.db) throw new Error('Database not initialized')

    if (this.preparedStatements.has(sql)) {
      return this.preparedStatements.get(sql)!
    }

    const statement = this.db.prepare(sql)
    this.preparedStatements.set(sql, statement)
    return statement
  }

  /**
   * 处理消息
   */
  private handleMessage(data: any): void {
    const { id, method, args = [] } = data

    try {
      if (typeof (this as any)[method] !== 'function') {
        throw new Error(`Unknown method: ${method}`)
      }

      const result = (this as any)[method](...args)

      if (parentPort) {
        parentPort.postMessage({ id, result })
      }
    } catch (error) {
      if (parentPort) {
        parentPort.postMessage({
          id,
          error: (error as Error).message,
        })
      }
    }
  }

  /**
   * 设置数据
   */
  public set(key: string, value: any): QueryResult {
    try {
      if (!this.isInitialized) throw new Error('Database not initialized')

      const jsonValue = JSON.stringify(value)
      const type = typeof value

      const stmt = this.prepareStatement(`
        INSERT INTO data (id, value, type, updated_at) 
        VALUES (?, ?, ?, strftime('%s','now'))
        ON CONFLICT(id) DO UPDATE SET 
          value = excluded.value, 
          type = excluded.type,
          updated_at = excluded.updated_at
      `)

      const result = stmt.run(key, jsonValue, type)

      return {
        success: true,
        changes: result.changes,
        lastInsertRowid: Number(result.lastInsertRowid),
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * 获取数据
   */
  public get(key: string): QueryResult {
    try {
      if (!this.isInitialized) throw new Error('Database not initialized')

      const stmt = this.prepareStatement(
        'SELECT value, type FROM data WHERE id = ?',
      )
      const row = stmt.get(key) as { value: string; type: string } | undefined

      if (!row) {
        return { success: true, data: null }
      }

      // 根据存储的类型解析值
      let data: any
      try {
        data = JSON.parse(row.value)
      } catch {
        // 如果JSON解析失败，返回原始字符串
        data = row.value
      }

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * 删除数据
   */
  public delete(key: string): QueryResult {
    try {
      if (!this.isInitialized) throw new Error('Database not initialized')

      const stmt = this.prepareStatement('DELETE FROM data WHERE id = ?')
      const result = stmt.run(key)

      return {
        success: true,
        changes: result.changes,
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * 获取所有数据
   */
  public getAll(): QueryResult {
    try {
      if (!this.isInitialized) throw new Error('Database not initialized')

      const stmt = this.prepareStatement('SELECT id, value, type FROM data')
      const rows = stmt.all() as Array<{
        id: string
        value: string
        type: string
      }>

      const result: Record<string, any> = {}
      rows.forEach((row) => {
        try {
          result[row.id] = JSON.parse(row.value)
        } catch {
          result[row.id] = row.value
        }
      })

      return { success: true, data: result }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * 执行SQL查询
   */
  public query(sql: string, params: any[] = []): QueryResult {
    try {
      if (!this.isInitialized) throw new Error('Database not initialized')

      const stmt = this.prepareStatement(sql)

      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const rows = stmt.all(...params)
        return { success: true, data: rows }
      } else {
        const result = stmt.run(...params)
        return {
          success: true,
          changes: result.changes,
          lastInsertRowid: Number(result.lastInsertRowid),
        }
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * 批量操作
   */
  public batch(
    operations: Array<{ method: string; args: any[] }>,
  ): QueryResult {
    try {
      if (!this.isInitialized) throw new Error('Database not initialized')
      if (!this.db) throw new Error('Database not initialized')

      const results: any[] = []

      this.db.transaction(() => {
        operations.forEach((op) => {
          if (typeof (this as any)[op.method] === 'function') {
            const result = (this as any)[op.method](...op.args)
            results.push(result)
          } else {
            throw new Error(`Unknown method in batch: ${op.method}`)
          }
        })
      })()

      return { success: true, data: results }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * 备份数据库
   */
  public backup(backupPath: string): QueryResult {
    try {
      if (!this.isInitialized) throw new Error('Database not initialized')
      if (!this.db) throw new Error('Database not initialized')

      const backupDb = new Database(backupPath)
      this.db.backup(backupDb)
      backupDb.close()

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * 获取数据库信息
   */
  public getInfo(): QueryResult {
    try {
      if (!this.isInitialized) throw new Error('Database not initialized')
      if (!this.db) throw new Error('Database not initialized')

      const tables = this.db
        .prepare(
          `
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `,
        )
        .all()

      const tableCounts: Record<string, number> = {}
      tables.forEach((table: any) => {
        const count = this.db!.prepare(
          `SELECT COUNT(*) as count FROM ${table.name}`,
        ).get() as { count: number }
        tableCounts[table.name] = count.count
      })

      return {
        success: true,
        data: {
          tables: tables.map((t: any) => t.name),
          tableCounts,
          totalSize: this.db
            .prepare(
              'SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()',
            )
            .get(),
        },
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * 清理资源
   */
  public close(): void {
    // 清理预处理语句
    this.preparedStatements.clear()

    // 关闭数据库连接
    if (this.db) {
      this.db.close()
      this.db = null
    }

    this.isInitialized = false
  }

  /**
   * 检查数据库是否初始化
   */
  public isReady(): boolean {
    return this.isInitialized && this.db !== null
  }
}

// 创建并导出实例
if (parentPort) {
  const dbWorker = new DbWorker(workerData as DbWorkerData)

  // 处理进程退出
  process.on('exit', () => {
    dbWorker.close()
  })

  process.on('SIGINT', () => {
    dbWorker.close()
    process.exit(0)
  })
}
