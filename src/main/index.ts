import { app } from 'electron'
import { setupCommon } from './app/common'
import { willQuit, beforeQuit, windowAllClosed } from './app/quit'

console.log('🤔 app starting...')
console.time('🚀App Startup Time')

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required') // 允许视频自动播放
app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100') // 设置 WebRTC 最大 CPU 占用率
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096') // 设置 V8 堆内存大小
app.commandLine.appendSwitch('ignore-certificate-errors') // 忽略证书错误 (开发或特定场景下使用)

if (process.platform === 'win32') {
  import('./app/main-win').then((macModule) => {
    macModule.setupWinArgs(app)
  })
}
if (process.platform === 'darwin') {
  import('./app/main-mac').then((macModule) => {
    macModule.setupMacArgs(app)
  })
}

app.whenReady().then(async () => {
  await setupCommon(app)
  console.timeEnd('🚀App Startup Time')
})

windowAllClosed(app)

willQuit(app)

beforeQuit(app)
