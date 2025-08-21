import { ON_APP } from './appEvent'

const { ACTIVATE } = ON_APP

export function setupMacArgs(appInstance: Electron.App) {
  // macOS 平台特定参数
  appInstance.commandLine.appendSwitch(
    'disable-features',
    'DesktopCaptureMacV2,IOSurfaceCapturer',
  )
}

export async function setupMacStartup(appInstance: Electron.App) {
  // 处理应用激活事件 (如 macOS 点击 Dock 图标)
  appInstance.on(ACTIVATE, async function () {
    const { presenter } = await import('@/presenter')
    // 在 macOS 上，点击 Dock 图标时重新创建窗口很常见
    // 同时处理已隐藏窗口的显示
    const allWindows = presenter.windowPresenter.getAllWindows()
    if (allWindows.length === 0) {
      presenter.windowPresenter.createShellWindow({
        initialTab: {
          url: 'local://chat',
        },
      })
    } else {
      // // 尝试显示最近焦点的窗口，否则显示第一个窗口
      // const targetWindow =
      //   presenter.windowPresenter.getFocusedWindow() || allWindows[0]
      // if (!targetWindow.isDestroyed()) {
      //   targetWindow.show()
      //   if (process.env.NODE_ENV !== 'development') {
      //     targetWindow.focus()
      //   }
      // } else {
      //   console.warn(
      //     'App activated but target window is destroyed, creating new window.',
      //   ) // 保持 warn
      //   presenter.windowPresenter.createShellWindow({
      //     // 如果目标窗口已销毁，创建新窗口
      //     initialTab: { url: 'local://chat' },
      //   })
      // }
    }
  })
}
