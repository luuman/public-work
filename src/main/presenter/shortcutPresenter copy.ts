import { app, globalShortcut } from 'electron'
import { presenter } from '.'
import { SHORTCUT_EVENTS, TRAY_EVENTS } from '@/events/events'
import { eventBus, SendTarget } from '@/events/eventbus'
import {
  CommandKey,
  defaultShortcutKey,
  ShortcutKeySetting,
} from './configPresenter/shortcutKeySettings'
import { ConfigPresenter } from './configPresenter'

// 快捷键分类常量
const SHORTCUT_CATEGORIES = {
  CONVERSATION: ['NewConversation', 'NewWindow'],
  TAB: [
    'NewTab',
    'CloseTab',
    'SwitchNextTab',
    'SwitchPrevTab',
    'SwitchToLastTab',
  ],
  APP: ['Quit'],
  VIEW: ['ZoomIn', 'ZoomOut', 'ZoomResume'],
  NAVIGATION: ['GoSettings'],
  DATA: ['CleanChatHistory', 'DeleteConversation'],
  WINDOW: ['ShowHideWindow'],
}

/**
 * 全局快捷键管理类
 */
export class ShortcutPresenter {
  private isActive = false
  private readonly configPresenter: ConfigPresenter
  private shortcutKeys: ShortcutKeySetting

  constructor(configPresenter: ConfigPresenter) {
    this.configPresenter = configPresenter
    this.shortcutKeys = { ...defaultShortcutKey }
  }

  /**
   * 注册所有全局快捷键
   */
  registerShortcuts(): void {
    if (this.isActive) return

    // 合并配置
    this.shortcutKeys = {
      ...defaultShortcutKey,
      ...this.configPresenter.getShortcutKey(),
    }

    // 注册分类快捷键
    this.registerConversationShortcuts()
    this.registerTabShortcuts()
    this.registerAppShortcuts()
    this.registerViewShortcuts()
    this.registerNavigationShortcuts()
    this.registerDataShortcuts()
    this.registerWindowShortcuts()
    this.registerNumberedTabShortcuts()

    this.isActive = true
  }

  /**
   * 注册会话相关快捷键
   */
  private registerConversationShortcuts(): void {
    this.registerShortcut('NewConversation', () => {
      this.withFocusedWindow((windowId) => {
        presenter.windowPresenter.sendToActiveTab(
          windowId,
          SHORTCUT_EVENTS.CREATE_NEW_CONVERSATION,
        )
      })
    })

    this.registerShortcut('NewWindow', () => {
      this.withFocusedWindow(() => {
        eventBus.sendToMain(SHORTCUT_EVENTS.CREATE_NEW_WINDOW)
      })
    })
  }

  /**
   * 注册标签页相关快捷键
   */
  private registerTabShortcuts(): void {
    this.registerShortcut('NewTab', () => {
      this.withFocusedWindow((windowId) => {
        eventBus.sendToMain(SHORTCUT_EVENTS.CREATE_NEW_TAB, windowId)
      })
    })

    this.registerShortcut('CloseTab', () => {
      this.withFocusedWindow((windowId) => {
        eventBus.sendToMain(SHORTCUT_EVENTS.CLOSE_CURRENT_TAB, windowId)
      })
    })

    this.registerShortcut('SwitchNextTab', () => {
      this.withFocusedWindow((windowId) => this.switchToNextTab(windowId))
    })

    this.registerShortcut('SwitchPrevTab', () => {
      this.withFocusedWindow((windowId) => this.switchToPreviousTab(windowId))
    })

    this.registerShortcut('SwitchToLastTab', () => {
      this.withFocusedWindow((windowId) => this.switchToLastTab(windowId))
    })
  }

  /**
   * 注册应用控制快捷键
   */
  private registerAppShortcuts(): void {
    this.registerShortcut('Quit', () => app.quit())
  }

  /**
   * 注册视图缩放快捷键
   */
  private registerViewShortcuts(): void {
    this.registerShortcut('ZoomIn', () => {
      eventBus.send(SHORTCUT_EVENTS.ZOOM_IN, SendTarget.ALL_WINDOWS)
    })

    this.registerShortcut('ZoomOut', () => {
      eventBus.send(SHORTCUT_EVENTS.ZOOM_OUT, SendTarget.ALL_WINDOWS)
    })

    this.registerShortcut('ZoomResume', () => {
      eventBus.send(SHORTCUT_EVENTS.ZOOM_RESUME, SendTarget.ALL_WINDOWS)
    })
  }

  /**
   * 注册导航快捷键
   */
  private registerNavigationShortcuts(): void {
    this.registerShortcut('GoSettings', () => {
      this.withFocusedWindow((windowId) => {
        presenter.windowPresenter.sendToActiveTab(
          windowId,
          SHORTCUT_EVENTS.GO_SETTINGS,
        )
      })
    })
  }

  /**
   * 注册数据管理快捷键
   */
  private registerDataShortcuts(): void {
    this.registerShortcut('CleanChatHistory', () => {
      this.withFocusedWindow((windowId) => {
        presenter.windowPresenter.sendToActiveTab(
          windowId,
          SHORTCUT_EVENTS.CLEAN_CHAT_HISTORY,
        )
      })
    })

    this.registerShortcut('DeleteConversation', () => {
      this.withFocusedWindow((windowId) => {
        presenter.windowPresenter.sendToActiveTab(
          windowId,
          SHORTCUT_EVENTS.DELETE_CONVERSATION,
        )
      })
    })
  }

  /**
   * 注册窗口控制快捷键
   */
  private registerWindowShortcuts(): void {
    this.registerShortcut('ShowHideWindow', () => {
      eventBus.sendToMain(TRAY_EVENTS.SHOW_HIDDEN_WINDOW)
    })
  }

  /**
   * 注册数字键标签页切换快捷键
   */
  private registerNumberedTabShortcuts(): void {
    for (let i = 1; i <= 8; i++) {
      globalShortcut.register(`${CommandKey}+${i}`, () => {
        this.withFocusedWindow((windowId) =>
          this.switchToTabByIndex(windowId, i - 1),
        )
      })
    }
  }

  /**
   * 通用快捷键注册方法
   */
  private registerShortcut(
    key: keyof ShortcutKeySetting,
    callback: () => void,
  ): void {
    const shortcut = this.shortcutKeys[key]
    if (shortcut) {
      globalShortcut.register(shortcut, callback)
    }
  }

  /**
   * 在有焦点窗口时执行操作
   */
  private withFocusedWindow(callback: (windowId: number) => void): void {
    const focusedWindow = presenter.windowPresenter.getFocusedWindow()
    if (focusedWindow?.isFocused()) {
      callback(focusedWindow.id)
    }
  }

  /**
   * 切换到下一个标签页
   */
  private async switchToNextTab(windowId: number): Promise<void> {
    await this.switchTabByOffset(windowId, 1)
  }

  /**
   * 切换到上一个标签页
   */
  private async switchToPreviousTab(windowId: number): Promise<void> {
    await this.switchTabByOffset(windowId, -1)
  }

  /**
   * 按偏移量切换标签页
   */
  private async switchTabByOffset(
    windowId: number,
    offset: number,
  ): Promise<void> {
    try {
      const tabsData = await presenter.tabPresenter.getWindowTabsData(windowId)
      if (!tabsData || tabsData.length <= 1) return

      const activeTabIndex = tabsData.findIndex((tab) => tab.isActive)
      if (activeTabIndex === -1) return

      const newIndex =
        (activeTabIndex + offset + tabsData.length) % tabsData.length
      await presenter.tabPresenter.switchTab(tabsData[newIndex].id)
    } catch (error) {
      console.error('❌Failed to switch tab:', error)
    }
  }

  /**
   * 按索引切换标签页
   */
  private async switchToTabByIndex(
    windowId: number,
    index: number,
  ): Promise<void> {
    try {
      const tabsData = await presenter.tabPresenter.getWindowTabsData(windowId)
      if (!tabsData || index >= tabsData.length) return

      await presenter.tabPresenter.switchTab(tabsData[index].id)
    } catch (error) {
      console.error(`Failed to switch to tab ${index}:`, error)
    }
  }

  /**
   * 切换到最后一个标签页
   */
  private async switchToLastTab(windowId: number): Promise<void> {
    try {
      const tabsData = await presenter.tabPresenter.getWindowTabsData(windowId)
      if (!tabsData || tabsData.length === 0) return

      await presenter.tabPresenter.switchTab(tabsData[tabsData.length - 1].id)
    } catch (error) {
      console.error('❌Failed to switch to last tab:', error)
    }
  }

  /**
   * 注销所有快捷键
   */
  unregisterShortcuts(): void {
    globalShortcut.unregisterAll()
    this.isActive = false
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.unregisterShortcuts()
  }
}
