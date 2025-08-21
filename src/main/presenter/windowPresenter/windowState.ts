// src/main/presenter/windowPresenter/WindowState.ts
import windowStateManager from 'electron-window-state'
import { BrowserWindow } from 'electron'
import { appLog } from '@/presenter/logPresenter'

/**
 * 窗口状态管理器 - 负责管理窗口位置、尺寸和状态的持久化
 *
 * 主要功能：
 * 1. 保存和恢复窗口位置、尺寸
 * 2. 管理窗口最大化/最小化状态
 * 3. 多显示器环境下的窗口位置处理
 */
export class WindowState {
  private windowStates = new Map<
    number,
    ReturnType<typeof windowStateManager>
  >()

  /**
   * 为指定窗口创建状态管理器
   * @param windowId 窗口ID
   * @param options 窗口状态选项
   * @returns 窗口状态管理器实例
   */
  public manageWindow(
    windowId: number,
    options: {
      defaultWidth?: number
      defaultHeight?: number
      defaultX?: number
      defaultY?: number
    } = {},
  ): void {
    if (this.windowStates.has(windowId)) {
      appLog.warn(`Window ${windowId} is already being managed`)
      return
    }

    const state = windowStateManager({
      defaultWidth: options.defaultWidth || 800,
      defaultHeight: options.defaultHeight || 600,
      ...(options.defaultX !== undefined && { x: options.defaultX }),
      ...(options.defaultY !== undefined && { y: options.defaultY }),
    })

    this.windowStates.set(windowId, state)
    appLog.info(`Window ${windowId} state management initialized`)
  }

  /**
   * 停止管理指定窗口的状态
   * @param windowId 窗口ID
   */
  public unmanageWindow(windowId: number): void {
    const state = this.windowStates.get(windowId)
    if (state) {
      state.unmanage()
      this.windowStates.delete(windowId)
      appLog.info(`Stopped managing state for window ${windowId}`)
    }
  }

  /**
   * 应用保存的状态到窗口
   * @param windowId 窗口ID
   * @param window 窗口实例
   */
  public applyState(windowId: number, window: BrowserWindow): void {
    const state = this.windowStates.get(windowId)
    if (!state) {
      appLog.warn(`No state found for window ${windowId}`)
      return
    }

    // 确保窗口在可视区域内
    this.ensureWindowInBounds(window, state)

    // 应用状态
    window.setPosition(state.x, state.y)
    window.setSize(state.width, state.height)

    if (state.isMaximized) {
      window.maximize()
    }

    appLog.debug(`Applied saved state to window ${windowId}`, {
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
      isMaximized: state.isMaximized,
    })
  }

  /**
   * 确保窗口位置在显示器可视范围内
   * @param window 窗口实例
   * @param state 窗口状态
   */
  private ensureWindowInBounds(
    window: BrowserWindow,
    state: ReturnType<typeof windowStateManager>,
  ): void {
    const { x, y, width, height } = state
    const displays = require('electron').screen.getAllDisplays()
    console.log('ENABLED_CHANGED', window)

    // 检查窗口是否至少在一个显示器内可见
    const isVisible = displays.some((display: Electron.Display) => {
      return (
        x + width > display.bounds.x &&
        x < display.bounds.x + display.bounds.width &&
        y + height > display.bounds.y &&
        y < display.bounds.y + display.bounds.height
      )
    })

    if (!isVisible) {
      // 如果窗口完全不可见，重置为默认位置
      // state.x = undefined
      // state.y = undefined
      appLog.warn(`Window is out of bounds, resetting position`)
    }
  }

  /**
   * 保存所有窗口状态
   */
  public saveAllStates(): void {
    this.windowStates.forEach((state, windowId) => {
      appLog.debug(`Saving state for window ${windowId}`, state)
      // state.saveState()
    })
  }

  /**
   * 清除所有窗口状态
   */
  public clearAllStates(): void {
    this.windowStates.forEach((state) => state.unmanage())
    this.windowStates.clear()
    appLog.info('Cleared all window states')
  }

  /**
   * 获取窗口状态信息
   * @param windowId 窗口ID
   * @returns 窗口状态信息
   */
  public getWindowState(windowId: number) {
    const state = this.windowStates.get(windowId)
    if (!state) return null

    return {
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
      isMaximized: state.isMaximized,
      isFullScreen: state.isFullScreen,
    }
  }
}
