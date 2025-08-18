// src/main/presenter/windowPresenter/index.ts
import { BrowserWindow, shell, app, nativeImage, ipcMain } from 'electron'
import { join } from 'path'
import icon from '../../../../resources/icon.png?asset'
import iconWin from '../../../../resources/icon.ico?asset'
import { is } from '@electron-toolkit/utils'
// import { IWindowPresenter } from '@shared/presenter'
import { ConfigPresenter } from '../configPresenter'
import windowStateManager from 'electron-window-state'
import { appLog } from '@/presenter/logPresenter'
import { WindowManager } from './windowManager'
import { WindowEvents } from './windowEvents'
import { WindowActions } from './windowActions'
import { WindowFocus } from './windowFocus'
import { IpcHandlers } from './IpcHandlers'
import { IWindowPresenter } from './types'

/**
 * 窗口 Presenter - 主入口类
 *
 * 协调各子模块工作，提供高层API
 */
export class WindowPresenter implements IWindowPresenter {
  private readonly windowManager: WindowManager
  private _windowEvents: WindowEvents | null = null
  private _windowActions: WindowActions | null = null
  private _windowFocus: WindowFocus | null = null
  private _ipcHandlers: IpcHandlers | null = null
  private isQuitting: boolean = false
  private readonly configPresenter: ConfigPresenter

  constructor(configPresenter: ConfigPresenter) {
    this.configPresenter = configPresenter
    this.windowManager = new WindowManager()
    // this.windowFocus = new WindowFocus(this.windowManager)
    // this.windowActions = new WindowActions(this.windowManager, configPresenter)
    // this.windowEvents = new WindowEvents(
    //   this.windowManager,
    //   this.configPresenter,
    //   this.windowActions,
    //   this.isQuitting,
    //   this.windowManager.getMainWindowId(),
    // )
    // this.ipcHandlers = IpcHandlers

    // this.setupAppEventListeners()
    this.setupIpcHandlers()
    // this.setupEventBusListeners()
  }

  private get windowEvents(): WindowEvents {
    if (!this._windowEvents) {
      this._windowEvents = new WindowEvents(
        this.windowManager,
        this.configPresenter,
        this.windowActions,
        this.isQuitting,
        this.windowManager.getMainWindowId() ?? -1,
      )
    }
    return this._windowEvents
  }

  private get windowActions(): WindowActions {
    if (!this._windowActions) {
      this._windowActions = new WindowActions(
        this.windowManager,
        this.configPresenter,
      )
    }
    return this._windowActions
  }
  private get windowFocus(): WindowFocus {
    if (!this._windowFocus) {
      this._windowFocus = new WindowFocus(this.windowManager)
    }
    return this._windowFocus
  }

  private get ipcHandlers(): IpcHandlers {
    if (!this._ipcHandlers) {
      this._ipcHandlers = IpcHandlers
    }
    console.log('this._ipcHandlers', this._ipcHandlers)
    return this._ipcHandlers
  }

  // ========== 公共接口实现 ==========

  async createShellWindow(options?: {
    activateTabId?: number
    initialTab?: { url: string; icon?: string }
    x?: number
    y?: number
  }): Promise<number | null> {
    const iconFile = nativeImage.createFromPath(
      process.platform === 'win32' ? iconWin : icon,
    )

    // 使用窗口状态管理器
    const shellWindowState = windowStateManager({
      defaultWidth: 800,
      defaultHeight: 620,
    })

    // 计算初始位置
    const initialX = options?.x ?? shellWindowState.x
    const initialY = Math.max(0, options?.y ?? shellWindowState.y ?? 0)

    // 创建浏览器窗口
    const shellWindow = new BrowserWindow({
      width: shellWindowState.width,
      height: shellWindowState.height,
      x: initialX,
      y: initialY,
      show: false,
      autoHideMenuBar: true,
      icon: iconFile,
      titleBarStyle: 'hiddenInset',
      transparent: process.platform === 'darwin',
      vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
      backgroundColor: '#00000000',
      maximizable: true,
      frame: process.platform === 'darwin',
      hasShadow: true,
      trafficLightPosition:
        process.platform === 'darwin' ? { x: 12, y: 12 } : undefined,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        devTools: is.dev,
      },
      roundedCorners: true,
    })

    if (!shellWindow) {
      appLog.error('Failed to create shell window')
      return null
    }

    // 管理窗口状态
    shellWindowState.manage(shellWindow)

    // 注册窗口事件
    this.windowEvents.setupWindowEvents(shellWindow)

    // 添加窗口到管理器
    const windowId = this.windowManager.addWindow(shellWindow)

    // 加载页面内容
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      shellWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/index.html')
    } else {
      shellWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    // 开发模式打开DevTools
    if (is.dev) {
      shellWindow.webContents.openDevTools({ mode: 'detach' })
    }

    appLog.info(`Shell window ${windowId} created successfully`)
    return windowId
  }

  get mainWindow(): BrowserWindow | undefined {
    return (
      this.windowManager.getMainWindow() ||
      this.windowManager.getAllWindows()[0]
    )
  }

  minimize(windowId: number): void {
    this.windowActions.minimize(windowId)
  }

  maximize(windowId: number): void {
    this.windowActions.maximize(windowId)
  }

  close(windowId: number): void {
    this.windowActions.close(windowId)
  }

  async closeWindow(
    windowId: number,
    forceClose: boolean = false,
  ): Promise<void> {
    this.windowActions.close(windowId)
  }

  hide(windowId: number): void {
    this.windowActions.hide(windowId)
  }

  show(windowId?: number): void {
    this.windowActions.show(windowId)
  }

  previewFile(filePath: string): void {
    this.windowActions.previewFile(filePath)
  }

  isMaximized(windowId: number): boolean {
    const window = this.windowManager.getWindow(windowId)
    return !!window && !window.isDestroyed() && window.isMaximized()
  }

  isMainWindowFocused(windowId: number): boolean {
    return this.windowFocus.isWindowFocused(windowId)
  }

  getAllWindows(): BrowserWindow[] {
    return this.windowManager.getAllWindows()
  }

  async sendToAllWindows(channel: string, ...args: unknown[]): Promise<void> {}

  sendToWindow(
    windowId: number,
    channel: string,
    ...args: unknown[]
  ): boolean {}

  // ========== 私有方法 ==========

  /**
   * 设置应用级别事件监听
   */
  private setupAppEventListeners(): void {
    app.on('before-quit', () => {
      appLog.info('App is quitting, setting isQuitting flag')
      this.isQuitting = true
    })
  }

  /**
   * 设置IPC通信处理器
   */
  private setupIpcHandlers(): void {
    this.ipcHandlers.registerAll()
  }
  private removeIpcHandlers(): void {
    this.ipcHandlers.unregisterAll()
  }

  /**
   * 设置事件总线监听
   */
  private setupEventBusListeners(): void {
    this.windowEvents.registerAll()
  }

  private removeEventBusListeners(): void {
    this.windowEvents.unregisterAll()
  }
}
