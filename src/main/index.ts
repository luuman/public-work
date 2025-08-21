if (__DEV__) console.log('🫁app:start')
if (__DEV__) performance.mark('app:start')

import { app } from 'electron'
import '@/utils/consoleHock'
import { appLog } from '@/presenter/logPresenter'
import { setupCommon } from './app/common'
import { appendSwitch } from './app/appendSwitch'
import {
  willQuit,
  beforeQuit,
  windowAllClosed,
  handleSecondInstance,
} from './app/quit'
// import 'hookConsoleTime'

appendSwitch(app)

// 单实例运行
if (!app.requestSingleInstanceLock()) {
  appLog.info('app-second-instance')
  app.quit()
} else {
  appLog.info('app-start')
  handleSecondInstance(app)

  app.whenReady().then(async () => {
    if (__DEV__) performance.mark('app:ready')
    appLog.info('app-ready')

    await setupCommon(app)

    windowAllClosed(app)
    willQuit(app)
    beforeQuit(app)

    if (process.platform === 'win32') {
      import('./app/mainWin').then(({ setupWinArgs }) => setupWinArgs(app))
    }
    if (process.platform === 'darwin') {
      import('./app/mainMac').then(({ setupMacArgs }) => setupMacArgs(app))
    }
  })
}

if (__DEV__) {
  setTimeout(() => {
    performance.measure('初始化耗时', 'app:start', 'app:ready')
    performance.measure('初始化log耗时', 'log:start', 'log:ready')
    performance.measure('窗口创建耗时', 'app:ready', 'win:create')
    performance.measure('页面耗时', 'win:load-start', 'win:did-finish-load')
    performance.measure('冷启动总耗时', 'app:start', 'win:did-finish-load')

    const measures = performance.getEntriesByType('measure')
    console.log(`🫁⏱ ${measures}`)
    measures.forEach((m) => {
      console.log(`🫁⏱ ${m.name}: ${m.duration.toFixed(2)}ms`)
    })
  }, 5000)
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
