/**
 * Electron 主进程事件常量定义
 * @see https://www.electronjs.org/docs/latest/api/app#events
 * @see https://www.electronjs.org/docs/latest/api/browser-window#instance-events
 * @see https://www.electronjs.org/docs/latest/api/web-contents#instance-events
 * @see https://www.electronjs.org/docs/latest/api/session#instance-events
 */
/**
 * Electron 主进程事件常量定义
 * @see https://www.electronjs.org/docs/latest/api/app#events
 * @see https://www.electronjs.org/docs/latest/api/browser-window#instance-events
 * @see https://www.electronjs.org/docs/latest/api/web-contents#instance-events
 * @see https://www.electronjs.org/docs/latest/api/session#instance-events
 */

export const ON_APP = {
  READY: 'ready', // Electron 初始化完成
  ACTIVATE: 'activate', // Dock 图标点击激活 (macOS)
  WINDOW_ALL_CLOSED: 'window-all-closed', // 所有窗口关闭
  SECOND_INSTANCE: 'second-instance', // 检测到第二个实例
  OPEN_FILE: 'open-file', // 双击文件唤起 (macOS)
  OPEN_URL: 'open-url', // URL Scheme 唤起 (macOS)
  ACCESSIBILITY_SUPPORT_CHANGED: 'accessibility-support-changed', // 辅助功能启用状态变化
  ACTIVITY_CHANGED: 'activity-changed', // 活动状态变化
} as const

export const ON_QUIT = {
  BEFORE_QUIT: 'before-quit', // 调用 app.quit() 时触发
  WILL_QUIT: 'will-quit', // 应用即将退出时触发
  QUIT: 'quit', // 应用完全退出时触发
} as const

export const ON_WINDOW = {
  BLUR: 'browser-window-blur', // 窗口失焦
  FOCUS: 'browser-window-focus', // 窗口聚焦
  CREATED: 'browser-window-created', // 窗口创建
  DESTROYED: 'browser-window-destroyed', // 窗口销毁
  SHOW: 'show', // 窗口显示
  HIDE: 'hide', // 窗口隐藏
  CLOSE: 'close', // 窗口请求关闭
  MINIMIZE: 'minimize', // 窗口最小化
  MAXIMIZE: 'maximize', // 窗口最大化
  RESTORE: 'restore', // 窗口从最小化/最大化恢复
  RESIZE: 'resize', // 窗口尺寸变化
  MOVE: 'move', // 窗口移动
} as const

export const ON_PROCESS = {
  RENDERER_CRASHED: 'renderer-process-crashed', // 渲染进程崩溃
  RENDER_PROCESS_GONE: 'render-process-gone', // 渲染进程消失 (崩溃/被杀死)
  CHILD_PROCESS_GONE: 'child-process-gone', // 子进程退出
  GPU_CRASHED: 'gpu-process-crashed', // GPU 进程崩溃
  PLUGIN_CRASHED: 'plugin-crashed', // 插件进程崩溃 (如 Flash)
} as const

export const ON_SECURITY = {
  CERTIFICATE_ERROR: 'certificate-error', // HTTPS 证书验证失败
  SELECT_CLIENT_CERTIFICATE: 'select-client-certificate', // 请求客户端证书
  LOGIN: 'login', // HTTP 身份验证请求
} as const

export const ON_MACOS = {
  CONTINUE_ACTIVITY: 'continue-activity', // Handoff 继续活动
  ACTIVITY_WAS_CONTINUED: 'activity-was-continued', // Handoff 活动已继续
  WILL_CONTINUE_ACTIVITY: 'will-continue-activity', // 即将 Handoff 活动
  CONTINUE_ACTIVITY_ERROR: 'continue-activity-error', // Handoff 出错
  UPDATE_ACTIVITY_STATE: 'update-activity-state', // Handoff 状态更新
  NEW_WINDOW_FOR_TAB: 'new-window-for-tab', // 新建窗口标签页 (macOS)
} as const

export const ON_WEB_CONTENTS = {
  DID_FINISH_LOAD: 'did-finish-load', // 页面加载完成
  DID_FAIL_LOAD: 'did-fail-load', // 页面加载失败
  DID_FRAME_FINISH_LOAD: 'did-frame-finish-load', // frame 加载完成
  CRASHED: 'crashed', // 渲染进程崩溃
  UNRESPONSIVE: 'unresponsive', // 页面无响应
  RESPONSIVE: 'responsive', // 页面恢复响应
  NEW_WINDOW: 'new-window', // 页面请求新窗口 (已废弃, 建议用 setWindowOpenHandler)
  CONSOLE_MESSAGE: 'console-message', // 控制台消息输出
  WILL_NAVIGATE: 'will-navigate', // 页面即将跳转
  DID_NAVIGATE: 'did-navigate', // 页面跳转完成
  DID_NAVIGATE_IN_PAGE: 'did-navigate-in-page', // 页面内导航完成 (如 hash 变化)
  DOM_READY: 'dom-ready', // DOM 加载完成
} as const

export const ON_SESSION = {
  EXTENSION_LOADED: 'extension-loaded', // 扩展加载完成
  EXTENSION_UNLOADED: 'extension-unloaded', // 扩展卸载
  EXTENSION_READY: 'extension-ready', // 扩展准备就绪
} as const

export const ON_SYSTEM = {
  ONLINE: 'online', // 系统网络在线
  OFFLINE: 'offline', // 系统网络离线
} as const
