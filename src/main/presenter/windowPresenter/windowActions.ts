// src/main/presenter/windowPresenter/WindowActions.ts
import { BrowserWindow, shell } from 'electron'
import { WindowManager } from './windowManager'
import { eventBus } from '@/events/eventbus'
import { WINDOW_EVENTS } from '@/events/events'
import { appLog } from '@/presenter/logPresenter'
import { presenter } from '../'
import { TabPresenter } from '../tabPresenter'

/**
 * 窗口操作类 - 负责执行所有窗口操作命令
 *
 * 主要职责：
 * 1. 执行窗口操作（最小化/最大化/关闭/隐藏等）
 * 2. 处理窗口位置和尺寸调整
 * 3. 管理窗口全屏状态
 * 4. 处理窗口焦点控制
 */
export class WindowActions {
  constructor(
    private windowManager: WindowManager,
    private configPresenter: {
      getCloseToQuit: () => boolean
      getContentProtectionEnabled: () => boolean
    },
  ) {}

  /**
   * 最小化指定窗口
   * @param windowId 窗口ID
   */
  public minimize(windowId: number): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) {
      appLog.warn(
        `Cannot minimize window ${windowId} - window not found or destroyed`,
      )
      return
    }

    appLog.info(`Minimizing window ${windowId}`)
    window.minimize()
    eventBus.sendToMain(WINDOW_EVENTS.WINDOW_MINIMIZED, windowId)
  }

  /**
   * 最大化或还原窗口
   * @param windowId 窗口ID
   */
  public maximize(windowId: number): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) {
      appLog.warn(
        `Cannot maximize/unmaximize window ${windowId} - window not found or destroyed`,
      )
      return
    }

    if (window.isMaximized()) {
      appLog.info(`Restoring window ${windowId} from maximized state`)
      window.unmaximize()
    } else {
      appLog.info(`Maximizing window ${windowId}`)
      window.maximize()
    }

    // 触发恢复逻辑以确保活动标签页正确显示
    this.handleWindowRestore(windowId).catch((error) => {
      appLog.error(
        `Error handling restore after maximizing/unmaximizing window ${windowId}:`,
        error,
      )
    })
  }

  /**
   * 关闭指定窗口（触发关闭流程）
   * @param windowId 窗口ID
   * @param forceClose 是否强制关闭（忽略配置）
   */
  public close(windowId: number, forceClose: boolean = false): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) {
      appLog.warn(
        `Cannot close window ${windowId} - window not found or destroyed`,
      )
      return
    }

    appLog.info(`Requesting to close window ${windowId}, force: ${forceClose}`)
    window.close() // 这会触发 'close' 事件，由 WindowEvents 处理实际逻辑
  }

  /**
   * 隐藏指定窗口
   * @param windowId 窗口ID
   */
  public hide(windowId: number): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) {
      appLog.warn(
        `Cannot hide window ${windowId} - window not found or destroyed`,
      )
      return
    }

    appLog.info(`Hiding window ${windowId}`)

    // 处理全屏窗口的特殊情况
    if (window.isFullScreen()) {
      appLog.info(
        `Window ${windowId} is fullscreen, exiting fullscreen before hiding`,
      )
      window.once('leave-full-screen', () => {
        if (!window.isDestroyed()) {
          window.hide()
          appLog.info(`Window ${windowId} hidden after exiting fullscreen`)
        }
      })
      window.setFullScreen(false)
    } else {
      window.hide()
      appLog.info(`Window ${windowId} hidden directly`)
    }
  }

  /**
   * 显示指定窗口
   * @param windowId 窗口ID（可选，不传则显示焦点窗口或第一个窗口）
   */
  public show(windowId?: number): void {
    let targetWindow: BrowserWindow | undefined

    if (windowId === undefined) {
      // 未指定ID，查找焦点窗口或第一个窗口
      targetWindow =
        this.windowManager.getFocusedWindow() ||
        this.windowManager.getAllWindows()[0]
      if (!targetWindow || targetWindow.isDestroyed()) {
        appLog.warn('No valid window found to show')
        return
      }
      appLog.info(`Showing default window ${targetWindow.id}`)
    } else {
      targetWindow = this.windowManager.getWindow(windowId)
      if (!targetWindow || targetWindow.isDestroyed()) {
        appLog.warn(
          `Cannot show window ${windowId} - window not found or destroyed`,
        )
        return
      }
      appLog.info(`Showing window ${windowId}`)
    }

    targetWindow.show()
    targetWindow.focus()

    // 触发恢复逻辑以确保活动标签页正确显示
    this.handleWindowRestore(targetWindow.id).catch((error) => {
      appLog.error(
        `Error handling restore after showing window ${targetWindow!.id}:`,
        error,
      )
    })
  }

  /**
   * 切换窗口全屏状态
   * @param windowId 窗口ID
   */
  public toggleFullScreen(windowId: number): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) {
      appLog.warn(
        `Cannot toggle fullscreen for window ${windowId} - window not found or destroyed`,
      )
      return
    }

    const willBeFullscreen = !window.isFullScreen()
    appLog.info(
      `Toggling fullscreen for window ${windowId}, will be fullscreen: ${willBeFullscreen}`,
    )
    window.setFullScreen(willBeFullscreen)
  }

  /**
   * 设置窗口始终置顶
   * @param windowId 窗口ID
   * @param alwaysOnTop 是否置顶
   */
  public setAlwaysOnTop(windowId: number, alwaysOnTop: boolean): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) {
      appLog.warn(
        `Cannot set alwaysOnTop for window ${windowId} - window not found or destroyed`,
      )
      return
    }

    appLog.info(`Setting window ${windowId} alwaysOnTop: ${alwaysOnTop}`)
    window.setAlwaysOnTop(alwaysOnTop)
  }

  /**
   * 聚焦指定窗口的活动标签页
   * @param windowId 窗口ID
   * @param reason 聚焦原因
   */
  public focusActiveTab(
    windowId: number,
    reason: 'focus' | 'restore' | 'show' | 'initial' = 'focus',
  ): void {
    const state = this.windowManager.getWindowFocusState(windowId)
    if (!state || !this.shouldFocusTab(state, reason)) {
      return
    }

    setTimeout(async () => {
      try {
        const tabPresenterInstance = presenter.tabPresenter as TabPresenter
        const tabsData = await tabPresenterInstance.getWindowTabsData(windowId)
        const activeTab = tabsData.find((tab) => tab.isActive)

        if (activeTab) {
          appLog.info(
            `Focusing active tab ${activeTab.id} in window ${windowId} (reason: ${reason})`,
          )
          await tabPresenterInstance.switchTab(activeTab.id)

          // 更新焦点状态
          state.lastFocusTime = Date.now()
          if (reason === 'initial') state.hasInitialFocus = true
          if (reason === 'focus' || reason === 'initial')
            state.isNewWindow = false
        }
      } catch (error) {
        appLog.error(`Error focusing active tab in window ${windowId}:`, error)
      }
    }, 50) // 小延迟确保UI就绪
  }

  /**
   * 预览文件（平台相关实现）
   * @param filePath 文件路径
   */
  public previewFile(filePath: string): void {
    const mainWindow = this.windowManager.getMainWindow()
    if (!mainWindow || mainWindow.isDestroyed()) {
      appLog.warn('Cannot preview file - no valid main window found')
      return
    }

    appLog.info(`Previewing file: ${filePath}`)
    if (process.platform === 'darwin') {
      mainWindow.previewFile(filePath)
    } else {
      shell.openPath(filePath).catch((err) => {
        appLog.error(`Error opening file ${filePath}:`, err)
      })
    }
  }

  /**
   * 更新窗口内容保护设置
   * @param windowId 窗口ID
   * @param enabled 是否启用内容保护
   */
  public updateContentProtection(windowId: number, enabled: boolean): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) {
      appLog.warn(
        `Cannot update content protection for window ${windowId} - window not found or destroyed`,
      )
      return
    }

    appLog.info(
      `Updating content protection for window ${windowId}: ${enabled}`,
    )

    // 阻止截图/屏幕录制
    window.setContentProtection(enabled)

    // 限制非活动窗口的帧率
    window.webContents.setBackgroundThrottling(!enabled)
    window.webContents.setFrameRate(60)
    window.setBackgroundColor('#00000000')

    // macOS 特定的隐藏功能
    if (process.platform === 'darwin') {
      window.setHiddenInMissionControl(enabled)
      window.setSkipTaskbar(enabled)
    }
  }

  // ========== 私有方法 ==========

  /**
   * 处理窗口恢复后的逻辑
   * @param windowId 窗口ID
   */
  private async handleWindowRestore(windowId: number): Promise<void> {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) {
      appLog.warn(
        `Cannot handle restore for window ${windowId} - window not found or destroyed`,
      )
      return
    }

    try {
      const tabPresenterInstance = presenter.tabPresenter as TabPresenter
      const activeTabId = await tabPresenterInstance.getActiveTabId(windowId)

      if (activeTabId) {
        appLog.debug(
          `Window ${windowId} restored: activating active tab ${activeTabId}`,
        )
        await tabPresenterInstance.switchTab(activeTabId)
      } else {
        appLog.warn(`Window ${windowId} restored: no active tab found`)
        const tabsInWindow =
          await tabPresenterInstance.getWindowTabsData(windowId)
        for (const tabData of tabsInWindow) {
          const tabView = await tabPresenterInstance.getTab(tabData.id)
          if (tabView && !tabView.webContents.isDestroyed()) {
            tabView.setVisible(false)
          }
        }
      }
    } catch (error) {
      appLog.error(`Error handling restore for window ${windowId}:`, error)
      throw error
    }
  }

  /**
   * 判断是否应该聚焦标签页
   * @param state 窗口焦点状态
   * @param reason 聚焦原因
   */
  private shouldFocusTab(
    state: WindowFocusState,
    reason: 'focus' | 'restore' | 'show' | 'initial',
  ): boolean {
    const now = Date.now()
    if (now - state.lastFocusTime < 100) {
      appLog.debug(`Skipping focus for window, too frequent (${reason})`)
      return false
    }

    switch (reason) {
      case 'initial':
        return !state.hasInitialFocus
      case 'focus':
        return state.shouldFocus
      case 'restore':
      case 'show':
        return state.isNewWindow || state.shouldFocus
      default:
        return false
    }
  }
}
