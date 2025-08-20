/**
 * Electron App 事件常量定义
 * @see https://www.electronjs.org/docs/latest/api/app#events
 */

export const ON_APP = {
  READY: 'ready', // 当 Electron 完成初始化时触发 平台：All
  ACTIVATE: 'activate', // 当用户点击 Dock 图标或重新激活应用时触发 平台：macOS
  WINDOW_ALL_CLOSED: 'window-all-closed', // 当所有窗口都被关闭时触发 平台：All
  SECOND_INSTANCE: 'second-instance', // 当检测到第二个实例启动时触发（需 requestSingleInstanceLock） 平台：All
  OPEN_FILE: 'open-file', // 当用户通过双击文件打开应用时触发 平台：macOS
  OPEN_URL: 'open-url', // 当应用被 URL Scheme 唤起时触发 平台：macOS
} as const

export const ON_QUIT = {
  BEFORE_QUIT: 'before-quit', // 当调用 app.quit() 时触发 平台：All
  WILL_QUIT: 'will-quit', // 当应用即将退出时触发 平台：All
  QUIT: 'quit', // 当应用退出完成时触发 平台：All
} as const

export const ON_WINDOW = {
  BLUR: 'browser-window-blur', // 当 BrowserWindow 失焦时触发 平台：All
  FOCUS: 'browser-window-focus', // 当 BrowserWindow 获取焦点时触发 平台：All
  CREATED: 'browser-window-created', // 当新建 BrowserWindow 时触发 平台：All
  DESTROYED: 'browser-window-destroyed', // 当 BrowserWindow 被销毁时触发 平台：All
} as const

export const ON_PROCESS = {
  RENDERER_CRASHED: 'renderer-process-crashed', // 当渲染进程崩溃时触发 平台：All
  RENDER_PROCESS_GONE: 'render-process-gone', // 当渲染进程退出（无论是否崩溃）时触发 平台：All
  CHILD_PROCESS_GONE: 'child-process-gone', // 当子进程退出时触发 平台：All
  GPU_CRASHED: 'gpu-process-crashed', // 当 GPU 进程崩溃时触发 平台：All
  PLUGIN_CRASHED: 'plugin-crashed', // 当插件进程崩溃时触发（如 Flash） 平台：All
} as const

export const ON_SECURITY = {
  CERTIFICATE_ERROR: 'certificate-error', // 当 HTTPS 证书验证失败时触发 平台：All
  SELECT_CLIENT_CERTIFICATE: 'select-client-certificate', // 当请求客户端证书时触发 平台：All
  LOGIN: 'login', // 当需要 HTTP 身份认证时触发 平台：All
} as const

export const ON_MACOS = {
  CONTINUE_ACTIVITY: 'continue-activity', // 当 macOS Handoff 功能继续活动时触发
  ACTIVITY_WAS_CONTINUED: 'activity-was-continued', // 当 Handoff 活动已继续时触发
  WILL_CONTINUE_ACTIVITY: 'will-continue-activity', // 当 Handoff 即将继续时触发
  CONTINUE_ACTIVITY_ERROR: 'continue-activity-error', // 当 Handoff 出错时触发
  UPDATE_ACTIVITY_STATE: 'update-activity-state', // 当 Handoff 状态更新时触发
  NEW_WINDOW_FOR_TAB: 'new-window-for-tab', // 当 macOS 新建窗口标签页时触发
} as const
