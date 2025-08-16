console.log('😊 CONFIG_EVENTS')
/**
 * 事件系统常量定义
 *
 * 按功能领域分类事件名，采用统一的命名规范：
 * - 使用冒号分隔域和具体事件
 * - 使用小写并用连字符连接多个单词
 *
 * 看似这里和 renderer/events.ts 重复了，其实不然，这里只包含了main->renderer 和 main->main 的事件
 */

// 配置相关事件
export const CONFIG_EVENTS = {
  PROVIDER_CHANGED: 'config:provider-changed', // 替代 provider-setting-changed
  MODEL_LIST_CHANGED: 'config:model-list-changed', // 替代 provider-models-updated（ConfigPresenter）
  MODEL_STATUS_CHANGED: 'config:model-status-changed', // 替代 model-status-changed（ConfigPresenter）
  SETTING_CHANGED: 'config:setting-changed', // 替代 setting-changed（ConfigPresenter）
  PROXY_MODE_CHANGED: 'config:proxy-mode-changed',
  CUSTOM_PROXY_URL_CHANGED: 'config:custom-proxy-url-changed',
  SYNC_SETTINGS_CHANGED: 'config:sync-settings-changed',
  SEARCH_ENGINES_UPDATED: 'config:search-engines-updated',
  CONTENT_PROTECTION_CHANGED: 'config:content-protection-changed',
  SOUND_ENABLED_CHANGED: 'config:sound-enabled-changed', // 新增：声音开关变更事件
  COPY_WITH_COT_CHANGED: 'config:copy-with-cot-enabled-changed',
  PROXY_RESOLVED: 'config:proxy-resolved',
  LANGUAGE_CHANGED: 'config:language-changed', // 新增：语言变更事件
  CUSTOM_PROMPTS_SERVER_CHECK_REQUIRED:
    'config:custom-prompts-server-check-required', // 新增：需要检查自定义提示词服务器事件
  // 模型配置相关事件
  MODEL_CONFIG_CHANGED: 'config:model-config-changed', // 模型配置变更事件
  MODEL_CONFIG_RESET: 'config:model-config-reset', // 模型配置重置事件
  MODEL_CONFIGS_IMPORTED: 'config:model-configs-imported', // 模型配置批量导入事件
  // OAuth相关事件
  OAUTH_LOGIN_START: 'config:oauth-login-start', // OAuth登录开始
  OAUTH_LOGIN_SUCCESS: 'config:oauth-login-success', // OAuth登录成功
  OAUTH_LOGIN_ERROR: 'config:oauth-login-error', // OAuth登录失败
}

// 会话相关事件
export const CONVERSATION_EVENTS = {
  LIST_UPDATED: 'conversation:list-updated', // 用于推送完整的会话列表

  ACTIVATED: 'conversation:activated', // 替代 conversation-activated
  DEACTIVATED: 'conversation:deactivated', // 替代 active-conversation-cleared
  MESSAGE_EDITED: 'conversation:message-edited', // 替代 message-edited

  MESSAGE_GENERATED: 'conversation:message-generated', // 主进程内部事件，一条完整的消息已生成
}

// 通信相关事件
export const STREAM_EVENTS = {
  RESPONSE: 'stream:response', // 替代 stream-response
  END: 'stream:end', // 替代 stream-end
  ERROR: 'stream:error', // 替代 stream-error
}

// 系统相关事件
export const SYSTEM_EVENTS = {
  SYSTEM_THEME_UPDATED: 'system:theme-updated',
}

// 应用更新相关事件
export const UPDATE_EVENTS = {
  STATUS_CHANGED: 'update:status-changed', // 替代 update-status-changed
  ERROR: 'update:error', // 替代 update-error
  PROGRESS: 'update:progress', // 下载进度
  WILL_RESTART: 'update:will-restart', // 准备重启
}

// 窗口相关事件
export const WINDOW_EVENTS = {
  READY_TO_SHOW: 'window:ready-to-show', // 替代 main-window-ready-to-show
  FORCE_QUIT_APP: 'window:force-quit-app', // 替代 force-quit-app
  APP_FOCUS: 'app:focus',
  APP_BLUR: 'app:blur',
  WINDOW_MAXIMIZED: 'window:maximized',
  WINDOW_UNMAXIMIZED: 'window:unmaximized',
  WINDOW_RESIZED: 'window:resized',
  WINDOW_RESIZE: 'window:resize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_CREATED: 'window:created',
  WINDOW_FOCUSED: 'window:focused',
  WINDOW_BLURRED: 'window:blurred',
  WINDOW_ENTER_FULL_SCREEN: 'window:enter-full-screen',
  WINDOW_LEAVE_FULL_SCREEN: 'window:leave-full-screen',
  WINDOW_CLOSED: 'window:closed',
  FIRST_CONTENT_LOADED: 'window:first-content-loaded', // 新增：首次内容加载完成事件
  WINDOW_RESTORED: 'window:restored',
}

// ollama 相关事件
export const OLLAMA_EVENTS = {
  PULL_MODEL_PROGRESS: 'ollama:pull-model-progress',
}

// MCP 相关事件
export const MCP_EVENTS = {
  SERVER_STARTED: 'mcp:server-started',
  SERVER_STOPPED: 'mcp:server-stopped',
  CONFIG_CHANGED: 'mcp:config-changed',
  TOOL_CALL_RESULT: 'mcp:tool-call-result',
  SERVER_STATUS_CHANGED: 'mcp:server-status-changed',
  CLIENT_LIST_UPDATED: 'mcp:client-list-updated',
  INITIALIZED: 'mcp:initialized', // 新增：MCP初始化完成事件
}

// 同步相关事件
export const SYNC_EVENTS = {
  BACKUP_STARTED: 'sync:backup-started',
  BACKUP_COMPLETED: 'sync:backup-completed',
  BACKUP_ERROR: 'sync:backup-error',
  IMPORT_STARTED: 'sync:import-started',
  IMPORT_COMPLETED: 'sync:import-completed',
  IMPORT_ERROR: 'sync:import-error',
  DATA_CHANGED: 'sync:data-changed',
}

// 速率限制相关事件
export const RATE_LIMIT_EVENTS = {
  CONFIG_UPDATED: 'rate-limit:config-updated',
  REQUEST_QUEUED: 'rate-limit:request-queued',
  REQUEST_EXECUTED: 'rate-limit:request-executed',
  LIMIT_EXCEEDED: 'rate-limit:limit-exceeded',
}

// DeepLink 相关事件
export const DEEPLINK_EVENTS = {
  PROTOCOL_RECEIVED: 'deeplink:protocol-received',
  START: 'deeplink:start',
  MCP_INSTALL: 'deeplink:mcp-install',
}

// 全局通知相关事件
export const NOTIFICATION_EVENTS = {
  SHOW_ERROR: 'notification:show-error', // 显示错误通知
  SYS_NOTIFY_CLICKED: 'notification:sys-notify-clicked', // 系统通知点击事件
  DATA_RESET_COMPLETE_DEV: 'notification:data-reset-complete-dev', // 开发环境数据重置完成通知
}

export const SHORTCUT_EVENTS = {
  ZOOM_IN: 'shortcut:zoom-in',
  ZOOM_OUT: 'shortcut:zoom-out',
  ZOOM_RESUME: 'shortcut:zoom-resume',
  CREATE_NEW_WINDOW: 'shortcut:create-new-window',
  CREATE_NEW_CONVERSATION: 'shortcut:create-new-conversation',
  CREATE_NEW_TAB: 'shortcut:create-new-tab',
  CLOSE_CURRENT_TAB: 'shortcut:close-current-tab',
  GO_SETTINGS: 'shortcut:go-settings',
  CLEAN_CHAT_HISTORY: 'shortcut:clean-chat-history',
  DELETE_CONVERSATION: 'shortcut:delete-conversation',
  SWITCH_TO_NEXT_TAB: 'shortcut:switch-to-next-tab',
  SWITCH_TO_PREVIOUS_TAB: 'shortcut:switch-to-previous-tab',
  SWITCH_TO_SPECIFIC_TAB: 'shortcut:switch-to-specific-tab',
  SWITCH_TO_LAST_TAB: 'shortcut:switch-to-last-tab',
}

// 标签页相关事件
export const TAB_EVENTS = {
  TITLE_UPDATED: 'tab:title-updated', // 标签页标题更新
  CONTENT_UPDATED: 'tab:content-updated', // 标签页内容更新
  STATE_CHANGED: 'tab:state-changed', // 标签页状态变化
  VISIBILITY_CHANGED: 'tab:visibility-changed', // 标签页可见性变化
  RENDERER_TAB_READY: 'tab:renderer-ready', // 渲染进程标签页就绪
  RENDERER_TAB_ACTIVATED: 'tab:renderer-activated', // 渲染进程标签页激活
  CLOSED: 'tab:closed', // 标签页被关闭事件
}

// 托盘相关事件
export const TRAY_EVENTS = {
  SHOW_HIDDEN_WINDOW: 'tray:show-hidden-window', // 从托盘显示/隐藏窗口
  CHECK_FOR_UPDATES: 'tray:check-for-updates', // 托盘检查更新
}

// MCP会议专用事件
export const MEETING_EVENTS = {
  INSTRUCTION: 'mcp:meeting-instruction', // 主进程向渲染进程发送指令
}

// 悬浮按钮相关事件
export const FLOATING_BUTTON_EVENTS = {
  CLICKED: 'floating-button:clicked', // 悬浮按钮被点击
  VISIBILITY_CHANGED: 'floating-button:visibility-changed', // 悬浮按钮显示状态改变
  POSITION_CHANGED: 'floating-button:position-changed', // 悬浮按钮位置改变
  ENABLED_CHANGED: 'floating-button:enabled-changed', // 悬浮按钮启用状态改变
}

// Dialog related events
export const DIALOG_EVENTS = {
  REQUEST: 'dialog:request', // Main -> Renderer: Request to show dialog
  RESPONSE: 'dialog:response', // Renderer -> Main: Dialog result response
}

// Knowledge base events
export const RAG_EVENTS = {
  FILE_UPDATED: 'rag:file-updated', // File status update
  FILE_PROGRESS: 'rag:file-progress', // File processing progress update
}
