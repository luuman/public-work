import { BrowserWindow } from 'electron'

/**
 * 主呈现器接口 - 聚合所有子呈现器
 */

export interface IPresenter {
  // 所有子 presenter 实例（这里是公共属性，方便外部 IPC 动态访问）
  // 配置管理，包括读取和写入应用配置
  // configPresenter: IConfigPresenter
  // 窗口管理
  windowPresenter: IWindowPresenter
  // 设备管理
  // devicePresenter: IDevicePresenter
  // 快捷键管理
  // shortcutPresenter: IShortcutPresenter
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
  sendToDefaultTab(
    channel: string,
    switchToTarget?: boolean,
    ...args: unknown[]
    // 发送消息到默认标签页
  ): Promise<boolean>
  // 关闭窗口
  closeWindow(windowId: number, forceClose?: boolean): Promise<void>
}
