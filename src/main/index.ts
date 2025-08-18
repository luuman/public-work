import { app } from 'electron'
import '@/utils/consoleHock'
import { appLog } from '@/presenter/logPresenter'
import { setupCommon } from './app/common'
import {
  willQuit,
  beforeQuit,
  windowAllClosed,
  handleSecondInstance,
} from './app/quit'
// import 'hookConsoleTime'

appLog.info('app-start')

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required') // 允许视频自动播放
app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100') // 设置 WebRTC 最大 CPU 占用率
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096') // 设置 V8 堆内存大小
app.commandLine.appendSwitch('ignore-certificate-errors') // 忽略证书错误 (开发或特定场景下使用)
// app.commandLine.appendSwitch('remote-debugging-port', '8315'); // 启用远程调试端口

// 单实例运行
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // 如果获取锁失败，说明已有实例在运行，直接退出
  app.quit()
} else {
  handleSecondInstance(app)

  app.whenReady().then(async () => {
    appLog.info('app-ready')
    await setupCommon(app)
  })

  if (process.platform === 'win32') {
    import('./app/main-win').then(({ setupWinArgs }) => setupWinArgs(app))
  }
  if (process.platform === 'darwin') {
    import('./app/main-mac').then(({ setupMacArgs }) => setupMacArgs(app))
  }

  windowAllClosed(app)
  willQuit(app)
  beforeQuit(app)
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

// const createWindow = () => {
//   const win = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     minWidth: 800,
//     minHeight: 600,
//     backgroundColor: '#FFF',
//     titleBarStyle: 'hiddenInset', // macOS特色
//     frame: process.platform !== 'darwin', // 非macOS使用系统边框
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//       sandbox: true, // 推荐启用沙箱
//       webSecurity: true,
//       allowRunningInsecureContent: false
//     },
//     show: false // 先不显示，等ready-to-show事件
//   });

//   // 开发模式加载URL，生产模式加载文件
//   if (process.env.NODE_ENV === 'development') {
//     win.loadURL('http://localhost:3000');
//     win.webContents.openDevTools();
//   } else {
//     win.loadFile(path.join(__dirname, '../renderer/index.html'));
//   }

//   // 优化显示体验
//   win.on('ready-to-show', () => {
//     win.show();
//   });

//   return win;
// };
