// import { WINDOW_EVENTS } from '@/events/events'
import { msgAllLog } from '@/presenter/logPresenter'
import { presenter } from '@/presenter'

let eventBus: (typeof import('@/events/eventbus'))['eventBus']

export async function setupCommon(appInstance: Electron.App) {
  createShellWindow(presenter)

  const { electronApp } = await import('@electron-toolkit/utils')
  electronApp.setAppUserModelId('com.yourcompany.yourapp')

  const { eventBus: e } = await import('@/events/eventbus')
  eventBus = e

  //   if (process.env.NODE_ENV === 'development') {
  //     // 只在开发环境执行的代码
  //     console.log('开发环境，加载开发辅助模块')
  //   }

  // 从配置中读取日志设置并应用
  // const loggingEnabled = presenter.configPresenter.getLoggingEnabled()
  // setLoggingEnabled(loggingEnabled)

  // 初始化托盘图标和菜单，并存储 presenter 实例
  // presenter.setupTray()

  // 立即进行基本初始化，不等待窗口ready-to-show事件
  // presenter.init()

  if (process.env.NODE_ENV === 'development') {
    import('./main-dev').then(async ({ setupDev }) => {
      const { optimizer } = await import('@electron-toolkit/utils')
      setupDev(appInstance, optimizer)
    })
  }

  if (process.platform === 'darwin') {
    import('./main-mac').then(({ setupMacStartup }) =>
      setupMacStartup(appInstance),
    )
  } else if (process.platform === 'win32') {
    import('./main-win').then(({ setupWinStartup }) => setupWinStartup)
  }

  // 延迟注册快捷键（等第一个窗口创建）
  appInstance.once('browser-window-created', async () => {
    // const { presenter } = await import('@/presenter')
    msgAllLog.info('app-start shortcutPresenter', presenter.shortcutPresenter)
    // if (presenter?.shortcutPresenter) {
    //   presenter.shortcutPresenter.registerShortcuts()
    // }
  })

  const { enabledChanged, checkForUpdates, ShowHiddenWindow } = await import(
    './main-event'
  )
  // timeLogger(enabledChanged)()
  enabledChanged()
  checkForUpdates()
  ShowHiddenWindow()

  // 协议注册
  setImmediate(async () => {
    const { registerProtocols } = await import('./protocols')
    registerProtocols()
  })

  // 剥离代码块
  // if (__DEV__) {
  //   timeLogger(enabledChanged)()
  // }

  setTimeout(async () => {
    // const { presenter } = await import('@/presenter')

    // console.timeEnd('MainWindow Delay')

    browserWindowFocus(appInstance)
    browserWindowBlur(appInstance, presenter)
  }, 100)
}

export function browserWindowFocus(appInstance: Electron.App) {
  // 监听浏览器窗口获得焦点事件
  appInstance.on('browser-window-focus', async () => {
    // 当任何窗口获得焦点时
    const {
      WINDOW_EVENTS: { APP_FOCUS },
    } = await import('@/events/events')
    eventBus.sendToMain(APP_FOCUS)
  })
}

export function browserWindowBlur(
  appInstance: Electron.App,
  presenterInstance: any,
) {
  // 监听浏览器窗口失去焦点事件
  appInstance.on('browser-window-blur', () => {
    // 检查是否所有窗口都已失去焦点，如果是则注销快捷键
    // 使用短延迟以处理窗口间焦点切换
    setTimeout(async () => {
      const allWindows = presenterInstance.windowPresenter.getAllWindows()
      const isAnyWindowFocused = allWindows.some(
        (win) => !win.isDestroyed() && win.isFocused(),
      )
      if (!isAnyWindowFocused) {
        const {
          WINDOW_EVENTS: { APP_BLUR },
        } = await import('@/events/events')
        eventBus.sendToMain(APP_BLUR)
      }
    }, 50) // 50毫秒延迟
  })
}

export async function createShellWindow(presenterInstance: any) {
  try {
    const windowId = await presenterInstance.windowPresenter.createShellWindow()
    if (windowId) {
      console.log(
        `Main: Initial shell window created successfully with ID: ${windowId}`,
      )
    } else {
      console.error(
        'Main: Failed to create initial shell window - returned null',
      )
    }
  } catch (error) {
    console.error('❌Main: Error creating initial shell window:', error)
  }
}
