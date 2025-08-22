import { eventBus } from '@/events/eventbus'
// import {
//   WINDOW_EVENTS,
//   TRAY_EVENTS,
//   FLOATING_BUTTON_EVENTS,
// } from '@/events/events'
import { handleShowHiddenWindow } from '@/utils'

export async function appFocus() {
  console.log('🫁 appFocus')
  // 当任何窗口获得焦点时，注册快捷键
  const {
    WINDOW_EVENTS: { APP_FOCUS },
  } = await import('@/events/events')
  eventBus.sendToMain(APP_FOCUS)
}

export async function enabledChanged() {
  console.log('🫁 enabledChanged')
  // 监听悬浮按钮配置变化事件
  const {
    FLOATING_BUTTON_EVENTS: { ENABLED_CHANGED },
  } = await import('@/events/events')
  eventBus.on(ENABLED_CHANGED, async (enabled: boolean) => {
    try {
      console.log('ENABLED_CHANGED', enabled)
      // const { presenter } = await import('@/presenter')
      // await presenter.floatingButtonPresenter.setEnabled(enabled)
    } catch (error) {
      console.error('❌Failed to set floating button enabled state:', error)
    }
  })
}
export async function checkForUpdates() {
  console.log('🫁 checkForUpdates')
  // 托盘 检测更新
  const {
    TRAY_EVENTS: { CHECK_FOR_UPDATES },
  } = await import('@/events/events')
  eventBus.on(CHECK_FOR_UPDATES, async () => {
    // const { presenter } = await import('@/presenter')
    // const allWindows = presenter.windowPresenter.getAllWindows()
    // 查找目标窗口 (焦点窗口或第一个窗口)
    // const targetWindow =
    //   presenter.windowPresenter.getFocusedWindow() || allWindows![0]
    // presenter.windowPresenter.show(targetWindow.id)
    // targetWindow.focus() // 确保窗口置顶
    // 触发更新
    // presenter.upgradePresenter.checkUpdate();
  })
}

export async function ShowHiddenWindow() {
  console.log('🫁 ShowHiddenWindow')
  // 监听显示/隐藏窗口事件 (从托盘或快捷键或悬浮窗口触发)
  const {
    TRAY_EVENTS: { SHOW_HIDDEN_WINDOW },
  } = await import('@/events/events')
  eventBus.on(SHOW_HIDDEN_WINDOW, handleShowHiddenWindow)
}
