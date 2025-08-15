import { app, globalShortcut, dialog } from 'electron'
import { presenter } from '.'
import { SHORTCUT_EVENTS, TRAY_EVENTS } from '@/events/events'
import { eventBus, SendTarget } from '@/events/eventbus'
import {
  defaultShortcutKey,
  ShortcutDefinition,
  ShortcutKeySetting,
} from './configPresenter/shortcutKeySettings'
import { ConfigPresenter } from './configPresenter'

console.log('🥢Registering shortcuts defaultShortcutKey', defaultShortcutKey)

type ShortcutHandler = () => void

/**
 * 全局快捷键管理类
 * 功能：注册/注销系统级快捷键，并处理快捷键触发的事件
 * 注意：所有快捷键仅在应用获得焦点时生效（部分功能需额外检查窗口状态）
 */
export class ShortcutPresenter {
  private isActive: boolean = false
  // 标记快捷键是否已注册
  private configPresenter: ConfigPresenter
  // 配置管理实例（用于获取用户自定义快捷键）
  private shortcutKeys: ShortcutKeySetting = {
    ...(defaultShortcutKey as ShortcutKeySetting),
    // 默认快捷键配置（用户未自定义时使用）
  }
  // private isActive = false
  // private readonly configPresenter: ConfigPresenter
  // private shortcutKeys: ShortcutKeySetting
  private registeredHandlers = new Map<string, ShortcutHandler>()

  /**
   * 构造函数
   * @param configPresenter 配置管理实例，用于获取用户自定义的快捷键设置
   */
  constructor(configPresenter: ConfigPresenter) {
    this.configPresenter = configPresenter
  }

  /**
   * 注册所有全局快捷键
   * 逻辑：合并默认配置和用户自定义配置，按功能分类注册
   */
  async registerShortcuts(): Promise<void> {
    if (this.isActive) return
    // 避免重复注册
    console.log('Registering shortcuts', this.shortcutKeys.NewConversation)

    // 合并默认配置和用户自定义配置（后者优先级更高）
    const mergedKeys = {
      ...defaultShortcutKey,
      ...this.configPresenter.getShortcutKey(),
    }
    // Ensure all values are ShortcutDefinition with value as string
    this.shortcutKeys = Object.fromEntries(
      Object.entries(mergedKeys).map(([k, v]) => [
        k,
        {
          ...v,
          value: String((v as any).value),
        },
      ]),
    ) as ShortcutKeySetting
    console.log('Registering shortcuts', this.shortcutKeys)

    const failedShortcuts: ShortcutDefinition[] = []

    for (const key in this.shortcutKeys) {
      const shortcut = this.shortcutKeys[key as keyof ShortcutKeySetting]
      if (!shortcut) continue
      console.log('🥢Registering shortcuts shortcut', shortcut)

      const handler = await this.getHandlerForKey(
        key as keyof ShortcutKeySetting,
      )
      if (!handler) continue

      const success = await this.registerShortcut(shortcut.value, handler)
      if (!success) {
        failedShortcuts.push(shortcut)
      }
    }

    if (failedShortcuts.length > 0) {
      await this.showRegistrationWarning(failedShortcuts)
    }
    console.log('Registering failedShortcuts', failedShortcuts)

    this.isActive = true
    // 标记为已激活状态
  }

  /**
   * 根据快捷键配置键返回对应的处理函数
   * @param key shortcutKeys 的键名
   * @returns 对应的快捷键处理函数，若无效返回 null
   */
  private getHandlerForKey(key: keyof ShortcutKeySetting): (() => void) | null {
    // 获取当前聚焦窗口（所有需要窗口的快捷键共用此检查）
    const getFocusedWindowId = (): number | null => {
      const focusedWindow = presenter.windowPresenter.getFocusedWindow()
      return focusedWindow?.isFocused() ? focusedWindow.id : null
    }
    console.log('Registering getHandlerForKey', key)

    // 根据不同的快捷键类型返回对应的处理函数
    switch (key) {
      // === 会话管理 ===
      case 'NewConversation':
        return () => {
          const windowId = getFocusedWindowId()
          if (windowId) {
            presenter.windowPresenter.sendToActiveTab(
              windowId,
              SHORTCUT_EVENTS.CREATE_NEW_CONVERSATION,
            )
          }
        }

      case 'NewWindow':
        return () => eventBus.sendToMain(SHORTCUT_EVENTS.CREATE_NEW_WINDOW)

      // === 标签页管理 ===
      case 'NewTab':
        return () => {
          const windowId = getFocusedWindowId()
          if (windowId) {
            eventBus.sendToMain(SHORTCUT_EVENTS.CREATE_NEW_TAB, windowId)
          }
        }

      case 'CloseTab':
        return () => {
          const windowId = getFocusedWindowId()
          if (windowId) {
            eventBus.sendToMain(SHORTCUT_EVENTS.CLOSE_CURRENT_TAB, windowId)
          }
        }

      // === 应用控制 ===
      case 'Quit':
        return () => app.quit()

      // === 视图控制 ===
      case 'ZoomIn':
        return () =>
          eventBus.send(SHORTCUT_EVENTS.ZOOM_IN, SendTarget.ALL_WINDOWS)

      case 'ZoomOut':
        return () =>
          eventBus.send(SHORTCUT_EVENTS.ZOOM_OUT, SendTarget.ALL_WINDOWS)

      // case 'ZoomReset':
      //     return () => eventBus.send(SHORTCUT_EVENTS.ZOOM_RESET, SendTarget.ALL_WINDOWS);

      // === 导航功能 ===
      case 'GoSettings':
        return () => {
          const windowId = getFocusedWindowId()
          if (windowId) {
            presenter.windowPresenter.sendToActiveTab(
              windowId,
              SHORTCUT_EVENTS.GO_SETTINGS,
            )
          }
        }

      // === 数据管理 ===
      case 'CleanChatHistory':
        return () => {
          const windowId = getFocusedWindowId()
          if (windowId) {
            presenter.windowPresenter.sendToActiveTab(
              windowId,
              SHORTCUT_EVENTS.CLEAN_CHAT_HISTORY,
            )
          }
        }

      case 'DeleteConversation':
        return () => {
          const windowId = getFocusedWindowId()
          if (windowId) {
            presenter.windowPresenter.sendToActiveTab(
              windowId,
              SHORTCUT_EVENTS.DELETE_CONVERSATION,
            )
          }
        }
      case 'SwitchNextTab':
        return () => {
          const windowId = getFocusedWindowId()
          if (windowId) this.switchToNextTab(windowId)
        }

      case 'SwitchPrevTab':
        return () => {
          const windowId = getFocusedWindowId()
          if (windowId) this.switchToPreviousTab(windowId)
        }

      // case 'SwitchToLastTab':
      //     return () => {
      //         const windowId = getFocusedWindowId();
      //         if (windowId) this.switchToLastTab(windowId);
      //     };
      // 注册窗口显示/隐藏快捷键
      case 'ShowHideWindow':
        console.log('Registering ShowHideWindow', key)
        return () => eventBus.sendToMain(TRAY_EVENTS.SHOW_HIDDEN_WINDOW)
      // === 数字快捷键（动态生成）===
      default:
        // if (key.startsWith('SwitchToTab')) {
        //     const tabIndex = parseInt(key.replace('SwitchToTab', ''), 10);
        //     if (!isNaN(tabIndex) {
        //         return () => {
        //             const windowId = getFocusedWindowId();
        //             if (windowId) this.switchToTabByIndex(windowId, tabIndex - 1);
        //         };
        //     }
        // }
        return null
    }
  }

  /**
   * 切换到下一个标签页（循环模式）
   * @param windowId 目标窗口ID
   */
  private async switchToNextTab(windowId: number): Promise<void> {
    try {
      const tabsData = await presenter.tabPresenter.getWindowTabsData(windowId)
      if (!tabsData || tabsData.length <= 1) return
      // 无标签页或只有一个时不操作

      const activeTabIndex = tabsData.findIndex((tab) => tab.isActive)
      if (activeTabIndex === -1) return

      const nextTabIndex = (activeTabIndex + 1) % tabsData.length
      // 循环计算
      await presenter.tabPresenter.switchTab(tabsData[nextTabIndex].id)
    } catch (error) {
      console.error('❌Failed to switch to next tab:', error)
    }
  }

  /**
   * 切换到上一个标签页（循环模式）
   * @param windowId 目标窗口ID
   */
  private async switchToPreviousTab(windowId: number): Promise<void> {
    try {
      const tabsData = await presenter.tabPresenter.getWindowTabsData(windowId)
      if (!tabsData || tabsData.length <= 1) return

      const activeTabIndex = tabsData.findIndex((tab) => tab.isActive)
      if (activeTabIndex === -1) return

      const previousTabIndex =
        (activeTabIndex - 1 + tabsData.length) % tabsData.length
      // 处理负数情况
      await presenter.tabPresenter.switchTab(tabsData[previousTabIndex].id)
    } catch (error) {
      console.error('❌Failed to switch to previous tab:', error)
    }
  }

  /**
   * 切换到最后一个标签页
   * @param windowId 目标窗口ID
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
   * 安全注册快捷键
   */
  private async registerShortcut(
    shortcut: string,
    handler: ShortcutHandler,
  ): Promise<boolean> {
    if (!shortcut) return false

    try {
      // 检查是否已注册
      if (globalShortcut.isRegistered(shortcut)) {
        console.warn(`Shortcut conflict: ${shortcut} is already registered`)
        return false
      }

      // 注册快捷键
      const success = globalShortcut.register(shortcut, handler)
      if (success) {
        this.registeredHandlers.set(shortcut, handler)
        return true
      }
      return false
    } catch (error) {
      console.error(`Failed to register shortcut ${shortcut}:`, error)
      return false
    }
  }

  /**
   * 注销所有快捷键（保留窗口显隐快捷键）
   */
  unregisterShortcuts(): void {
    //  try {
    //   // 注销所有已注册的快捷键
    //   this.registeredHandlers.forEach((_, shortcut) => {
    //     globalShortcut.unregister(shortcut)
    //   })
    //   this.registeredHandlers.clear()

    //   this.isActive = false
    //   console.log('Shortcuts unregistered successfully')
    // } catch (error) {
    //   console.error('❌Failed to unregister shortcuts:', error)
    // }

    console.log('Unregistering shortcuts')
    globalShortcut.unregisterAll()
    // this.showHideWindow()
    this.isActive = false
  }

  /**
   * 销毁实例时的清理操作
   */
  destroy(): void {
    this.unregisterShortcuts()
  }

  private async showRegistrationWarning(
    failedShortcuts: ShortcutDefinition[],
  ): Promise<void> {
    await dialog.showMessageBox({
      type: 'warning',
      title: '快捷键注册警告',
      message: '部分快捷键注册失败',
      detail: `以下快捷键可能被占用:\n${failedShortcuts
        .map((item, idx) => `${idx + 1}. ${item.value} (${item.scope ?? ''})`)
        .join('\n')}`,
      buttons: ['确定'],
    })
  }
}
