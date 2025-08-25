import { BrowserWindow } from 'electron'

export function forwardConsoleToRenderer(win: BrowserWindow) {
  // 保存原始 console 方法
  //   const origLog = console.log
  //   const origError = console.error
  //   const origWarn = console.warn

  function sendToRenderer(level, args) {
    try {
      win.webContents.send('log', {
        level,
        message: args.map(String).join(' '),
      })
    } catch (e) {
      // 窗口还没准备好时会报错，可以忽略
    }
  }

  console.log = (...args) => {
    // origLog.apply(console, args)
    sendToRenderer('log', args)
  }

  console.error = (...args) => {
    // origError.apply(console, args)
    sendToRenderer('error', args)
  }

  console.warn = (...args) => {
    // origWarn.apply(console, args)
    sendToRenderer('warn', args)
  }
}
