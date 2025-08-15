import { electronApp } from '@electron-toolkit/utils'
// import { setLoggingEnabled, timeLogger } from '@shared/logger'
import { presenter } from '@/presenter'
import { registerProtocols } from './protocols'
import { eventBus } from '@/events/eventbus'
import { WINDOW_EVENTS } from '@/events/events'
import { is } from '@electron-toolkit/utils'
import { enabledChanged, checkForUpdates, ShowHiddenWindow } from './main-event'
import { optimizer } from '@electron-toolkit/utils'

export async function setupCommon(appInstance: Electron.App) {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.yourcompany.yourapp')

  //   if (process.env.NODE_ENV === 'development') {
  //     // 只在开发环境执行的代码
  //     console.log('开发环境，加载开发辅助模块')
  //   }

  // 从配置中读取日志设置并应用
  // const loggingEnabled = presenter.configPresenter.getLoggingEnabled()
  // setLoggingEnabled(loggingEnabled)

  // 初始化托盘图标和菜单，并存储 presenter 实例
  presenter.setupTray()

  // 立即进行基本初始化，不等待窗口ready-to-show事件
  presenter.init()

  if (is.dev) {
    import('./main-dev').then((macModule) => {
      macModule.setupDev(appInstance, optimizer)
    })
  }

  if (process.platform === 'darwin') {
    import('./main-mac').then((macModule) => {
      macModule.setupMacStartup(appInstance, presenter)
    })
  }

  getAllWindows()

  if (process.platform === 'win32') {
    import('./main-win').then((macModule) => {
      macModule.setupWinStartup(presenter)
    })
  }

  // 注册全局快捷键
  presenter.shortcutPresenter.registerShortcuts()

  // timeLogger(enabledChanged)()
  enabledChanged()

  checkForUpdates()

  ShowHiddenWindow()

  browserWindowFocus(appInstance)

  browserWindowBlur(appInstance)

  // 协议注册
  registerProtocols()

  // 剥离代码块
  // if (__DEV__) {
  //   timeLogger(enabledChanged)()
  // }
}

export function browserWindowFocus(appInstance: Electron.App) {
  // 监听浏览器窗口获得焦点事件
  appInstance.on('browser-window-focus', () => {
    // 当任何窗口获得焦点时
    eventBus.sendToMain(WINDOW_EVENTS.APP_FOCUS)
  })
}

export function browserWindowBlur(appInstance: Electron.App) {
  // 监听浏览器窗口失去焦点事件
  appInstance.on('browser-window-blur', () => {
    // 检查是否所有窗口都已失去焦点，如果是则注销快捷键
    // 使用短延迟以处理窗口间焦点切换
    setTimeout(() => {
      const allWindows = presenter.windowPresenter.getAllWindows()
      const isAnyWindowFocused = allWindows.some(
        (win) => !win.isDestroyed() && win.isFocused(),
      )

      if (!isAnyWindowFocused) {
        eventBus.sendToMain(WINDOW_EVENTS.APP_BLUR)
      }
    }, 50) // 50毫秒延迟
  })
}

export async function getAllWindows() {
  // 如果没有窗口，创建主窗口 (应用首次启动时)
  if (presenter.windowPresenter.getAllWindows().length === 0) {
    console.log('Main: Creating initial shell window on app startup')
    try {
      const windowId = await presenter.windowPresenter.createShellWindow({
        initialTab: {
          url: 'local://chat',
        },
      })
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
  } else {
    console.log(
      'Main: Shell windows already exist, skipping initial window creation',
    )
  }
}
