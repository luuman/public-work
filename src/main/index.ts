import './app/appStart'
import '@/utils/consoleHock'
import { app } from 'electron'
import { setupCommon } from './app/common'
import { appLog } from '@/presenter/logPresenter'

// 单实例运行
if (__DEV__) performance.mark('app:start')
console.log('🫁 app:start')
if (!app.requestSingleInstanceLock()) {
  appLog.info('app-second-instance')
  app.quit()
} else {
  appLog.info('app-start')
  import('./app/appendSwitch').then(({ appendSwitch }) => appendSwitch(app))

  app.whenReady().then(async () => {
    if (__DEV__) performance.mark('app:ready')
    console.log('🫁 app:ready')
    appLog.info('app-ready')

    await setupCommon(app)

    if (process.platform === 'win32') {
      import('./app/mainWin').then(({ setupWinArgs }) => setupWinArgs(app))
    }
    if (process.platform === 'darwin') {
      import('./app/mainMac').then(({ setupMacArgs }) => setupMacArgs(app))
    }
  })
}

console.log('🫁 app:ts')

Promise.all([
  import('./app/quit').then(
    ({ windowAllClosed, willQuit, beforeQuit, handleSecondInstance }) => {
      console.log('🫁 app:quit')
      windowAllClosed(app)
      willQuit(app)
      beforeQuit(app)
      handleSecondInstance(app)
    },
  ),
])

if (__DEV__) {
  setTimeout(() => {
    performance.measure('1初始化耗时', 'app:start', 'app:ready')
    performance.measure('1-2初始化log耗时', 'log:start', 'log:ready')
    performance.measure('2窗口创建耗时', 'app:ready', 'win:create')
    performance.measure('3页面耗时', 'win:load-start', 'win:did-finish-load')
    performance.measure('2-3页面win耗时', 'win:create', 'win:did-finish-load')
    performance.measure('1-4冷启动总耗时', 'app:start', 'win:did-finish-load')

    const measures = performance.getEntriesByType('measure')
    measures.forEach((m) => {
      appLog.info(`🫁⏱ ${m.name}: ${m.duration.toFixed(2)}ms`)
    })
  }, 2000)
}

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
