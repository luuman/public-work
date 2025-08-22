export function setupWinArgs(appInstance: Electron.App) {
  // Windows 特定参数（暂时注释）
  appInstance.commandLine.appendSwitch('in-process-gpu')
  // appInstance.commandLine.appendSwitch('wm-window-animations-disabled')
}

export async function setupWinStartup(presenter: any) {
  // Windows 启动时，如果没有窗口，创建主窗口
  if (presenter.windowPresenter.getAllWindows().length === 0) {
    await presenter.windowPresenter.createMainWindow({
      initialTab: { url: 'local://chat' },
    })
  }
}
