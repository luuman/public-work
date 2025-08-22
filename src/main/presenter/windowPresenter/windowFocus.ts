// src/main/presenter/windowPresenter/WindowFocus.ts
import { BrowserWindow } from 'electron'
import { WindowManager } from './windowManager'
import { eventBus } from '@/events/eventbus'
import { WINDOW_EVENTS } from '@/events/events'
import { appLog } from '@/presenter/logPresenter'
// import { presenter } from '../'
// import { TabPresenter } from '../tabPresenter'

/**
 * 窗口焦点管理器 - 专门处理窗口焦点相关逻辑
 *
 * 主要职责：
 * 1. 管理窗口焦点状态
 * 2. 处理窗口焦点变化事件
 * 3. 控制标签页焦点行为
 * 4. 实现焦点防抖和条件判断
 */
export class WindowFocus {
  constructor(private windowManager: WindowManager) {
    console.log('🫁 WindowFocus')
  }

  /**
   * 处理窗口获得焦点事件
   * @param windowId 窗口ID
   */
  public handleFocus(windowId: number): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) {
      appLog.warn(`Focus event for invalid window ${windowId}`)
      return
    }

    // 更新窗口管理器中的焦点状态
    this.windowManager.updateWindowFocusState(windowId, {
      lastFocusTime: Date.now(),
      isNewWindow: false,
    })

    appLog.info(`Window ${windowId} gained focus`)
    eventBus.sendToMain(WINDOW_EVENTS.WINDOW_FOCUSED, windowId)

    // 通知渲染进程
    window.webContents.send('window-focused', windowId)

    // 聚焦活动标签页
    this.focusActiveTab(windowId, 'focus')
  }

  /**
   * 处理窗口失去焦点事件
   * @param windowId 窗口ID
   */
  public handleBlur(windowId: number): void {
    const window = this.windowManager.getWindow(windowId)
    if (!window || window.isDestroyed()) {
      appLog.warn(`Blur event for invalid window ${windowId}`)
      return
    }

    appLog.info(`Window ${windowId} lost focus`)
    eventBus.sendToMain(WINDOW_EVENTS.WINDOW_BLURRED, windowId)
    window.webContents.send('window-blurred', windowId)
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

    // 使用setTimeout确保UI线程就绪
    setTimeout(async () => {
      // try {
      //   const tabPresenterInstance = presenter.tabPresenter as TabPresenter
      //   const tabsData = await tabPresenterInstance.getWindowTabsData(windowId)
      //   const activeTab = tabsData.find((tab) => tab.isActive)
      //   if (activeTab) {
      //     appLog.debug(
      //       `Focusing active tab ${activeTab.id} in window ${windowId} (reason: ${reason})`,
      //     )
      //     await tabPresenterInstance.switchTab(activeTab.id)
      //     // 更新焦点状态
      //     this.windowManager.updateWindowFocusState(windowId, {
      //       lastFocusTime: Date.now(),
      //       ...(reason === 'initial' && { hasInitialFocus: true }),
      //       ...((reason === 'focus' || reason === 'initial') && {
      //         isNewWindow: false,
      //       }),
      //     })
      //   }
      // } catch (error) {
      //   appLog.error(`Error focusing active tab in window ${windowId}:`, error)
      // }
    }, 50)
  }

  /**
   * 检查窗口是否应该获得焦点
   * @param windowId 窗口ID
   * @param reason 焦点原因
   * @returns 是否应该获得焦点
   */
  public shouldWindowFocus(
    windowId: number,
    reason: 'focus' | 'restore' | 'show' | 'initial',
  ): boolean {
    const state = this.windowManager.getWindowFocusState(windowId)
    return !!state && this.shouldFocusTab(state, reason)
  }

  /**
   * 获取当前获得焦点的窗口
   * @returns 焦点窗口或undefined
   */
  public getFocusedWindow(): BrowserWindow | undefined {
    return this.windowManager.getFocusedWindow()
  }

  /**
   * 判断指定窗口是否是当前焦点窗口
   * @param windowId 窗口ID
   * @returns 是否是焦点窗口
   */
  public isWindowFocused(windowId: number): boolean {
    const focusedWindow = this.getFocusedWindow()
    return !!focusedWindow && focusedWindow.id === windowId
  }

  /**
   * 设置窗口是否应该获得焦点
   * @param windowId 窗口ID
   * @param shouldFocus 是否应该获得焦点
   */
  public setShouldFocus(windowId: number, shouldFocus: boolean): void {
    this.windowManager.updateWindowFocusState(windowId, { shouldFocus })
    appLog.debug(`Window ${windowId} shouldFocus set to ${shouldFocus}`)
  }

  // ========== 私有方法 ==========

  /**
   * 判断是否应该聚焦标签页（带防抖和条件判断）
   * @param state 窗口焦点状态
   * @param reason 聚焦原因
   * @returns 是否应该执行聚焦
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
      appLog.debug(`Skipping focus for window, too frequent (${reason})`)
      return false
    }

    // 根据不同原因判断是否应该聚焦
    switch (reason) {
      case 'initial':
        // 初始聚焦只执行一次
        return !state.hasInitialFocus
      case 'focus':
        // 普通聚焦取决于shouldFocus标志
        return state.shouldFocus
      case 'restore':
      case 'show':
        // 恢复/显示时如果是新窗口或允许聚焦
        return state.isNewWindow || state.shouldFocus
      default:
        return false
    }
  }
}
