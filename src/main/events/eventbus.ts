console.log('😊 EventBus')
import { IWindowPresenter, ITabPresenter } from '@shared/presenter'
import EventEmitter from 'events'

export enum SendTarget {
  ALL_WINDOWS = 'all_windows',
  DEFAULT_TAB = 'default_tab',
}

export class EventBus extends EventEmitter {
  private windowPresenter: IWindowPresenter | null = null
  private tabPresenter: ITabPresenter | null = null

  constructor() {
    super()
  }
  /**
   * 仅向主进程发送事件
   */
  sendToMain(eventName: string, ...args: unknown[]) {
    super.emit(eventName, ...args)
  }

  sendToWindow(eventName: string, windowId: number, ...args: unknown[]) {
    if (!this.windowPresenter) {
      console.warn('WindowPresenter not available, cannot send to window')
      return
    }
    this.windowPresenter.sendToWindow(windowId, eventName, ...args)
  }
  /**
   * 向渲染进程发送事件
   * @param eventName 事件名称
   * @param target 发送目标：所有窗口或默认标签页
   * @param args 事件参数
   */
  sendToRenderer(
    eventName: string,
    target: SendTarget = SendTarget.ALL_WINDOWS,
    ...args: unknown[]
  ) {
    if (!this.windowPresenter) {
      console.warn('WindowPresenter not available, cannot send to renderer')
      return
    }

    switch (target) {
      case SendTarget.ALL_WINDOWS:
        this.windowPresenter.sendToAllWindows(eventName, ...args)
        break
      case SendTarget.DEFAULT_TAB:
        this.windowPresenter.sendToDefaultTab(eventName, true, ...args)
        break
      default:
        this.windowPresenter.sendToAllWindows(eventName, ...args)
    }
  }

  /**
   * 同时发送到主进程和渲染进程
   * @param eventName 事件名称
   * @param target 发送目标
   * @param args 事件参数
   */
  send(
    eventName: string,
    target: SendTarget = SendTarget.ALL_WINDOWS,
    ...args: unknown[]
  ) {
    // 发送到主进程
    this.sendToMain(eventName, ...args)

    // 发送到渲染进程
    this.sendToRenderer(eventName, target, ...args)
  }

  /**
   * 设置窗口展示器（用于向渲染进程发送消息）
   */
  setWindowPresenter(windowPresenter: IWindowPresenter) {
    this.windowPresenter = windowPresenter
  }

  /**
   * 设置Tab展示器（用于精确的tab路由）
   */
  setTabPresenter(tabPresenter: ITabPresenter) {
    this.tabPresenter = tabPresenter
  }

  /**
   * 向指定Tab发送事件
   * @param tabId Tab ID
   * @param eventName 事件名称
   * @param args 事件参数
   */
  sendToTab(tabId: number, eventName: string, ...args: unknown[]) {
    if (!this.tabPresenter) {
      console.warn('TabPresenter not available, cannot send to specific tab')
      return
    }

    // 获取Tab实例并发送事件
    this.tabPresenter
      .getTab(tabId)
      .then((tabView) => {
        if (tabView && !tabView.webContents.isDestroyed()) {
          tabView.webContents.send(eventName, ...args)
        } else {
          console.warn(
            `Tab ${tabId} not found or destroyed, cannot send event ${eventName}`,
          )
        }
      })
      .catch((error) => {
        console.error(
          `Error sending event ${eventName} to tab ${tabId}:`,
          error,
        )
      })
  }

  /**
   * 向指定窗口的活跃Tab发送事件
   * @param windowId 窗口ID
   * @param eventName 事件名称
   * @param args 事件参数
   */
  sendToActiveTab(windowId: number, eventName: string, ...args: unknown[]) {
    if (!this.tabPresenter) {
      console.warn('TabPresenter not available, cannot send to active tab')
      return
    }

    this.tabPresenter
      .getActiveTabId(windowId)
      .then((activeTabId) => {
        if (activeTabId) {
          this.sendToTab(activeTabId, eventName, ...args)
        } else {
          console.warn(`No active tab found for window ${windowId}`)
        }
      })
      .catch((error) => {
        console.error(`Error getting active tab for window ${windowId}:`, error)
      })
  }

  /**
   * 向多个Tab广播事件
   * @param tabIds Tab ID数组
   * @param eventName 事件名称
   * @param args 事件参数
   */
  broadcastToTabs(tabIds: number[], eventName: string, ...args: unknown[]) {
    tabIds.forEach((tabId) => this.sendToTab(tabId, eventName, ...args))
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus()
