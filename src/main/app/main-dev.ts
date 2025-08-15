export function setupDev(appInstance: Electron.App, optimizer: any) {
  // 在开发环境中为新创建的窗口添加 F12 DevTools 支持，生产环境忽略 CmdOrControl + R
  appInstance.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window) // 启用 F12、CmdOrCtrl+R
  })
}
