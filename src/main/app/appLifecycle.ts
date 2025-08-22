import { appLog } from '@/presenter/logPresenter'
import { ON_APP, ON_QUIT } from './appEvent'

const { WINDOW_ALL_CLOSED } = ON_APP
const { BEFORE_QUIT, WILL_QUIT, QUIT } = ON_QUIT

// 注册 app 生命周期和 process 错误监听
export function registerAppListeners(appInstance: Electron.App) {
  console.log('🫁 registerAppListeners')
  const handleError = (prefix: string) => (error: any) => {
    appLog.error(prefix, error, error?.message, error?.stack)
  }

  // App 生命周期事件
  // logAppOn(
  //   appInstance,
  //   SECOND_INSTANCE,
  //   (_event, argv: string[], cwd: string) => {
  //     appLog.info('second-instance argv:', argv.join(','), 'cwd:', cwd)
  //   },
  // )

  logAppOn(appInstance, WINDOW_ALL_CLOSED, () => {
    import('@/presenter').then(({ presenter }) => {
      const mainWindows = presenter.windowPresenter.getAllWindows()
      if (mainWindows.length === 0 && process.platform !== 'darwin') {
        appInstance.quit()
      }
    })
  })

  logAppOn(appInstance, BEFORE_QUIT, () => {
    // 清理悬浮按钮，可选实现
  })

  logAppOn(appInstance, WILL_QUIT, () => {
    import('@/presenter').then(({ presenter }) => {
      if (presenter.trayPresenter) presenter.trayPresenter.destroy()
      if (presenter.destroy) presenter.destroy()
    })
  })

  logAppOn(appInstance, QUIT, () => {
    appLog.info('app quit event triggered')
  })

  // Node.js 全局错误
  logProcessOn('uncaughtException', handleError('process uncaughtException'))
  logProcessOn('unhandledRejection', handleError('process unhandledRejection'))
  logProcessOn('warning', handleError('process warning'))

  // 平台相关退出
  if (process.platform === 'win32') {
    logProcessOn('message', (data) => {
      if (data === 'graceful-exit') appInstance.quit()
    })
  } else {
    logProcessOn('SIGTERM', () => appInstance.quit())
  }
}

// 通用带日志的 app.on 封装
function logAppOn(
  appInstance: Electron.App,
  eventName: string,
  listener: (...args: any[]) => void,
) {
  appLog.info('app lifecycle', eventName)
  appInstance.on(eventName as any, (...args: any[]) => {
    appLog.info(`event triggered: ${String(eventName)}`, ...args)
    listener(...args)
  })
}

// 通用带日志的 process.on 封装
function logProcessOn(
  eventName:
    | 'uncaughtException'
    | 'unhandledRejection'
    | 'warning'
    | 'SIGTERM'
    | 'message',
  listener: (...args: any[]) => void,
) {
  appLog.info('process lifecycle', eventName)
  process.on(eventName as any, (...args: any[]) => {
    appLog.info(`process event triggered: ${String(eventName)}`, ...args)
    listener(...args)
  })
}
