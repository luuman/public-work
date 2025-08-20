import { appLog } from '@/presenter/logPresenter'
import { eventBus, SendTarget } from '@/eventbus'
import { DEEPLINK_EVENTS } from '@/events/events'
import { MCPInstallConfig } from './types'

/**
 * 处理deepchat://mcp/install命令
 */
export class McpCommandHandler {
  /**
   * 处理mcp安装命令
   * @param params URL查询参数
   */
  async handle(params: URLSearchParams): Promise<void> {
    appLog.info('presenter/deeplinkPresenter/mcpHandler: handle')
    const jsonBase64 = params.get('code')
    if (!jsonBase64) {
      console.error("缺少'code'参数")
      return
    }

    try {
      const jsonString = Buffer.from(jsonBase64, 'base64').toString('utf-8')
      const mcpConfig = JSON.parse(jsonString) as MCPInstallConfig

      if (!mcpConfig?.mcpServers) {
        console.error('无效的MCP配置: 缺少mcpServers字段')
        return
      }

      for (const [serverName, serverConfig] of Object.entries(
        mcpConfig.mcpServers,
      )) {
        const finalConfig = this.prepareServerConfig(serverName, serverConfig)
        if (finalConfig) {
          this.sendMcpInstallEvent(serverName, finalConfig)
        }
      }
    } catch (error) {
      console.error('解析MCP配置错误:', error)
    }
  }

  /**
   * 准备MCP服务配置
   */
  private prepareServerConfig(serverName: string, serverConfig: any) {
    appLog.info('presenter/deeplinkPresenter/mcpHandler: prepareServerConfig')
  } // ...实现配置准备逻辑，同原代码

  /**
   * 发送MCP安装事件到渲染进程
   */
  private sendMcpInstallEvent(serverName: string, config: any): void {
    appLog.info('presenter/deeplinkPresenter/mcpHandler: sendMcpInstallEvent')
    const resultServerConfig = {
      mcpServers: {
        [serverName]: config,
      },
    }

    eventBus.sendToRenderer(
      DEEPLINK_EVENTS.MCP_INSTALL,
      SendTarget.DEFAULT_TAB,
      {
        mcpConfig: JSON.stringify(resultServerConfig),
      },
    )
  }
}
