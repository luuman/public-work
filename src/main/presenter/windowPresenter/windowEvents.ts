// src/main/presenter/windowPresenter/WindowEvents.ts
import { BrowserWindow, app } from 'electron'
import { WindowManager } from './windowManager'
import { WindowActions } from './windowActions'
import { eventBus } from '@/events/eventbus'
import {
  WINDOW_EVENTS,
  SHORTCUT_EVENTS,
  SYSTEM_EVENTS,
  CONFIG_EVENTS,
} from '@/events/events'
import { presenter } from '../'
// import { TabPresenter } from '../tabPresenter'
import { appLog } from '@/presenter/logPresenter'

/**
 * 窗口事件处理器 - 负责管理所有与BrowserWindow相关的事件监听和处理
 *
 * 主要职责：
 * 1. 设置和管理窗口的各种事件监听
 * 2. 处理窗口生命周期事件（创建、显示、关闭等）
 * 3. 处理窗口状态变化事件（最大化、最小化、全屏等）
 * 4. 处理窗口焦点变化事件
 * 5. 协调窗口与标签页的交互
 */
export class WindowEvents {
  private windowManager: WindowManager
  private windowActions: WindowActions
  private configPresenter: any
  private isQuitting: boolean = false
  private mainWindowId: number | null = null

  /**
   * 构造函数
   * @param windowManager 窗口管理器实例，用于管理窗口状态
   * @param configPresenter 配置presenter，用于获取应用配置
   * @param isQuitting 应用是否正在退出
   * @param mainWindowId 主窗口ID
   */
  constructor(
    windowManager: WindowManager,
    configPresenter: any,
    windowActions: WindowActions,
    isQuitting: boolean,
    mainWindowId: number | null,
  ) {
    this.windowManager = windowManager
    this.configPresenter = configPresenter
    this.windowActions = windowActions
    this.isQuitting = isQuitting
    this.mainWindowId = mainWindowId
    console.log('🫁 app:ready', this.configPresenter)
  }

  /**
   * 设置窗口的所有事件监听
   * @param window 窗口实例
   */
  public setupWindowEvents(window: BrowserWindow): void {
    // const windowId = window.id

    // 关键事件立即注册（影响核心功能的必须事件）
    this.setupCriticalEvents(window)

    // 高频事件延迟注册（性能优化，减少初始负载）
    this.setupLazyEvents(window)

    // 窗口关闭相关事件（需要特殊处理的关闭逻辑）
    this.setupWindowCloseEvents(window)
  }

  /**
   * 设置关键窗口事件（立即注册）
   * 这些事件对应用核心功能至关重要，需要立即注册
   * @param window 窗口实例
   */
  private setupCriticalEvents(window: BrowserWindow): void {
    const windowId = window.id

    // 窗口准备就绪时显示 - 影响用户体验的关键事件
    window.on('ready-to-show', () => {
      appLog.info('ready-to-show')
      this.handleReadyToShow(windowId)
    })

    // 窗口获得焦点 - 影响用户交互的关键事件
    window.on('focus', () => {
      this.handleFocus(windowId)
    })

    // 窗口失去焦点 - 影响用户交互的关键事件
    window.on('blur', () => {
      this.handleBlur(windowId)
    })
  }

  /**
   * 设置高频窗口事件（延迟注册）
   * 这些事件触发频率高但对初始交互不关键，延迟注册以优化性能
   * @param window 窗口实例
   */
  private setupLazyEvents(window: BrowserWindow): void {
    const windowId = window.id
    let lazyEventsRegistered = false

    // 在窗口首次交互时注册高频事件的回调函数
    const registerLazyEvents = () => {
      if (lazyEventsRegistered) return
      lazyEventsRegistered = true

      // 窗口最大化事件 - 触发频率中等
      window.on('maximize', () => {
        this.handleMaximize(windowId)
      })

      // 窗口取消最大化事件 - 触发频率中等
      window.on('unmaximize', () => {
        this.handleUnmaximize(windowId)
      })

      // 窗口从最小化恢复事件 - 触发频率中等
      window.on('restore', () => {
        this.handleRestore(windowId)
      })

      // 窗口进入全屏事件 - 触发频率低
      window.on('enter-full-screen', () => {
        this.handleEnterFullScreen(windowId)
      })

      // 窗口退出全屏事件 - 触发频率低
      window.on('leave-full-screen', () => {
        this.handleLeaveFullScreen(windowId)
      })

      // 窗口尺寸改变事件 - 触发频率高
      window.on('resize', () => {
        this.handleResize(windowId)
      })

      // 移除一次性监听器以避免内存泄漏
      window.removeListener('focus', registerLazyEvents)
      window.removeListener('ready-to-show', registerLazyEvents)
    }

    // 在窗口首次获得焦点或准备显示时注册延迟事件
    window.once('focus', registerLazyEvents)
    window.once('ready-to-show', registerLazyEvents)
  }

  /**
   * 设置窗口关闭相关事件
   * 这些事件需要特殊处理逻辑，单独管理
   * @param window 窗口实例
   */
  private setupWindowCloseEvents(window: BrowserWindow): void {
    const windowId = window.id

    // 'close' 事件：用户尝试关闭窗口（可取消）
    window.on('close', (event) => {
      this.handleClose(windowId, event)
    })

    // 'closed' 事件：窗口实际关闭并销毁（不可取消）
    window.on('closed', () => {
      this.handleClosed(windowId)
    })
  }

  // ========== 事件处理方法 ==========

  /**
   * 处理窗口准备就绪事件
   * @param windowId 窗口ID
   */
  private handleReadyToShow(windowId: number): void {
    const window = this.windowManager.getWindow(windowId)
    if (window && !window.isDestroyed()) {
      window.show()
      eventBus.sendToMain(WINDOW_EVENTS.WINDOW_CREATED, windowId)
      appLog.info(`Window ${windowId} is ready to show.`)
    } else {
      appLog.warn(`Window ${windowId} was destroyed before ready-to-show.`)
    }
  }

  /**
   * 处理窗口获得焦点事件
   * @param windowId 窗口ID
   */
  private handleFocus(windowId: number): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) return

    appLog.info(`Window ${windowId} gained focus.`)
    eventBus.sendToMain(WINDOW_EVENTS.WINDOW_FOCUSED, windowId)
    window.webContents.send('window-focused', windowId)
    this.focusActiveTab(windowId, 'focus')
  }

  /**
   * 处理窗口失去焦点事件
   * @param windowId 窗口ID
   */
  private handleBlur(windowId: number): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) return

    appLog.info(`Window ${windowId} lost focus.`)
    eventBus.sendToMain(WINDOW_EVENTS.WINDOW_BLURRED, windowId)
    window.webContents.send('window-blurred', windowId)
  }

  /**
   * 处理窗口最大化事件
   * @param windowId 窗口ID
   */
  private handleMaximize(windowId: number): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) return

    appLog.info(`Window ${windowId} maximized.`)
    eventBus.sendToMain(WINDOW_EVENTS.WINDOW_MAXIMIZED, windowId)
    this.handleWindowRestore(windowId).catch((error) => {
      appLog.error(
        `Error handling restore after maximizing window ${windowId}:`,
        error,
      )
    })
  }

  /**
   * 处理窗口取消最大化事件
   * @param windowId 窗口ID
   */
  private handleUnmaximize(windowId: number): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) return

    appLog.info(`Window ${windowId} unmaximized.`)
    eventBus.sendToMain(WINDOW_EVENTS.WINDOW_UNMAXIMIZED, windowId)
    this.handleWindowRestore(windowId).catch((error) => {
      appLog.error(
        `Error handling restore after unmaximizing window ${windowId}:`,
        error,
      )
    })
  }

  /**
   * 处理窗口恢复事件（从最小化恢复）
   * @param windowId 窗口ID
   */
  private handleRestore(windowId: number): void {
    appLog.info(`Window ${windowId} restored.`)
    this.handleWindowRestore(windowId).catch((error) => {
      appLog.error(`Error handling restore for window ${windowId}:`, error)
    })
    this.focusActiveTab(windowId, 'restore')
    eventBus.sendToMain(WINDOW_EVENTS.WINDOW_RESTORED, windowId)
  }

  /**
   * 处理窗口进入全屏事件
   * @param windowId 窗口ID
   */
  private handleEnterFullScreen(windowId: number): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) return

    appLog.info(`Window ${windowId} entered fullscreen.`)
    eventBus.sendToMain(WINDOW_EVENTS.WINDOW_ENTER_FULL_SCREEN, windowId)
    this.handleWindowRestore(windowId).catch((error) => {
      appLog.error(
        `Error handling restore after entering fullscreen for window ${windowId}:`,
        error,
      )
    })
  }

  /**
   * 处理窗口退出全屏事件
   * @param windowId 窗口ID
   */
  private handleLeaveFullScreen(windowId: number): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) return

    appLog.info(`Window ${windowId} left fullscreen.`)
    eventBus.sendToMain(WINDOW_EVENTS.WINDOW_LEAVE_FULL_SCREEN, windowId)
    this.handleWindowRestore(windowId).catch((error) => {
      appLog.error(
        `Error handling restore after leaving fullscreen for window ${windowId}:`,
        error,
      )
    })
  }

  /**
   * 处理窗口尺寸改变事件
   * @param windowId 窗口ID
   */
  private handleResize(windowId: number): void {
    eventBus.sendToMain(WINDOW_EVENTS.WINDOW_RESIZE, windowId)
  }

  /**
   * 处理窗口关闭请求事件
   * @param windowId 窗口ID
   * @param event Electron事件对象（可取消）
   */
  private handleClose(windowId: number, event: Electron.Event): void {
    appLog.info(
      `Window ${windowId} close event. isQuitting: ${this.isQuitting}, Platform: ${process.platform}.`,
    )

    // 如果应用不是正在退出过程中...
    if (!this.isQuitting) {
      // const shouldQuitOnClose = this.configPresenter.getCloseToQuit()
      // const shouldPreventDefault =
      //   windowId === this.mainWindowId && !shouldQuitOnClose
      const shouldPreventDefault = windowId === this.mainWindowId
      if (shouldPreventDefault) {
        appLog.info(
          `Window ${windowId}: Preventing default close behavior, hiding instead.`,
        )
        event.preventDefault()
        this.hideWindow(windowId)
      } else {
        appLog.info(`Window ${windowId}: Allowing default close behavior.`)
      }
    } else {
      appLog.info(
        `Window ${windowId}: isQuitting is true, allowing default close behavior.`,
      )
    }
  }

  /**
   * 处理窗口已关闭事件
   * @param windowId 窗口ID
   */
  private handleClosed(windowId: number): void {
    appLog.info(
      `Window ${windowId} closed event triggered. isQuitting: ${this.isQuitting}`,
    )

    // 从窗口管理器中移除窗口
    this.windowManager.removeWindow(windowId)
    eventBus.sendToMain(WINDOW_EVENTS.WINDOW_CLOSED, windowId)

    // 非macOS平台关闭最后一个窗口时的特殊处理
    if (
      this.windowManager.getAllWindows().length === 0 &&
      process.platform !== 'darwin' &&
      !this.isQuitting
    ) {
      appLog.warn(
        'Warning: Last window on non-macOS platform closed but app is not marked as quitting.',
      )
    }
  }

  // ========== 辅助方法 ==========

  /**
   * 隐藏指定窗口（处理全屏状态下的特殊情况）
   * @param windowId 窗口ID
   */
  private async hideWindow(windowId: number): Promise<void> {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) return

    if (window.isFullScreen()) {
      appLog.info(
        `Window ${windowId} is fullscreen, exiting fullscreen before hiding.`,
      )
      await new Promise<void>((resolve) => {
        window.once('leave-full-screen', () => {
          if (!window.isDestroyed()) {
            window.hide()
            resolve()
          }
        })
        window.setFullScreen(false)
      })
    } else {
      window.hide()
    }
  }

  /**
   * 处理窗口恢复后的逻辑（主要确保活动标签页正确显示）
   * @param windowId 窗口ID
   */
  private async handleWindowRestore(windowId: number): Promise<void> {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) {
      appLog.warn(
        `Cannot handle restore for window ${windowId}, window does not exist or is destroyed.`,
      )
      return
    }

    // try {
    //   const tabPresenterInstance = presenter.tabPresenter as TabPresenter
    //   const activeTabId = await tabPresenterInstance.getActiveTabId(windowId)

    //   if (activeTabId) {
    //     appLog.info(
    //       `Window ${windowId} restored: activating active tab ${activeTabId}.`,
    //     )
    //     await tabPresenterInstance.switchTab(activeTabId)
    //   } else {
    //     appLog.warn(`Window ${windowId} restored: no active tab found.`)
    //     const tabsInWindow =
    //       await tabPresenterInstance.getWindowTabsData(windowId)
    //     for (const tabData of tabsInWindow) {
    //       const tabView = await tabPresenterInstance.getTab(tabData.id)
    //       if (tabView && !tabView.webContents.isDestroyed()) {
    //         tabView.setVisible(false)
    //       }
    //     }
    //   }
    // } catch (error) {
    //   appLog.error(`Error handling restore for window ${windowId}:`, error)
    //   throw error
    // }
  }

  /**
   * 将焦点传递给指定窗口的活动标签页
   * @param windowId 窗口ID
   * @param reason 聚焦原因（'focus' | 'restore' | 'show' | 'initial'）
   */
  private async focusActiveTab(
    windowId: number,
    reason: 'focus' | 'restore' | 'show' | 'initial' = 'focus',
  ): Promise<void> {
    const state = this.windowManager.getWindowFocusState(windowId)
    if (!state || !this.shouldFocusTab(state, reason)) return

    // try {
    //   const tabPresenterInstance = presenter.tabPresenter as TabPresenter
    //   const tabsData = await tabPresenterInstance.getWindowTabsData(windowId)
    //   const activeTab = tabsData.find((tab) => tab.isActive)

    //   if (activeTab) {
    //     appLog.info(
    //       `Focusing active tab ${activeTab.id} in window ${windowId} (reason: ${reason})`,
    //     )
    //     await tabPresenterInstance.switchTab(activeTab.id)

    //     // 更新焦点状态
    //     state.lastFocusTime = Date.now()
    //     if (reason === 'initial') state.hasInitialFocus = true
    //     if (reason === 'focus' || reason === 'initial')
    //       state.isNewWindow = false
    //   }
    // } catch (error) {
    //   appLog.error(`Error focusing active tab in window ${windowId}:`, error)
    // }
  }

  /**
   * 判断是否应该聚焦标签页（防抖和条件判断）
   * @param state 窗口焦点状态
   * @param reason 聚焦原因
   * @returns 是否应该执行聚焦操作
   */
  private shouldFocusTab(
    state: {
      lastFocusTime: number
      shouldFocus: boolean
      isNewWindow: boolean
      hasInitialFocus: boolean
    },
    reason: 'focus' | 'restore' | 'show' | 'initial',
  ): boolean {
    const now = Date.now()
    // 防抖处理：100ms内不重复聚焦
    if (now - state.lastFocusTime < 100) {
      appLog.info(`Skipping focus for window, too frequent (${reason})`)
      return false
    }

    // 根据不同原因判断是否应该聚焦
    switch (reason) {
      case 'initial':
        return !state.hasInitialFocus // 初始聚焦只执行一次
      case 'focus':
        return state.shouldFocus // 普通聚焦取决于shouldFocus标志
      case 'restore':
      case 'show':
        return state.isNewWindow || state.shouldFocus // 恢复/显示时如果是新窗口或允许聚焦
      default:
        return false
    }
  }

  /**
   * 注册所有事件总线监听器
   */
  public registerAll(): void {
    this.registerShortcutListeners()
    this.registerSystemEventListeners()
    this.registerConfigEventListeners()
  }

  /**
   * 注销所有事件总线监听器
   */
  public unregisterAll(): void {
    eventBus.removeAllListeners(SHORTCUT_EVENTS.CREATE_NEW_WINDOW)
    eventBus.removeAllListeners(SYSTEM_EVENTS.SYSTEM_THEME_UPDATED)
    eventBus.removeAllListeners(WINDOW_EVENTS.FORCE_QUIT_APP)
    eventBus.removeAllListeners(CONFIG_EVENTS.CONTENT_PROTECTION_CHANGED)
    appLog.info('All window event bus listeners unregistered')
  }

  /**
   * 注册快捷键监听器
   */
  private registerShortcutListeners(): void {
    eventBus.on(SHORTCUT_EVENTS.CREATE_NEW_WINDOW, () => {
      appLog.info('Creating new shell window via shortcut')
      // this.windowActions.createShellWindow({
      //   initialTab: { url: 'local://chat' },
      // })
    })
  }

  /**
   * 注册系统事件监听器
   */
  private registerSystemEventListeners(): void {
    // 系统主题变化
    eventBus.on(SYSTEM_EVENTS.SYSTEM_THEME_UPDATED, (isDark: boolean) => {
      appLog.info('System theme updated, notifying all windows')
      this.windowManager.getAllWindows().forEach((window) => {
        if (!window.isDestroyed()) {
          window.webContents.send('system-theme-updated', isDark)
        }
      })
    })

    // 强制退出应用
    eventBus.on(WINDOW_EVENTS.FORCE_QUIT_APP, () => {
      appLog.info('Force quitting application')
      this.isQuitting = true
      app.quit()
    })
  }

  /**
   * 注册配置事件监听器
   */
  private registerConfigEventListeners(): void {
    // 内容保护设置变更
    eventBus.on(
      CONFIG_EVENTS.CONTENT_PROTECTION_CHANGED,
      (enabled: boolean) => {
        appLog.info(
          `Content protection changed to ${enabled}, updating windows`,
        )
        this.windowManager.getAllWindows().forEach((window) => {
          if (!window.isDestroyed()) {
            this.windowActions.updateContentProtection(window.id, enabled)
          }
        })

        // 内容保护变更需要重启应用
        setTimeout(() => {
          presenter.devicePresenter.restartApp()
        }, 1000)
      },
    )
  }
}
