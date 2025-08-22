import './app/appStart'
import '@/utils/consoleHock'
import { app } from 'electron'
import { setupCommon } from './app/common'
import { appLog } from '@/presenter/logPresenter'
import { ON_APP } from './app/appEvent'
import { appendSwitch } from './app/appendSwitch'

const { SECOND_INSTANCE } = ON_APP

// 单实例运行
if (__DEV__) performance.mark('app:start')
console.log('🫁 app:start')
if (!app.requestSingleInstanceLock()) {
  appLog.info('app-second-instance')
  app.quit()
} else {
  appLog.info('app-start')
  app.on(SECOND_INSTANCE, (_event, argv: string[], cwd: string) => {
    import('./app/secondInstance').then(({ handleSecondInstance }) =>
      handleSecondInstance(argv, cwd),
    )
  })

  app.whenReady().then(async () => {
    if (__DEV__) performance.mark('app:ready')
    console.log('🫁 app:ready')
    appLog.info('app-ready')

    appendSwitch(app)

    await setupCommon(app)

    if (process.platform === 'win32') {
      import('./app/mainWin').then(({ setupWinArgs }) => setupWinArgs(app))
    }
    if (process.platform === 'darwin') {
      import('./app/mainMac').then(({ setupMacArgs }) => setupMacArgs(app))
    }

    console.log('🫁 app:ready2')
    Promise.all([
      import('./app/appLifecycle').then(({ registerAppListeners }) => {
        console.log('🫁 app:quit')
        registerAppListeners(app)
      }),
    ])
    console.log('🫁 app:ready3')

    // 性能分析
    if (__DEV__) {
      setTimeout(() => {
        const measureList: [string, string, string][] = [
          ['app准备就绪', 'app:start', 'app:ready'],
          ['log准备就绪', 'log:start', 'log:ready'],
          ['创建窗口', 'app:ready', 'win:create'],
          ['页面渲染', 'win:load-start', 'win:did-finish-load'],
          ['窗口渲染', 'win:create', 'win:did-finish-load'],
          ['冷启动总耗时', 'app:start', 'win:did-finish-load'],
        ]

        for (const [name, start, end] of measureList) {
          performance.measure(name, start, end)
        }

        const measures = performance.getEntriesByType('measure')
        measures.forEach((m) => {
          appLog.info(`🫁⏱ ${m.name}: ${m.duration.toFixed(2)}ms`)
        })
      }, 2000)
    }
    console.log('🫁 app:readyEnd')
  })
}
console.log('🫁 app:startEnd')

// win.webContents.on('dom-ready', () => {
//   // 延迟加载非关键资源
//   win.webContents.executeJavaScript(`
//     // 使用IntersectionObserver延迟加载图片等
//     const lazyLoader = new IntersectionObserver((entries) => {
//       entries.forEach(entry => {
//         if (entry.isIntersecting) {
//           const img = entry.target;
//           img.src = img.dataset.src;
//           lazyLoader.unobserve(img);
//         }
//       });
//     });

//     document.querySelectorAll('img[data-src]').forEach(img => {
//       lazyLoader.observe(img);
//     });
//   `);
// });
