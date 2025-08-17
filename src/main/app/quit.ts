console.log('😊 quit')
// import { appLog } from '@/presenter/logPresenter'

/**
 * 在应用即将退出时触发，适合进行最终的资源清理 (如销毁托盘)
 */
export async function willQuit(appInstance: Electron.App) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appInstance.on('will-quit', async (_event) => {
    console.log('main: app will-quit event triggered.')
    const { presenter } = await import('@/presenter')
    // 销毁托盘图标
    if (presenter.trayPresenter) {
      console.log('main: Destroying tray during will-quit.')
      presenter.trayPresenter.destroy()
    } else {
      console.warn(
        'main: TrayPresenter not found in presenter during will-quit.',
      )
    }

    if (presenter.destroy) {
      console.log('main: Calling presenter.destroy() during will-quit.')
      presenter.destroy()
    }
  })
}

/**
 *  在应用退出之前触发，早于 will-quit。通常不如 will-quit 适合资源清理。
 * 在这里销毁悬浮按钮，确保应用能正常退出
 */
export async function beforeQuit(appInstance: Electron.App) {
  appInstance.on('before-quit', async () => {
    try {
      const { presenter } = await import('@/presenter')
      presenter.floatingButtonPresenter.destroy()
    } catch (error) {
      console.error(
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
  appInstance.on('window-all-closed', async () => {
    const { presenter } = await import('@/presenter')

    const mainWindows = presenter.windowPresenter.getAllWindows()

    if (mainWindows.length === 0) {
      // 只有悬浮按钮窗口时，在非 macOS 平台退出应用
      if (process.platform !== 'darwin') {
        console.log(
          'main: All main windows closed on non-macOS platform, quitting app',
        )
        appInstance.quit()
      } else {
        console.log(
          'main: All main windows closed on macOS, keeping app running in dock',
        )
      }
    }
  })
}

export async function didFinishLoad(appInstance: Electron.App) {
  // appInstance.on('did-finish-load', () => {
  //   appLog.info('did-finish-load')
  // })
}
