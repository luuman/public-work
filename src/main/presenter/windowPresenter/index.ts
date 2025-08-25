// src/main/presenter/windowPresenter/index.ts
import { BrowserWindow, nativeImage } from 'electron'
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
import { forwardConsoleToRenderer } from '@/utils/fCTRenderer'
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
  private isQuitting: boolean = false
  private readonly configPresenter: ConfigPresenter

  constructor(configPresenter: ConfigPresenter) {
    console.log('🫁 IWindowPresenter')
    this.configPresenter = configPresenter
    this.windowManager = new WindowManager()
  }

  init() {
    console.log('🫁 IWindowPresenter init')
    this.createMainWindow()
    this.setupIpcHandlers()
  }

  async createMainWindow(options?: {
    activateTabId?: number
    initialTab?: { url: string; icon?: string }
    x?: number
    y?: number
  }): Promise<number | null> {
    if (__DEV__) performance.mark('win:create')
    console.log('🫁 IWindowPresenter createMainWindow')

    const iconFile = nativeImage.createFromPath(
      process.platform === 'win32' ? iconWin : icon,
    )

    // 使用窗口状态管理器
    const mainWindowState = windowStateManager({
      defaultWidth: 800,
      defaultHeight: 620,
    })

    // 计算初始位置
    const initialX = options?.x ?? mainWindowState.x
    const initialY = Math.max(0, options?.y ?? mainWindowState.y ?? 0)

    // 创建浏览器窗口
    const mainWindow = new BrowserWindow({
      width: mainWindowState.width,
      height: mainWindowState.height,
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

    if (!mainWindow) {
      appLog.error('Failed to create shell window')
      return null
    }

    // 管理窗口状态
    mainWindowState.manage(mainWindow)

    mainWindow.webContents.on('did-finish-load', () => {
      if (__DEV__) performance.mark('win:did-finish-load')
      console.log('🫁 win:did-finish-load')
    })

    // 注册窗口事件
    this.windowEvents.setupWindowEvents(mainWindow)

    // 添加窗口到管理器
    const windowId = this.windowManager.addWindow(mainWindow)

    // 加载页面内容
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/index.html')
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    if (__DEV__) performance.mark('win:load-start')
    console.log('🫁 win:load-start')

    // 开发模式打开DevTools
    if (is.dev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
      // mainWindow.webContents.on(
      //   'console-message',
      //   (_event, _level, message) => {
      //     if (message.includes('Autofill')) return
      //     console.log(message)
      //   },
      // )
    }
    forwardConsoleToRenderer(mainWindow)

    appLog.info(`Shell window ${windowId} created successfully`)
    return windowId
  }

  get mainWindow(): BrowserWindow | undefined {
    return (
      this.windowManager.getMainWindow() ||
      this.windowManager.getAllWindows()[0]
    )
  }

  getFocusedWindow(): void {}

  minimize(windowId: number): void {
    this.windowActions.minimize(windowId)
  }

  maximize(windowId: number): void {
    this.windowActions.maximize(windowId)
  }

  close(windowId: number): void {
    this.windowActions.close(windowId)
  }

  async closeWindow(windowId: number): Promise<void> {
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

  async sendToDefaultTab(
    _channel: string,
    ..._args: unknown[]
  ): Promise<void> {}

  async sendToAllWindows(
    _channel: string,
    ..._args: unknown[]
  ): Promise<void> {}

  // sendToWindow(
  //   _windowId: number,
  //   _channel: string,
  //   ..._args: unknown[]
  // ): boolean {}

  /**
   * 设置应用级别事件监听
   */
  // private setupAppEventListeners(): void {
  //   app.on('before-quit', () => {
  //     this.isQuitting = true
  //   })
  // }

  /**
   * 设置IPC通信处理器
   */
  private setupIpcHandlers(): void {
    IpcHandlers.registerAll()
  }

  // private removeIpcHandlers(): void {
  //   IpcHandlers.unregisterAll()
  // }

  /**
   * 设置事件总线监听
   */
  // private setupEventBusListeners(): void {
  //   this.windowEvents.registerAll()
  // }

  // private removeEventBusListeners(): void {
  //   this.windowEvents.unregisterAll()
  // }

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
      this._windowActions = new WindowActions(this.windowManager)
    }
    return this._windowActions
  }
  private get windowFocus(): WindowFocus {
    if (!this._windowFocus) {
      this._windowFocus = new WindowFocus(this.windowManager)
    }
    return this._windowFocus
  }
}
