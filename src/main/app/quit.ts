import { appLog } from '@/presenter/logPresenter'
import { ON_APP, ON_QUIT } from './appEvent'

const { WINDOW_ALL_CLOSED, SECOND_INSTANCE } = ON_APP
const { BEFORE_QUIT, WILL_QUIT, QUIT } = ON_QUIT

/**
 * 在应用即将退出时触发，适合进行最终的资源清理 (如销毁托盘)
 */
export async function handleSecondInstance(appInstance: Electron.App) {
  appLog.info('app handleSecondInstance')
  appInstance.on(
    SECOND_INSTANCE,
    (event: Electron.Event, argv: string[], cwd: string) => {
      appLog.info('main: app second-instance event triggered.')
      appLog.info('second-instace', argv)
      console.log('ENABLED_CHANGED', event)

      appLog.info(argv.join(',')) // 应显示string[]
      appLog.info(cwd.toLowerCase()) // 应显示string

      // const win = BrowserWindow.getAllWindows()[0]
      // if (win) {
      //   if (win.isMinimized()) win.restore()
      //   win.focus()

      //   appLog.info('second-instace', argv)
      //   const deepLink = argv.find((arg) => arg.startsWith('myapp://'))
      //   if (deepLink) win.webContents.send('deep-link', deepLink)
      // }
    },
  )
}

/**
 * 在应用即将退出时触发，适合进行最终的资源清理 (如销毁托盘)
 */
export async function willQuit(appInstance: Electron.App) {
  appLog.info('app willQuit')
  appInstance.on(WILL_QUIT, async (event: Electron.Event) => {
    appLog.info('main: app will-quit event triggered.')
    console.log('ENABLED_CHANGED', event)

    const { presenter } = await import('@/presenter')
    // 销毁托盘图标
    if (presenter.trayPresenter) {
      appLog.info('main: Destroying tray during will-quit.')
      presenter.trayPresenter.destroy()
    } else {
      appLog.warn(
        'main: TrayPresenter not found in presenter during will-quit.',
      )
    }

    if (presenter.destroy) {
      appLog.info('main: Calling presenter.destroy() during will-quit.')
      presenter.destroy()
    }
  })
}

/**
 *  在应用退出之前触发，早于 will-quit。通常不如 will-quit 适合资源清理。
 * 在这里销毁悬浮按钮，确保应用能正常退出
 */
export async function beforeQuit(appInstance: Electron.App) {
  appLog.info('app beforeQuit')
  appInstance.on(BEFORE_QUIT, async () => {
    try {
      // const { presenter } = await import('@/presenter')
      // presenter.floatingButtonPresenter.destroy()
    } catch (error) {
      appLog.error(
        '❌main: Error destroying floating button during before-quit:',
        error,
      )
    }
  })
}
/**
 *  当所有主窗口都关闭时的处理逻辑
 * macOS 平台会保留在 Dock 中，Windows 会保留在托盘。
 * 悬浮按钮窗口不计入主窗口数量
 */
export async function windowAllClosed(appInstance: Electron.App) {
  appLog.info('app windowAllClosed')
  appInstance.on(WINDOW_ALL_CLOSED, async () => {
    const { presenter } = await import('@/presenter')

    const mainWindows = presenter.windowPresenter.getAllWindows()

    if (mainWindows.length === 0) {
      // 只有悬浮按钮窗口时，在非 macOS 平台退出应用
      if (process.platform !== 'darwin') {
        appLog.info(
          'main: All main windows closed on non-macOS platform, quitting app',
        )
        appInstance.quit()
      } else {
        appLog.info(
          'main: All main windows closed on macOS, keeping app running in dock',
        )
      }
    }
  })
}

export async function appQuit(appInstance: Electron.App) {
  appLog.info('app appQuit')
  appInstance.on(QUIT, async () => {
    appLog.info('main: app quit event triggered.')
  })
}

export async function didFinishLoad(appInstance: Electron.App) {
  appLog.info('app didFinishLoad')
  appInstance.on(QUIT, () => {
    appLog.info('did-finish-load')
  })
}
