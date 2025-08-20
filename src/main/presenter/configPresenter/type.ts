export interface IConfigPresenter {
  getSetting<T>(key: string): T | undefined
  setSetting<T>(key: string, value: T): void
  getProviders(): LLM_PROVIDER[]
  setProviders(providers: LLM_PROVIDER[]): void
  getProviderById(id: string): LLM_PROVIDER | undefined
  setProviderById(id: string, provider: LLM_PROVIDER): void
  getProviderModels(providerId: string): MODEL_META[]
  setProviderModels(providerId: string, models: MODEL_META[]): void
  getEnabledProviders(): LLM_PROVIDER[]
  getModelDefaultConfig(modelId: string, providerId?: string): ModelConfig
  getAllEnabledModels(): Promise<
    { providerId: string; models: RENDERER_MODEL_META[] }[]
  >
  // 音效设置
  getSoundEnabled(): boolean
  setSoundEnabled(enabled: boolean): void
  // COT拷贝设置
  getCopyWithCotEnabled(): boolean
  setCopyWithCotEnabled(enabled: boolean): void
  // 悬浮按钮设置
  getFloatingButtonEnabled(): boolean
  setFloatingButtonEnabled(enabled: boolean): void
  // 日志设置
  getLoggingEnabled(): boolean
  setLoggingEnabled(enabled: boolean): void
  openLoggingFolder(): void
  // 自定义模型管理
  getCustomModels(providerId: string): MODEL_META[]
  setCustomModels(providerId: string, models: MODEL_META[]): void
  addCustomModel(providerId: string, model: MODEL_META): void
  removeCustomModel(providerId: string, modelId: string): void
  updateCustomModel(
    providerId: string,
    modelId: string,
    updates: Partial<MODEL_META>,
  ): void
  // 关闭行为设置
  getCloseToQuit(): boolean
  setCloseToQuit(value: boolean): void
  getModelStatus(providerId: string, modelId: string): boolean
  setModelStatus(providerId: string, modelId: string, enabled: boolean): void
  // 批量获取模型状态
  getBatchModelStatus(
    providerId: string,
    modelIds: string[],
  ): Record<string, boolean>
  // 语言设置
  getLanguage(): string
  setLanguage(language: string): void
  getDefaultProviders(): LLM_PROVIDER[]
  // 代理设置
  getProxyMode(): string
  setProxyMode(mode: string): void
  getCustomProxyUrl(): string
  setCustomProxyUrl(url: string): void
  // 自定义搜索引擎
  getCustomSearchEngines(): Promise<SearchEngineTemplate[]>
  setCustomSearchEngines(engines: SearchEngineTemplate[]): Promise<void>
  // 搜索预览设置
  getSearchPreviewEnabled(): Promise<boolean>
  setSearchPreviewEnabled(enabled: boolean): void
  // 投屏保护设置
  getContentProtectionEnabled(): boolean
  setContentProtectionEnabled(enabled: boolean): void
  // 同步设置
  getSyncEnabled(): boolean
  setSyncEnabled(enabled: boolean): void
  getSyncFolderPath(): string
  setSyncFolderPath(folderPath: string): void
  getLastSyncTime(): number
  setLastSyncTime(time: number): void
  // MCP配置相关方法
  getMcpServers(): Promise<Record<string, MCPServerConfig>>
  setMcpServers(servers: Record<string, MCPServerConfig>): Promise<void>
  getMcpDefaultServers(): Promise<string[]>
  addMcpDefaultServer(serverName: string): Promise<void>
  removeMcpDefaultServer(serverName: string): Promise<void>
  toggleMcpDefaultServer(serverName: string): Promise<void>
  getMcpEnabled(): Promise<boolean>
  setMcpEnabled(enabled: boolean): Promise<void>
  addMcpServer(serverName: string, config: MCPServerConfig): Promise<boolean>
  removeMcpServer(serverName: string): Promise<void>
  updateMcpServer(
    serverName: string,
    config: Partial<MCPServerConfig>,
  ): Promise<void>
  getMcpConfHelper(): any // 用于获取MCP配置助手
  getModelConfig(modelId: string, providerId?: string): ModelConfig
  setModelConfig(modelId: string, providerId: string, config: ModelConfig): void
  resetModelConfig(modelId: string, providerId: string): void
  getAllModelConfigs(): Record<string, IModelConfig>
  getProviderModelConfigs(
    providerId: string,
  ): Array<{ modelId: string; config: ModelConfig }>
  hasUserModelConfig(modelId: string, providerId: string): boolean
  exportModelConfigs(): Record<string, IModelConfig>
  importModelConfigs(
    configs: Record<string, IModelConfig>,
    overwrite: boolean,
  ): void
  setNotificationsEnabled(enabled: boolean): void
  getNotificationsEnabled(): boolean
  // 主题设置
  initTheme(): void
  toggleTheme(theme: 'dark' | 'light' | 'system'): Promise<boolean>
  getTheme(): Promise<string>
  getSystemTheme(): Promise<'dark' | 'light'>
  getCustomPrompts(): Promise<Prompt[]>
  setCustomPrompts(prompts: Prompt[]): Promise<void>
  addCustomPrompt(prompt: Prompt): Promise<void>
  updateCustomPrompt(promptId: string, updates: Partial<Prompt>): Promise<void>
  deleteCustomPrompt(promptId: string): Promise<void>
  // 默认系统提示词设置
  getDefaultSystemPrompt(): Promise<string>
  setDefaultSystemPrompt(prompt: string): Promise<void>
  // 快捷键设置
  getDefaultShortcutKey(): ShortcutKeySetting
  getShortcutKey(): ShortcutKeySetting
  setShortcutKey(customShortcutKey: ShortcutKeySetting): void
  resetShortcutKeys(): void
  // 知识库设置
  getKnowledgeConfigs(): BuiltinKnowledgeConfig[]
  setKnowledgeConfigs(configs: BuiltinKnowledgeConfig[]): void
  diffKnowledgeConfigs(configs: BuiltinKnowledgeConfig[]): {
    added: BuiltinKnowledgeConfig[]
    deleted: BuiltinKnowledgeConfig[]
    updated: BuiltinKnowledgeConfig[]
  }
  // NPM Registry 相关方法
  getNpmRegistryCache?(): any
  setNpmRegistryCache?(cache: any): void
  isNpmRegistryCacheValid?(): boolean
  getEffectiveNpmRegistry?(): string | null
  getCustomNpmRegistry?(): string | undefined
  setCustomNpmRegistry?(registry: string | undefined): void
  getAutoDetectNpmRegistry?(): boolean
  setAutoDetectNpmRegistry?(enabled: boolean): void
  clearNpmRegistryCache?(): void
}
