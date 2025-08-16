console.log('😊 TrayPresenter')
import { Tray, Menu, app, nativeImage, NativeImage } from 'electron'
import * as path from 'path'
import { getContextMenuLabels } from '@shared/i18n'
import { presenter } from '.'
import { eventBus } from '@/events/eventbus'
import { TRAY_EVENTS } from '@/events/events'

const TRAY_ICON_SIZES = {
  darwin: { width: 24, height: 24 },
  linux: { width: 22, height: 22 },
}

const ICON_FILES = {
  darwin: 'macTrayTemplate.png',
  win32: 'win_tray.ico',
  linux: 'linux_tray.png',
}

/**
 * 系统托盘（Tray）管理类
 * 功能：创建和管理 Electron 应用的托盘图标及右键菜单
 */
export class TrayPresenter {
  private tray: Tray | null = null // Electron 的托盘实例
  private iconPath: string // 托盘图标存放的目录路径

  constructor() {
    // 初始化时获取应用资源目录路径（存放托盘图标）
    this.iconPath = path.join(app.getAppPath(), 'resources')
  }

  /**
   * 创建托盘图标和菜单
   * 注意：不同平台的图标处理方式不同（macOS/Windows/Linux）
   */
  private createPlatformIcon(): NativeImage {
    const platform = process.platform
    const iconFile =
      ICON_FILES[platform as keyof typeof ICON_FILES] || ICON_FILES.linux
    let image = nativeImage.createFromPath(path.join(this.iconPath, iconFile))

    // 平台特定处理
    if (platform === 'darwin') {
      image = image.resize({
        width: TRAY_ICON_SIZES.darwin.width || 24,
        height: TRAY_ICON_SIZES.darwin.height || 24,
      })
      image.setTemplateImage(true)
    } else if (platform === 'linux') {
      image = image.resize({
        width: TRAY_ICON_SIZES.linux.width || 22,
        height: TRAY_ICON_SIZES.linux.height || 22,
      })
    }

    return image
  }

  /**
   * 创建上下文菜单
   */
  private createContextMenu(): Menu {
    const locale = presenter.configPresenter.getLanguage?.() || 'zh-CN'
    const labels = getContextMenuLabels(locale)

    return Menu.buildFromTemplate([
      {
        label: labels.open || '打开/隐藏',
        click: () => eventBus.sendToMain(TRAY_EVENTS.SHOW_HIDDEN_WINDOW),
      },
      {
        label: labels.checkForUpdates || '检查更新',
        click: () => eventBus.sendToMain(TRAY_EVENTS.CHECK_FOR_UPDATES),
      },
      {
        label: labels.quit || '退出',
        click: async () => {
          // const confirmed = await presenter.knowledgePresenter.beforeDestroy()
          // confirmed && app.quit()
          app.quit()
        },
      },
    ])
  }

  /**
   * 创建托盘图标和菜单
   */
  private createTray(): void {
    const image = this.createPlatformIcon()
    this.tray = new Tray(image)
    this.tray.setToolTip('DeepChat')
    this.tray.setContextMenu(this.createContextMenu())

    this.tray.on('click', () => {
      eventBus.sendToMain(TRAY_EVENTS.SHOW_HIDDEN_WINDOW, true)
    })
  }

  /**
   * 初始化托盘
   */
  public init(): void {
    this.createTray()
  }

  /**
   * 销毁托盘（应用退出时调用）
   */
  destroy() {
    if (this.tray) {
      this.tray.destroy() // 释放资源
      this.tray = null // 清除引用
    }
  }
}
