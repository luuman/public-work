import { app } from 'electron'
import '@/utils/consoleHock'
import { appLog } from '@/presenter/logPresenter'
import { setupCommon } from './app/common'
import { willQuit, beforeQuit, windowAllClosed } from './app/quit'
// import 'hookConsoleTime'

appLog.info('app-start')

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required') // 允许视频自动播放
app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100') // 设置 WebRTC 最大 CPU 占用率
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096') // 设置 V8 堆内存大小
app.commandLine.appendSwitch('ignore-certificate-errors') // 忽略证书错误 (开发或特定场景下使用)

if (process.platform === 'win32') {
  import('./app/main-win').then(({ setupWinArgs }) => setupWinArgs(app))
}
if (process.platform === 'darwin') {
  import('./app/main-mac').then(({ setupMacArgs }) => setupMacArgs(app))
}

app.whenReady().then(async () => {
  appLog.info('app-ready')
  await setupCommon(app)
})

windowAllClosed(app)
willQuit(app)
beforeQuit(app)
