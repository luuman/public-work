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
