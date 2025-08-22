import { appLog } from '@/presenter/logPresenter'
import path from 'path'
import { app } from 'electron'
import { eventBus } from '@/events/eventbus'
import { IPresenter } from '@shared/presenter'
import { ConfigPresenter } from './configPresenter'
import { WindowPresenter } from './windowPresenter'

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

    const dbDir = path.join(app.getPath('userData'), 'app_db')
    const dbPath = path.join(dbDir, 'chat.db')
    appLog.info('collectSystemInfo', dbPath)

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
