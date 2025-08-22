import Database from 'better-sqlite3-multiple-ciphers'
import path from 'path'
import fs from 'fs'
import { ConversationsTable } from './tables/conversations'
import { MessagesTable } from './tables/messages'
import { AttachmentsTable } from './tables/attachments'
import {
  ISQLitePresenter,
  SQLITE_MESSAGE,
  CONVERSATION,
  CONVERSATION_SETTINGS,
} from '@shared/presenter'
import { MessageAttachmentsTable } from './tables/messageAttachments'

/**
 * 导入模式枚举
 */
export enum ImportMode {
  INCREMENT = 'increment', // 增量导入
  OVERWRITE = 'overwrite', // 覆盖导入
}

export class dbWorker {
  private db!: Database.Database
  private conversationsTable!: ConversationsTable
  private messagesTable!: MessagesTable
  private attachmentsTable!: AttachmentsTable
  private messageAttachmentsTable!: MessageAttachmentsTable
  private currentVersion: number = 0
  private dbPath: string

  constructor(dbPath: string, password?: string) {
    this.dbPath = dbPath
    try {
      // 确保数据库目录存在
      const dbDir = path.dirname(dbPath)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
      }
      console.log('🫁 log:start', dbPath)

      // 初始化数据库连接
      this.db = new Database(dbPath)
      console.log('🫁 log:start', this.db)
      this.db.pragma('journal_mode = WAL')

      if (password) {
        this.db.pragma(`cipher='sqlcipher'`)
        this.db.pragma(`key='${password}'`)
      }

      // 尝试执行一个简单的查询来验证数据库是否正常
      this.db.prepare('SELECT 1').get()

      // 初始化所有表
      this.initTables()

      // 初始化版本表
      this.initVersionTable()

      // 执行迁移
      this.migrate()
    } catch (error) {
      console.error('Database initialization failed:', error)

      // 如果数据库已经打开，先关闭它
      if (this.db) {
        try {
          this.db.close()
        } catch (closeError) {
          console.error('Error closing database:', closeError)
        }
      }

      // 备份现有的损坏数据库
      this.backupDatabase()

      // 删除现有的数据库文件和相关的 WAL/SHM 文件
      this.cleanupDatabaseFiles()

      // 重新创建一个新的数据库
      this.db = new Database(dbPath)
      this.db.pragma('journal_mode = WAL')

      if (password) {
        this.db.pragma(`cipher='sqlcipher'`)
        this.db.pragma(`key='${password}'`)
      }

      // 重新初始化数据库
      this.initTables()
      this.initVersionTable()
      this.migrate()
    }
  }
  async deleteAllMessagesInConversation(conversationId: string): Promise<void> {
    return this.messagesTable.deleteAllInConversation(conversationId)
  }

  private backupDatabase(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = `${this.dbPath}.${timestamp}.bak`

    try {
      if (fs.existsSync(this.dbPath)) {
        fs.copyFileSync(this.dbPath, backupPath)
        console.log(`Database backed up to: ${backupPath}`)
      }
    } catch (error) {
      console.error('Error creating database backup:', error)
    }
  }

  private cleanupDatabaseFiles(): void {
    const filesToDelete = [
      this.dbPath,
      `${this.dbPath}-wal`,
      `${this.dbPath}-shm`,
    ]

    for (const file of filesToDelete) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file)
          console.log(`Deleted file: ${file}`)
        }
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error)
      }
    }
  }

  renameConversation(
    conversationId: string,
    title: string,
  ): Promise<CONVERSATION> {
    this.conversationsTable.rename(conversationId, title)
    return this.getConversation(conversationId)
  }

  private initTables() {
    this.conversationsTable = new ConversationsTable(this.db)
    this.messagesTable = new MessagesTable(this.db)
    this.attachmentsTable = new AttachmentsTable(this.db)
    this.messageAttachmentsTable = new MessageAttachmentsTable(this.db)

    // 创建所有表
    this.conversationsTable.createTable()
    this.messagesTable.createTable()
    this.attachmentsTable.createTable()
    this.messageAttachmentsTable.createTable()
  }

  private initVersionTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_versions (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      )
    `)

    const result = this.db
      .prepare('SELECT MAX(version) as version FROM schema_versions')
      .get() as {
      version: number
      applied_at: number
    }
    this.currentVersion = result?.version || 0
  }

  private migrate() {
    // 获取所有表的迁移脚本
    const migrations = new Map<number, string[]>()
    const tables = [
      this.conversationsTable,
      this.messagesTable,
      this.attachmentsTable,
      this.messageAttachmentsTable,
    ]

    // 获取最新的迁移版本
    const latestVersion = tables.reduce((maxVersion, table) => {
      const tableMaxVersion = table.getLatestVersion?.() || 0
      return Math.max(maxVersion, tableMaxVersion)
    }, 0)

    // 只迁移未执行的版本
    tables.forEach((table) => {
      for (
        let version = this.currentVersion + 1;
        version <= latestVersion;
        version++
      ) {
        const sql = table.getMigrationSQL?.(version)
        if (sql) {
          if (!migrations.has(version)) {
            migrations.set(version, [])
          }
          migrations.get(version)?.push(sql)
        }
      }
    })

    // 按版本号顺序执行迁移
    const versions = Array.from(migrations.keys()).sort((a, b) => a - b)

    for (const version of versions) {
      const migrationSQLs = migrations.get(version) || []
      if (migrationSQLs.length > 0) {
        console.log(`Executing migration version ${version}`)
        this.db.transaction(() => {
          migrationSQLs.forEach((sql) => {
            console.log(`Executing SQL: ${sql}`)
            this.db.exec(sql)
          })
          this.db
            .prepare(
              'INSERT INTO schema_versions (version, applied_at) VALUES (?, ?)',
            )
            .run(version, Date.now())
        })()
      }
    }
  }

  // 关闭数据库连接
  public close() {
    this.db.close()
  }

  // 创建新对话
  public async createConversation(
    title: string,
    settings: Partial<CONVERSATION_SETTINGS> = {},
  ): Promise<string> {
    return this.conversationsTable.create(title, settings)
  }

  // 获取对话信息
  public async getConversation(conversationId: string): Promise<CONVERSATION> {
    return this.conversationsTable.get(conversationId)
  }

  // 更新对话信息
  public async updateConversation(
    conversationId: string,
    data: Partial<CONVERSATION>,
  ): Promise<void> {
    return this.conversationsTable.update(conversationId, data)
  }

  // 获取对话列表
  public async getConversationList(
    page: number,
    pageSize: number,
  ): Promise<{ total: number; list: CONVERSATION[] }> {
    return this.conversationsTable.list(page, pageSize)
  }

  // 获取对话总数
  public async getConversationCount(): Promise<number> {
    return this.conversationsTable.count()
  }

  // 删除对话
  public async deleteConversation(conversationId: string): Promise<void> {
    return this.conversationsTable.delete(conversationId)
  }

  // 插入消息
  public async insertMessage(
    conversationId: string,
    content: string,
    role: string,
    parentId: string,
    metadata: string = '{}',
    orderSeq: number = 0,
    tokenCount: number = 0,
    status: string = 'pending',
    isContextEdge: number = 0,
    isVariant: number = 0,
  ): Promise<string> {
    return this.messagesTable.insert(
      conversationId,
      content,
      role,
      parentId,
      metadata,
      orderSeq,
      tokenCount,
      status,
      isContextEdge,
      isVariant,
    )
  }

  // 查询消息
  public async queryMessages(
    conversationId: string,
  ): Promise<SQLITE_MESSAGE[]> {
    return this.messagesTable.query(conversationId)
  }

  // 更新消息
  public async updateMessage(
    messageId: string,
    data: {
      content?: string
      status?: string
      metadata?: string
      isContextEdge?: number
      tokenCount?: number
    },
  ): Promise<void> {
    return this.messagesTable.update(messageId, data)
  }

  // 删除消息
  public async deleteMessage(messageId: string): Promise<void> {
    return this.messagesTable.delete(messageId)
  }

  // 获取单条消息
  public async getMessage(messageId: string): Promise<SQLITE_MESSAGE | null> {
    return this.messagesTable.get(messageId)
  }

  // 获取消息变体
  public async getMessageVariants(
    messageId: string,
  ): Promise<SQLITE_MESSAGE[]> {
    return this.messagesTable.getVariants(messageId)
  }

  // 获取会话的最大消息序号
  public async getMaxOrderSeq(conversationId: string): Promise<number> {
    return this.messagesTable.getMaxOrderSeq(conversationId)
  }

  // 删除所有消息
  public async deleteAllMessages(): Promise<void> {
    return this.messagesTable.deleteAll()
  }

  // 执行事务
  public async runTransaction(operations: () => void): Promise<void> {
    await this.db.transaction(operations)()
  }

  public async getLastUserMessage(
    conversationId: string,
  ): Promise<SQLITE_MESSAGE | null> {
    return this.messagesTable.getLastUserMessage(conversationId)
  }

  public async getMainMessageByParentId(
    conversationId: string,
    parentId: string,
  ): Promise<SQLITE_MESSAGE | null> {
    return this.messagesTable.getMainMessageByParentId(conversationId, parentId)
  }

  // 添加消息附件
  public async addMessageAttachment(
    messageId: string,
    attachmentType: string,
    attachmentData: string,
  ): Promise<void> {
    return this.messageAttachmentsTable.add(
      messageId,
      attachmentType,
      attachmentData,
    )
  }

  // 获取消息附件
  public async getMessageAttachments(
    messageId: string,
    type: string,
  ): Promise<{ content: string }[]> {
    return this.messageAttachmentsTable.get(messageId, type)
  }
}
