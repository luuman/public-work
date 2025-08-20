import { appLog } from '@/presenter/logPresenter'
import { eventBus, SendTarget } from '@/events/eventbus'
import { presenter } from '@/presenter'
import { DEEPLINK_EVENTS } from '@/events/events'
import { StartCommandParams } from './types'

/**
 * 处理deepchat://start命令
 */
export class StartCommandHandler {
  /**
   * 处理start命令
   * @param params URL查询参数
   */
  async handle(params: URLSearchParams): Promise<void> {
    const { msg, modelId, systemPrompt, mentions, autoSend } = this.parseParams(params)
    
    if (!msg) return

    this.focusOrCreateWindow()
    const windowId = presenter.windowPresenter.getFocusedWindow()?.id || 1
    await this.ensureChatTabActive(windowId)
    
    this.sendStartEvent(msg, modelId, systemPrompt, mentions, autoSend)
  }

  /**
   * 解析URL参数
   */
  private parseParams(params: URLSearchParams): StartCommandParams {
    return {
      msg: params.get('msg') ? decodeURIComponent(params.get('msg')!) : null,
      modelId: params.get('model') ? decodeURIComponent(params.get('model')!) : null,
      systemPrompt: params.get('system') ? decodeURIComponent(params.get('system')!) : null,
      mentions: this.parseMentions(params.get('mentions')),
      autoSend: this.parseAutoSend(params.get('yolo'))
    }
  }

  /**
   * 解析提及列表
   */
  private parseMentions(mentionsParam: string | null): string[] {
    if (!mentionsParam) return []
    return decodeURIComponent(mentionsParam)
      .split(',')
      .map(mention => mention.trim())
      .filter(mention => mention.length > 0)
  }

  /**
   * 解析自动发送标志
   */
  private parseAutoSend(yoloParam: string | null): boolean {
    return !!yoloParam && yoloParam.trim() !== ''
  }

  /**
   * 聚焦或创建窗口
   */
  private focusOrCreateWindow(): void {
    const focusedWindow = presenter.windowPresenter.getFocusedWindow()
    if (focusedWindow) {
      focusedWindow.show()
      focusedWindow.focus()
    } else {
      presenter.windowPresenter.show()
    }
  }

  /**
   * 确保聊天标签页激活
   */
  private async ensureChatTabActive(windowId: number): Promise<void> {
    try {
      const tabPresenter = presenter.tabPresenter
      const tabsData = await tabPresenter.getWindowTabsData(windowId)
      const chatTab = tabsData.find(tab => 
        tab.url === 'local://chat' || tab.url.includes('#/chat') || tab.url.endsWith('/chat')
      
      if (chatTab) {
        if (!chatTab.isActive) {
          await tabPresenter.switchTab(chatTab.id)
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } else {
        const newTabId = await tabPresenter.createTab(windowId, 'local://chat', { active: true })
        if (newTabId) {
          await this.waitForTabReady(newTabId)
        }
      }
    } catch (error) {
      console.error('激活聊天标签页错误:', error)
    }
  }

  /**
   * 发送start事件到渲染进程
   */
  private sendStartEvent(
    msg: string,
    modelId: string | null,
    systemPrompt: string | null,
    mentions: string[],
    autoSend: boolean
  ): void {
    eventBus.sendToRenderer(DEEPLINK_EVENTS.START, SendTarget.DEFAULT_TAB, {
      msg,
      modelId,
      systemPrompt,
      mentions,
      autoSend
    })
  }

  /**
   * 等待标签页准备就绪
   */
  private async waitForTabReady(tabId: number): Promise<void> {
    return new Promise((resolve) => {
      // ...实现同原代码
    })
  }
}