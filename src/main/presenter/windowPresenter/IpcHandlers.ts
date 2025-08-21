// src/main/presenter/windowPresenter/IpcHandlers.ts
import { ipcMain, BrowserWindow } from 'electron'
import { appLog } from '@/presenter/logPresenter'

/**
 * IPC 通信处理器 - 负责处理所有与窗口相关的IPC通信
 */

export class IpcHandlers {
  /**
   * 注册所有IPC处理器
   */
  public static registerAll(): void {
    this.registerWindowIdHandler()
    this.registerWebContentsIdHandler()
    // 可以添加更多IPC处理器...
  }

  /**
   * 注册获取窗口ID的处理器
   */
  private static registerWindowIdHandler(): void {
    ipcMain.on('get-window-id', (event) => {
      const window = BrowserWindow.fromWebContents(event.sender)
      event.returnValue = window?.id ?? null
      appLog.debug(`IPC: get-window-id returned ${event.returnValue}`)
    })
  }

  /**
   * 注册获取WebContents ID的处理器
   */
  private static registerWebContentsIdHandler(): void {
    ipcMain.on('get-web-contents-id', (event) => {
      event.returnValue = event.sender.id
      appLog.debug(`IPC: get-web-contents-id returned ${event.returnValue}`)
    })
  }

  /**
   * 注销所有IPC处理器
   */
  public static unregisterAll(): void {
    ipcMain.removeAllListeners('get-window-id')
    ipcMain.removeAllListeners('get-web-contents-id')
    appLog.info('All window IPC handlers unregistered')
  }
}
