// src/main/presenter/windowPresenter/WindowManager.ts
import { BrowserWindow } from 'electron'
import { appLog } from '@/presenter/logPresenter'

/**
 * 窗口焦点状态接口
 * 用于跟踪和管理窗口的焦点相关状态
 */
export interface WindowFocusState {
  /** 上次获得焦点的时间戳 */
  lastFocusTime: number
  /** 是否应该获得焦点 */
  shouldFocus: boolean
  /** 是否是新创建的窗口 */
  isNewWindow: boolean
  /** 是否已经完成初始聚焦 */
  hasInitialFocus: boolean
}

/**
 * 窗口管理器 - 负责集中管理所有BrowserWindow实例及其状态
 *
 * 主要职责：
 * 1. 维护窗口实例的映射关系
 * 2. 管理窗口焦点状态
 * 3. 提供窗口查询和过滤功能
 * 4. 跟踪主窗口状态
 */
export class WindowManager {
  /**
   * 窗口实例映射表
   * key: 窗口ID (number)
   * value: BrowserWindow实例
   */
  private windows = new Map<number, BrowserWindow>()

  /**
   * 窗口焦点状态映射表
   * key: 窗口ID (number)
   * value: 窗口焦点状态对象
   */
  private windowFocusStates = new Map<number, WindowFocusState>()

  /** 主窗口ID */
  private mainWindowId: number | null = null

  /**
   * 添加窗口到管理器
   * @param window 要添加的BrowserWindow实例
   * @returns 添加的窗口ID
   */
  public addWindow(window: BrowserWindow): number {
    const windowId = window.id

    // 避免重复添加
    if (this.windows.has(windowId)) {
      appLog.warn(`Window ${windowId} already exists in WindowManager`)
      return windowId
    }

    this.windows.set(windowId, window)

    // 初始化焦点状态
    this.windowFocusStates.set(windowId, {
      lastFocusTime: 0,
      shouldFocus: true,
      isNewWindow: true,
      hasInitialFocus: false,
    })

    // 如果还没有主窗口，设置第一个添加的窗口为主窗口
    if (this.mainWindowId === null) {
      this.mainWindowId = windowId
      appLog.info(`Setting window ${windowId} as main window`)
    }

    appLog.info(`Window ${windowId} added to WindowManager`)
    return windowId
  }

  /**
   * 从管理器中移除窗口
   * @param windowId 要移除的窗口ID
   */
  public removeWindow(windowId: number): void {
    if (!this.windows.has(windowId)) {
      appLog.warn(`Window ${windowId} not found in WindowManager`)
      return
    }

    // 移除窗口实例
    this.windows.delete(windowId)

    // 移除焦点状态
    this.windowFocusStates.delete(windowId)

    // 如果移除的是主窗口，清空主窗口ID
    if (this.mainWindowId === windowId) {
      this.mainWindowId = null
      appLog.info(`Main window ${windowId} removed`)
    }

    appLog.info(`Window ${windowId} removed from WindowManager`)
  }

  /**
   * 获取指定ID的窗口实例
   * @param windowId 窗口ID
   * @returns BrowserWindow实例或undefined
   */
  public getWindow(windowId: number): BrowserWindow | undefined {
    return this.windows.get(windowId)
  }

  /**
   * 获取指定窗口的焦点状态
   * @param windowId 窗口ID
   * @returns 窗口焦点状态或undefined
   */
  public getWindowFocusState(windowId: number): WindowFocusState | undefined {
    return this.windowFocusStates.get(windowId)
  }

  /**
   * 更新指定窗口的焦点状态
   * @param windowId 窗口ID
   * @param update 部分状态更新对象
   */
  public updateWindowFocusState(
    windowId: number,
    update: Partial<WindowFocusState>,
  ): void {
    const currentState = this.windowFocusStates.get(windowId)
    if (currentState) {
      this.windowFocusStates.set(windowId, { ...currentState, ...update })
      appLog.debug(`Updated focus state for window ${windowId}`, update)
    }
  }

  /**
   * 获取所有未销毁的窗口实例数组
   * @returns BrowserWindow数组
   */
  public getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values()).filter((w) => !w.isDestroyed())
  }

  /**
   * 获取主窗口ID
   * @returns 主窗口ID或null
   */
  public getMainWindowId(): number | null {
    return this.mainWindowId
  }

  /**
   * 设置主窗口ID
   * @param windowId 要设置为主窗口的ID
   */
  public setMainWindowId(windowId: number): void {
    if (!this.windows.has(windowId)) {
      appLog.warn(`Cannot set non-existent window ${windowId} as main window`)
      return
    }
    this.mainWindowId = windowId
    appLog.info(`Window ${windowId} set as main window`)
  }

  /**
   * 获取当前获得焦点的窗口实例
   * @returns 焦点窗口实例或undefined
   */
  public getFocusedWindow(): BrowserWindow | undefined {
    const electronFocusedWindow = BrowserWindow.getFocusedWindow()
    if (!electronFocusedWindow) {
      return undefined
    }

    const ourWindow = this.windows.get(electronFocusedWindow.id)
    if (ourWindow && !ourWindow.isDestroyed()) {
      return ourWindow
    }
    return undefined
  }

  /**
   * 获取主窗口实例
   * @returns 主窗口实例或undefined
   */
  public getMainWindow(): BrowserWindow | undefined {
    if (this.mainWindowId === null) {
      return undefined
    }
    return this.getWindow(this.mainWindowId)
  }

  /**
   * 检查指定窗口是否是主窗口
   * @param windowId 窗口ID
   * @returns 是否是主窗口
   */
  public isMainWindow(windowId: number): boolean {
    return this.mainWindowId === windowId
  }

  /**
   * 获取所有窗口ID数组
   * @returns 窗口ID数组
   */
  public getAllWindowIds(): number[] {
    return Array.from(this.windows.keys())
  }

  /**
   * 检查窗口是否存在且未销毁
   * @param windowId 窗口ID
   * @returns 窗口是否有效
   */
  public isValidWindow(windowId: number): boolean {
    const window = this.windows.get(windowId)
    return !!window && !window.isDestroyed()
  }

  /**
   * 清空所有窗口（用于应用退出时清理）
   */
  public clearAllWindows(): void {
    appLog.info('Clearing all windows from WindowManager')
    this.windows.clear()
    this.windowFocusStates.clear()
    this.mainWindowId = null
  }
}
