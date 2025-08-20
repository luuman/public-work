export type ShortcutScope = 'renderer' | 'system'
export interface ShortcutDefinition {
  value: string
  scope: ShortcutScope
  // priority: ShortcutPriority
}

export const CommandKey = 'CommandOrControl'

const ShiftKey = 'Shift'

// 注册标签页数字快捷键 (1-8) -> 为固定 CommandKey+1 ~ CommandKey+8 切换 Tab
// 如下为常规快捷键定义
export const rendererShortcutKey = {
  // NewConversation: `${CommandKey}+N`,
  // NewWindow: `${CommandKey}+${ShiftKey}+N`,
  // NewTab: `${CommandKey}+T`,
  // CloseTab: `${CommandKey}+W`,
  // ZoomIn: `${CommandKey}+=`,
  // ZoomOut: `${CommandKey}+-`,
  // ZoomResume: `${CommandKey}+0`,
  // GoSettings: `${CommandKey}+,`,
  // CleanChatHistory: `${CommandKey}+L`,
  // DeleteConversation: `${CommandKey}+D`,
  // SwitchNextTab: `${CommandKey}+Tab`,
  SwitchPrevTab: `${CommandKey}+${ShiftKey}+Tab`,
  SwtichToLastTab: `${CommandKey}+9`,
}

// 系统层面 快捷键
export const systemShortcutKey = {
  ShowHideWindow: `${CommandKey}+O`,
  Quit: `${CommandKey}+Q`,
}

export type ShortcutKey =
  | keyof typeof rendererShortcutKey
  | keyof typeof systemShortcutKey

export type ShortcutKeySetting = Record<ShortcutKey, ShortcutDefinition>

export const defaultShortcutKey = {
  ...Object.fromEntries(
    Object.entries(rendererShortcutKey).map(([name, value]) => [
      name,
      { scope: 'renderer', value },
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(systemShortcutKey).map(([name, value]) => [
      name,
      { scope: 'system', value },
    ]),
  ),
} as ShortcutKeySetting
