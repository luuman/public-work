import { appLog } from '@/presenter/logPresenter'
import { app } from 'electron'
import path from 'path'
import { presenter } from '@/presenter'
import { eventBus, SendTarget } from '@/events/eventbus'
import { DEEPLINK_EVENTS, MCP_EVENTS, WINDOW_EVENTS } from '@/events/events'
import { IDeeplinkPresenter } from './types'

/**
 * DeepLink 基础处理器
 * 负责协议注册和基础事件处理
 */
export abstract class DeeplinkBase implements IDeeplinkPresenter {
  protected startupUrl: string | null = null
  protected pendingMcpInstallUrl: string | null = null

  /**
   * 初始化DeepLink处理器
   */
  init(): void {
    appLog.info('presenter/deeplinkPresenter/base: init')
    this.registerProtocol()
    this.setupMacOSHandler()
    this.setupWindowsHandler()
    this.setupContentLoadedHandler()
    this.setupMcpInitializedHandler()
  }

  /**
   * 注册deepchat协议
   */
  private registerProtocol(): void {
    appLog.info('presenter/deeplinkPresenter/base: registerProtocol')
    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('deepchat', process.execPath, [
          path.resolve(process.argv[1]),
        ])
      }
    } else {
      app.setAsDefaultProtocolClient('deepchat')
    }
  }

  /**
   * 设置macOS协议处理器
   */
  private setupMacOSHandler(): void {
    appLog.info('presenter/deeplinkPresenter/base: setupMacOSHandler')
    app.on('open-url', (event, url) => {
      event.preventDefault()
      if (!app.isReady()) {
        this.startupUrl = url
      } else {
        this.processDeepLink(url)
      }
    })
  }

  /**
   * 设置Windows协议处理器
   */
  private setupWindowsHandler(): void {
    appLog.info('presenter/deeplinkPresenter/base: setupWindowsHandler')
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
      app.quit()
    } else {
      app.on('second-instance', (_event, commandLine) => {
        this.handleSecondInstance(commandLine)
      })
    }
  }

  /**
   * 处理第二个实例
   */
  private handleSecondInstance(commandLine: string[]): void {
    appLog.info('presenter/deeplinkPresenter/base: handleSecondInstance')
    if (presenter.windowPresenter.mainWindow) {
      presenter.windowPresenter.focusMainWindow()
    }

    if (process.platform === 'win32') {
      const deepLinkUrl = commandLine.find((arg) =>
        arg.startsWith('deepchat://'),
      )
      if (deepLinkUrl) {
        this.processDeepLink(deepLinkUrl)
      }
    }
  }

  /**
   * 设置内容加载完成处理器
   */
  private setupContentLoadedHandler(): void {
    appLog.info('presenter/deeplinkPresenter/base: setupContentLoadedHandler')
    eventBus.once(WINDOW_EVENTS.FIRST_CONTENT_LOADED, () => {
      if (this.startupUrl) {
        this.processDeepLink(this.startupUrl)
        this.startupUrl = null
      }
    })
  }

  /**
   * 设置MCP初始化完成处理器
   */
  private setupMcpInitializedHandler(): void {
    appLog.info('presenter/deeplinkPresenter/base: setupMcpInitializedHandler')
    eventBus.on(MCP_EVENTS.INITIALIZED, () => {
      if (this.pendingMcpInstallUrl) {
        this.processDeepLink(this.pendingMcpInstallUrl)
        this.pendingMcpInstallUrl = null
      }
    })
  }

  /**
   * 处理DeepLink URL
   * @param url DeepLink URL
   */
  protected processDeepLink(url: string): void {
    appLog.info('presenter/deeplinkPresenter/base: processDeepLink')
    try {
      const urlObj = new URL(url)
      const command = urlObj.hostname
      const subCommand = urlObj.pathname.slice(1)

      // 如果是MCP安装命令且MCP未就绪，则暂存URL
      if (command === 'mcp' && subCommand === 'install') {
        if (!presenter.mcpPresenter.isReady()) {
          this.pendingMcpInstallUrl = url
          return
        }
      }

      this.handleDeepLink(url)
    } catch (error) {
      console.error('处理DeepLink错误:', error)
    }
  }

  abstract handleDeepLink(url: string): Promise<void>
}
