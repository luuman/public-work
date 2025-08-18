import { BrowserWindow } from 'electron'

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

export interface CreateWindowOptions {
  activateTabId?: number
  initialTab?: {
    url: string
    icon?: string
  }
  x?: number
  y?: number
}

export interface WindowFocusState {
  lastFocusTime: number
  shouldFocus: boolean
  isNewWindow: boolean
  hasInitialFocus: boolean
}

export interface IpcHandlers {
  registerAll(): void
  unregisterAll(): void
}
