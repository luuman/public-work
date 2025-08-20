export async function appendSwitch(appInstance: Electron.App) {
  // 允许视频自动播放
  appInstance.commandLine.appendSwitch(
    'autoplay-policy',
    'no-user-gesture-required',
  )
  // 设置 WebRTC 最大 CPU 占用率
  appInstance.commandLine.appendSwitch(
    'webrtc-max-cpu-consumption-percentage',
    '100',
  )
  if (process.env.NODE_ENV === 'development') {
    // 忽略证书错误 (开发或特定场景下使用)
    appInstance.commandLine.appendSwitch('ignore-certificate-errors')
  }
  // 启用远程调试端口
  // appInstance.commandLine.appendSwitch('remote-debugging-port', '8315');
  // 禁用窗口动画（解决闪烁问题） FIX: win.hide()之后在使用win.show() 窗口会闪烁
  appInstance.commandLine.appendSwitch('wm-window-animations-disabled')

  // 根据系统剩余内存和架构（x64 / ia32）调整 V8 参数
  try {
    let size = 1024

    if (process.getSystemMemoryInfo().free / 1024 / 1024 > 3) {
      size = 2048
    }

    if (process.arch === 'ia32' && size > 1024) {
      appInstance.commandLine.appendSwitch(
        'js-flags',
        '--expose-gc --max-semi-space-size=64 --max-old-space-size=' + size,
      )
    } else {
      // --max-old-space-size=8192 set invalid
      appInstance.commandLine.appendSwitch('js-flags', '--expose-gc')
      // 设置 V8 堆内存大小
      //   appInstance.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096')
    }
  } catch (e) {
    console.error('getSystemMemoryInfo:', e)
  }
}
