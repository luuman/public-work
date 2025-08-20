import { appLog } from '@/presenter/logPresenter'
import { DeeplinkBase } from './base'
import { StartCommandHandler } from './startHandler'
import { McpCommandHandler } from './mcpHandler'
import { URLSearchParams } from 'url'

/**
 * DeepLink 主处理器
 */
export class DeeplinkPresenter extends DeeplinkBase {
  private startHandler = new StartCommandHandler()
  private mcpHandler = new McpCommandHandler()

  /**
   * 处理DeepLink URL
   */
  async handleDeepLink(url: string): Promise<void> {
    appLog.info('presenter/deeplinkPresenter/index: handleDeepLink')
    const urlObj = new URL(url)
    const command = urlObj.hostname

    if (command === 'start') {
      await this.startHandler.handle(urlObj.searchParams)
    } else if (command === 'mcp') {
      const subCommand = urlObj.pathname.slice(1)
      if (subCommand === 'install') {
        await this.mcpHandler.handle(urlObj.searchParams)
      }
    }
  }
}
