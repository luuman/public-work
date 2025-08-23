import { appLog } from '@/presenter/logPresenter'
import path from 'path'
import { app } from 'electron'
import { eventBus } from '@/events/eventbus'
import { IPresenter } from '@shared/presenter'
import { ConfigPresenter } from './configPresenter'
import { WindowPresenter } from './windowPresenter'
// import { SQLitePresenter } from './sqlitePresenter'

export class Presenter implements IPresenter {
  configPresenter: ConfigPresenter
  windowPresenter: WindowPresenter
  trayPresenter: any
  shortcutPresenter: any
  devicePresenter: any

  constructor() {
    console.log('🫁 IPresenter')
    this.configPresenter = new ConfigPresenter()
    this.windowPresenter = new WindowPresenter(this.configPresenter)

    this.trayPresenter = null
    this.shortcutPresenter = null
    this.devicePresenter = null
    this.sqlitePresenter = null
  }

  setupEventBus() {
    eventBus.setWindowPresenter(this.windowPresenter)
  }

  // Phase 2: 主窗口 Ready 后加载
  init() {
    this.setupTray()
    this.setupEventBus()

    Promise.all([
      import('./shortcutPresenter').then(({ ShortcutPresenter }) => {
        this.shortcutPresenter = new ShortcutPresenter(this.configPresenter)
      }),
      import('./devicePresenter').then(({ DevicePresenter }) => {
        this.devicePresenter = new DevicePresenter()
      }),
      // import('./sqlitePresenter').then(({ SQLitePresenter }) => {
      // }),
    ])

    // // 动态导入，减少冷启动负担
    // const { ShortcutPresenter } = await import('./shortcutPresenter')
    // this.shortcutPresenter = new ShortcutPresenter(this.configPresenter)

    // const { DevicePresenter } = await import('./devicePresenter')
    // this.devicePresenter = new DevicePresenter()

    // ✅ Phase 3: 后台执行耗时任务
    setTimeout(() => {
      this.collectSystemInfo()
    }, 1500)
  }

  async setupTray() {
    appLog.info('setupTray', !!this.trayPresenter)
    if (!this.trayPresenter) {
      const { TrayPresenter } = await import('./trayPresenters')
      this.trayPresenter = new TrayPresenter()
      this.trayPresenter.init()
    }
  }

  async collectSystemInfo() {
    if (!this.devicePresenter) return

    try {
      const dbDir = path.join(app.getPath('userData'), 'app_db')
      const dbPath = path.join(dbDir, 'chat.db')
      appLog.info('collectSystemInfo', dbPath)
      const workerPath = path.resolve(__dirname, './worker/dbWorker.js')
      appLog.log('🤚 collectSystemInfo:dbPath', dbPath)
      appLog.log('🤚 collectSystemInfo:dbDir', dbDir)
      appLog.log('🤚 collectSystemInfo:workerPath', workerPath)
      const { SQLitePresenter } = await import('./sqlitePresenter')

      this.sqlitePresenter = new SQLitePresenter(dbPath, workerPath)

      // 查询对话列表

      this.sqlitePresenter.proxy
        .getConversationList(1, 20)
        .then((res) => appLog.info('getConversationList result', res))
        .catch((err) => appLog.error('getConversationList error', err))

      this.sqlitePresenter.proxy
        .getConversation('qe6ih8v-wq4X-tbygftdm')
        .then((res) => appLog.info('getConversationList result', res))
        .catch((err) => appLog.error('getConversationList error', err))

      // 插入消息
      // 调用 insertMessage，不用手写包装函数
      // this.sqlitePresenter.proxy
      //   .insertMessage(
      //     'conv1',
      //     '你好',
      //     'user',
      //     '', // parentId
      //     '{}', // metadata
      //     1, // orderSeq
      //     0, // tokenCount
      //     'pending', // status
      //     0, // isContextEdge
      //     0, // isVariant
      //   )
      //   .then((messageId) => {
      //     appLog.log('插入成功，消息ID:', messageId)
      //   })
      //   .catch(appLog.error)

      this.sqlitePresenter.proxy
        .createConversation('多少钱')
        .then((res) => appLog.info('getConversationList result', res))
        .catch((err) => appLog.error('getConversationList error', err))
    } catch (error) {
      appLog.info('collectSystemInfo', error)
    }

    //   // 初始化 SQLite 数据库路径
    // const dbDirSQLitePresenter = path.join(app.getPath('userData'), 'app_db')
    // const dbPath = path.join(dbDir, 'chat.db')
    // this.sqlitePresenter = new SQLitePresenter(dbPath)

    await Promise.all([
      this.devicePresenter.getDeviceInfo(),
      this.devicePresenter.getCPUUsage(),
      this.devicePresenter.getMemoryUsage(),
      this.devicePresenter.getDiskSpace(),
    ])
  }

  destroy() {
    this.shortcutPresenter?.destroy() // 销毁快捷键监听
    this.trayPresenter?.destroy?.() // 销毁托盘（如果需要）
  }
}

export const presenter = new Presenter()
