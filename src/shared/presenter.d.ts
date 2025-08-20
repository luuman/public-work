import { BrowserWindow } from 'electron'
import { ShortcutKeySetting } from '@/presenter/configPresenter/shortcutKeySettings'

export {
  ShortcutKey,
  ShortcutKeySetting,
} from '@/presenter/configPresenter/shortcutKeySettings'

/**
 * 主呈现器接口 - 聚合所有子呈现器
 */

export interface IPresenter {
  // 所有子 presenter 实例（这里是公共属性，方便外部 IPC 动态访问）
  // 配置管理，包括读取和写入应用配置
  configPresenter: IConfigPresenter
  // 窗口管理
  windowPresenter: IWindowPresenter
  // 设备管理
  // devicePresenter: IDevicePresenter
  // 快捷键管理
  shortcutPresenter: IShortcutPresenter
  // 文件管理
  // filePresenter: IFilePresenter
  // 通知管理
  // notificationPresenter: INotificationPresenter
  // 系统托盘管理
  // trayPresenter: ITrayPresenter
  // 对话框管理
  // dialogPresenter: IDialogPresenter
  // 悬浮按钮管理
  // floatingButtonPresenter: IFloatingButtonPresenter
  // 应用升级与版本控制管理
  // upgradePresenter: IUpgradePresenter
  // 标签页管理
  // tabPresenter: ITabPresenter
  // 数据同步管理
  // syncPresenter: ISyncPresenter
  // 线程或异步任务管理
  // threadPresenter: IThreadPresenter
  // OAuth 授权认证流程管理
  // oauthPresenter: IOAuthPresenter
  // MCP（模型-控制器-呈现器）架构核心协调管理
  // mcpPresenter: IMcpPresenter
  // 深链接处理与跳转管理
  // deeplinkPresenter: IDeeplinkPresenter
  // SQLite 数据库操作和管理
  // sqlitePresenter: ISQLitePresenter
  // 大语言模型服务提供者接口管理
  // llmproviderPresenter: ILLMProviderPresenter
  // 知识库相关业务逻辑管理
  // knowledgePresenter: IKnowledgePresenter
  // LlamaCpp 模型管理（注释掉暂不使用）
  // llamaCppPresenter: ILlamaCppPresenter // 保留原始注释

  // 初始化
  init(): void
  // 销毁
  destroy(): void
}

/**
 * 窗口呈现器接口
 */
export interface IWindowPresenter {
  // 创建Shell窗口

  createShellWindow(options?: {
    // 激活的标签页ID（可选）
    activateTabId?: number
    // 初始标签页（可选）
    initialTab?: { url: string; type?: string; icon?: string }
    // 是否为移动的标签页（可选）
    forMovedTab?: boolean
    // X坐标（可选）
    x?: number
    // Y坐标（可选）
    y?: number
  }): Promise<number | null>

  // 主窗口实例
  mainWindow: BrowserWindow | undefined
  // 预览文件
  previewFile(filePath: string): void
  // 最小化窗口
  minimize(windowId: number): void
  // 最大化窗口
  maximize(windowId: number): void
  // 关闭窗口
  close(windowId: number): void
  // 隐藏窗口
  hide(windowId: number): void
  // 显示窗口
  show(windowId?: number): void
  // 检查是否最大化
  isMaximized(windowId: number): boolean
  // 检查主窗口是否聚焦
  isMainWindowFocused(windowId: number): boolean
  // 发送消息到所有窗口
  sendToAllWindows(channel: string, ...args: unknown[]): void
  // 发送消息到指定窗口
  sendToWindow(windowId: number, channel: string, ...args: unknown[]): boolean
  // sendToDefaultTab(
  //   channel: string,
  //   switchToTarget?: boolean,
  //   ...args: unknown[]
  //   // 发送消息到默认标签页
  // ): Promise<boolean>
  // 关闭窗口
  closeWindow(windowId: number, forceClose?: boolean): Promise<void>
}

export interface IConfigPresenter {
  getSetting<T>(key: string): T | undefined
  setSetting<T>(key: string, value: T): void
  // getProviders(): LLM_PROVIDER[]
  // setProviders(providers: LLM_PROVIDER[]): void
  // getProviderById(id: string): LLM_PROVIDER | undefined
  // setProviderById(id: string, provider: LLM_PROVIDER): void
  // getProviderModels(providerId: string): MODEL_META[]
  // setProviderModels(providerId: string, models: MODEL_META[]): void
  // getEnabledProviders(): LLM_PROVIDER[]
  // getModelDefaultConfig(modelId: string, providerId?: string): ModelConfig
  // getAllEnabledModels(): Promise<
  //   { providerId: string; models: RENDERER_MODEL_META[] }[]
  // >
  // // 音效设置
  // getSoundEnabled(): boolean
  // setSoundEnabled(enabled: boolean): void
  // // COT拷贝设置
  // getCopyWithCotEnabled(): boolean
  // setCopyWithCotEnabled(enabled: boolean): void
  // // 悬浮按钮设置
  // getFloatingButtonEnabled(): boolean
  // setFloatingButtonEnabled(enabled: boolean): void
  // 日志设置
  getLoggingEnabled(): boolean
  setLoggingEnabled(enabled: boolean): void
  // openLoggingFolder(): void
  // // 自定义模型管理
  // getCustomModels(providerId: string): MODEL_META[]
  // setCustomModels(providerId: string, models: MODEL_META[]): void
  // addCustomModel(providerId: string, model: MODEL_META): void
  // removeCustomModel(providerId: string, modelId: string): void
  // updateCustomModel(
  //   providerId: string,
  //   modelId: string,
  //   updates: Partial<MODEL_META>,
  // ): void
  // 关闭行为设置
  getCloseToQuit(): boolean
  setCloseToQuit(value: boolean): void
  // getModelStatus(providerId: string, modelId: string): boolean
  // setModelStatus(providerId: string, modelId: string, enabled: boolean): void
  // // 批量获取模型状态
  // getBatchModelStatus(
  //   providerId: string,
  //   modelIds: string[],
  // ): Record<string, boolean>
  // 语言设置
  getLanguage(): string
  setLanguage(language: string): void
  // getDefaultProviders(): LLM_PROVIDER[]
  // // 代理设置
  // getProxyMode(): string
  // setProxyMode(mode: string): void
  // getCustomProxyUrl(): string
  // setCustomProxyUrl(url: string): void
  // // 自定义搜索引擎
  // getCustomSearchEngines(): Promise<SearchEngineTemplate[]>
  // setCustomSearchEngines(engines: SearchEngineTemplate[]): Promise<void>
  // // 搜索预览设置
  // getSearchPreviewEnabled(): Promise<boolean>
  // setSearchPreviewEnabled(enabled: boolean): void
  // // 投屏保护设置
  // getContentProtectionEnabled(): boolean
  // setContentProtectionEnabled(enabled: boolean): void
  // // 同步设置
  // getSyncEnabled(): boolean
  // setSyncEnabled(enabled: boolean): void
  // getSyncFolderPath(): string
  // setSyncFolderPath(folderPath: string): void
  // getLastSyncTime(): number
  // setLastSyncTime(time: number): void
  // // MCP配置相关方法
  // getMcpServers(): Promise<Record<string, MCPServerConfig>>
  // setMcpServers(servers: Record<string, MCPServerConfig>): Promise<void>
  // getMcpDefaultServers(): Promise<string[]>
  // addMcpDefaultServer(serverName: string): Promise<void>
  // removeMcpDefaultServer(serverName: string): Promise<void>
  // toggleMcpDefaultServer(serverName: string): Promise<void>
  // getMcpEnabled(): Promise<boolean>
  // setMcpEnabled(enabled: boolean): Promise<void>
  // addMcpServer(serverName: string, config: MCPServerConfig): Promise<boolean>
  // removeMcpServer(serverName: string): Promise<void>
  // updateMcpServer(
  //   serverName: string,
  //   config: Partial<MCPServerConfig>,
  // ): Promise<void>
  // getMcpConfHelper(): any // 用于获取MCP配置助手
  // getModelConfig(modelId: string, providerId?: string): ModelConfig
  // setModelConfig(modelId: string, providerId: string, config: ModelConfig): void
  // resetModelConfig(modelId: string, providerId: string): void
  // getAllModelConfigs(): Record<string, IModelConfig>
  // getProviderModelConfigs(
  //   providerId: string,
  // ): Array<{ modelId: string; config: ModelConfig }>
  // hasUserModelConfig(modelId: string, providerId: string): boolean
  // exportModelConfigs(): Record<string, IModelConfig>
  // importModelConfigs(
  //   configs: Record<string, IModelConfig>,
  //   overwrite: boolean,
  // ): void
  // setNotificationsEnabled(enabled: boolean): void
  // getNotificationsEnabled(): boolean
  // 主题设置
  initTheme(): void
  toggleTheme(theme: 'dark' | 'light' | 'system'): Promise<boolean>
  getTheme(): Promise<string>
  getSystemTheme(): Promise<'dark' | 'light'>
  // getCustomPrompts(): Promise<Prompt[]>
  // setCustomPrompts(prompts: Prompt[]): Promise<void>
  // addCustomPrompt(prompt: Prompt): Promise<void>
  // updateCustomPrompt(promptId: string, updates: Partial<Prompt>): Promise<void>
  // deleteCustomPrompt(promptId: string): Promise<void>
  // 默认系统提示词设置
  // getDefaultSystemPrompt(): Promise<string>
  // setDefaultSystemPrompt(prompt: string): Promise<void>
  // 快捷键设置
  getDefaultShortcutKey(): ShortcutKeySetting
  getShortcutKey(): ShortcutKeySetting
  setShortcutKey(customShortcutKey: ShortcutKeySetting): void
  resetShortcutKeys(): void
  // // 知识库设置
  // getKnowledgeConfigs(): BuiltinKnowledgeConfig[]
  // setKnowledgeConfigs(configs: BuiltinKnowledgeConfig[]): void
  // diffKnowledgeConfigs(configs: BuiltinKnowledgeConfig[]): {
  //   added: BuiltinKnowledgeConfig[]
  //   deleted: BuiltinKnowledgeConfig[]
  //   updated: BuiltinKnowledgeConfig[]
  // }
  // // NPM Registry 相关方法
  // getNpmRegistryCache?(): any
  // setNpmRegistryCache?(cache: any): void
  // isNpmRegistryCacheValid?(): boolean
  // getEffectiveNpmRegistry?(): string | null
  // getCustomNpmRegistry?(): string | undefined
  // setCustomNpmRegistry?(registry: string | undefined): void
  // getAutoDetectNpmRegistry?(): boolean
  // setAutoDetectNpmRegistry?(enabled: boolean): void
  // clearNpmRegistryCache?(): void
}
/**
 * 快捷键呈现器接口
 */
export interface IShortcutPresenter {
  // 注册快捷键
  registerShortcuts(): void
  // 销毁快捷键
  destroy(): void
}

export interface IDevicePresenter {
  getAppVersion(): Promise<string>
  getDeviceInfo(): Promise<DeviceInfo>
  getCPUUsage(): Promise<number>
  getMemoryUsage(): Promise<MemoryInfo>
  getDiskSpace(): Promise<DiskInfo>
  resetData(): Promise<void>
  resetDataByType(
    resetType: 'chat' | 'knowledge' | 'config' | 'all',
  ): Promise<void>

  // 目录选择和应用重启
  selectDirectory(): Promise<{ canceled: boolean; filePaths: string[] }>
  restartApp(): Promise<void>

  // 图片缓存
  cacheImage(imageData: string): Promise<string>
}

export type DeviceInfo = {
  platform: string
  arch: string
  cpuModel: string
  totalMemory: number
  osVersion: string
}

export type MemoryInfo = {
  total: number
  free: number
  used: number
}

export type DiskInfo = {
  total: number
  free: number
  used: number
}
