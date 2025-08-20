import { IDeeplinkPresenter } from '@shared/presenter'

/**
 * MCP安装配置类型定义
 */
export interface MCPInstallConfig {
  mcpServers: Record<
    string,
    {
      command?: string // 命令行指令
      args?: string[] // 命令行参数
      env?: Record<string, string> | string // 环境变量
      descriptions?: string // 服务描述
      icons?: string // 图标
      autoApprove?: string[] // 自动批准的权限
      disable?: boolean // 是否禁用
      url?: string // 服务URL
      type?: 'sse' | 'stdio' | 'http' // 服务类型
    }
  >
}

/**
 * DeepLink启动参数
 */
export interface StartCommandParams {
  msg: string | null // 初始消息
  modelId: string | null // 模型ID
  systemPrompt: string | null // 系统提示
  mentions: string[] // 提及列表
  autoSend: boolean // 是否自动发送
}
