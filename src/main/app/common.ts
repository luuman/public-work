// import { WINDOW_EVENTS } from '@/events/events'
// import { msgAllLog } from '@/presenter/logPresenter'
import { presenter } from '@/presenter'
import { ON_WINDOW } from './appEvent'

const { FOCUS, BLUR } = ON_WINDOW

let eventBus: (typeof import('@/events/eventbus'))['eventBus']

export async function setupCommon(appInstance: Electron.App) {
  console.log('🫁 setupCommon')
  createShellWindow(presenter)

  const { electronApp } = await import('@electron-toolkit/utils')
  electronApp.setAppUserModelId('com.yourcompany.yourapp')

  const { eventBus: e } = await import('@/events/eventbus')
  eventBus = e

  // 立即进行基本初始化，不等待窗口ready-to-show事件
  presenter.init()

  if (process.env.NODE_ENV === 'development') {
    import('./mainDev').then(async ({ setupDev }) => {
      const { optimizer } = await import('@electron-toolkit/utils')
      setupDev(appInstance, optimizer)
    })
  }

  console.log('🫁 mainEvent')
  Promise.all([
    import('./mainEvent').then(
      ({ enabledChanged, checkForUpdates, ShowHiddenWindow }) => {
        console.log('🫁 mainEvent import')
        // timeLogger(enabledChanged)()
        enabledChanged()
        checkForUpdates()
        ShowHiddenWindow()
      },
    ),
    // 协议注册
    import('./protocols').then(({ registerProtocols }) => {
      console.log('🫁 protocols import')
      registerProtocols()
    }),
  ])

  if (process.platform === 'darwin') {
    import('./mainMac').then(({ setupMacStartup }) =>
      setupMacStartup(appInstance),
    )
  } else if (process.platform === 'win32') {
    import('./mainWin').then(({ setupWinStartup }) => setupWinStartup)
  }

  // 剥离代码块
  // if (__DEV__) {
  //   timeLogger(enabledChanged)()
  // }

  setTimeout(async () => {
    browserWindowFocus(appInstance)
    browserWindowBlur(appInstance, presenter)
  }, 100)

  //   if (process.env.NODE_ENV === 'development') {
  //     // 只在开发环境执行的代码
  //     console.log('开发环境，加载开发辅助模块')
  //   }

  // 从配置中读取日志设置并应用
  // const loggingEnabled = presenter.configPresenter.getLoggingEnabled()
  // setLoggingEnabled(loggingEnabled)
}

export function browserWindowFocus(appInstance: Electron.App) {
  // 延迟注册快捷键（等第一个窗口创建）
  appInstance.once(FOCUS, async () => {
    // const { presenter } = await import('@/presenter')
    // msgAllLog.info('app-start shortcutPresenter', presenter.shortcutPresenter)
    // if (presenter?.shortcutPresenter) {
    //   presenter.shortcutPresenter.registerShortcuts()
    // }
  })

  // 监听浏览器窗口获得焦点事件
  appInstance.on(FOCUS, async () => {
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
  appInstance.on(BLUR, () => {
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
