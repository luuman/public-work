// src/main/presenter/windowPresenter/WindowUtils.ts
import { BrowserWindow, screen, nativeImage } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { appLog } from '@/presenter/logPresenter'

/**
 * 窗口工具类 - 提供各种窗口相关的实用功能
 *
 * 主要功能：
 * 1. 窗口创建辅助方法
 * 2. 窗口位置计算
 * 3. 跨平台窗口特性处理
 * 4. 窗口视觉效果工具
 */
export class WindowUtils {
  /**
   * 创建基础窗口配置（跨平台兼容）
   * @param options 自定义选项
   * @returns 窗口配置对象
   */
  public static createBaseWindowConfig(
    options: {
      width?: number
      height?: number
      x?: number
      y?: number
      show?: boolean
      backgroundColor?: string
    } = {},
  ): Electron.BrowserWindowConstructorOptions {
    const defaultConfig: Electron.BrowserWindowConstructorOptions = {
      width: options.width || 800,
      height: options.height || 600,
      x: options.x,
      y: options.y,
      show: options.show !== false,
      backgroundColor: options.backgroundColor || '#ffffff',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        devTools: is.dev,
      },
    }

    // macOS 特定配置
    if (process.platform === 'darwin') {
      defaultConfig.titleBarStyle = 'hiddenInset'
      defaultConfig.vibrancy = 'sidebar'
      defaultConfig.transparent = true
    }

    // Windows 特定配置
    if (process.platform === 'win32') {
      defaultConfig.frame = false
      defaultConfig.hasShadow = true
      defaultConfig.roundedCorners = true
    }

    return { ...defaultConfig, ...options }
  }

  /**
   * 计算居中窗口位置
   * @param width 窗口宽度
   * @param height 窗口高度
   * @returns {x: number, y: number} 坐标
   */
  public static calculateCenterPosition(
    width: number,
    height: number,
  ): { x: number; y: number } {
    const { workArea } = screen.getPrimaryDisplay()
    const x = Math.max(0, Math.floor((workArea.width - width) / 2 + workArea.x))
    const y = Math.max(
      0,
      Math.floor((workArea.height - height) / 2 + workArea.y),
    )
    return { x, y }
  }

  /**
   * 确保窗口在可视区域内
   * @param window 窗口实例
   */
  public static ensureWindowInBounds(window: BrowserWindow): void {
    const [width, height] = window.getSize()
    const [x, y] = window.getPosition()
    const displays = screen.getAllDisplays()

    const isVisible = displays.some((display) => {
      return (
        x + width > display.bounds.x &&
        x < display.bounds.x + display.bounds.width &&
        y + height > display.bounds.y &&
        y < display.bounds.y + display.bounds.height
      )
    })

    if (!isVisible) {
      const { x: newX, y: newY } = this.calculateCenterPosition(width, height)
      window.setPosition(newX, newY)
      appLog.warn('Window was out of bounds, reset to center position')
    }
  }

  /**
   * 加载窗口图标（跨平台）
   * @returns 图标NativeImage实例
   */
  public static loadWindowIcon(): Electron.NativeImage {
    try {
      const iconPath =
        process.platform === 'win32'
          ? join(__dirname, '../../../../resources/icon.ico')
          : join(__dirname, '../../../../resources/icon.png')

      return nativeImage.createFromPath(iconPath)
    } catch (error) {
      appLog.error('Failed to load window icon:', error)
      return nativeImage.createEmpty()
    }
  }

  /**
   * 为窗口设置默认快捷键
   * @param window 窗口实例
   */
  public static setupWindowShortcuts(window: BrowserWindow): void {
    // 开发模式快捷键
    if (is.dev) {
      // Ctrl+Shift+I 打开开发者工具
      window.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.shift && input.key.toLowerCase() === 'i') {
          if (window.webContents.isDevToolsOpened()) {
            window.webContents.closeDevTools()
          } else {
            window.webContents.openDevTools({ mode: 'detach' })
          }
          event.preventDefault()
        }
      })
    }

    // 通用快捷键
    window.webContents.on('before-input-event', (event, input) => {
      // F11 切换全屏
      if (input.key === 'F11') {
        window.setFullScreen(!window.isFullScreen())
        event.preventDefault()
      }

      // Esc 退出全屏
      if (input.key === 'Escape' && window.isFullScreen()) {
        window.setFullScreen(false)
        event.preventDefault()
      }
    })
  }

  /**
   * 创建加载中页面HTML内容
   * @param options 加载页面选项
   * @returns HTML字符串
   */
  public static createLoadingPage(
    options: {
      title?: string
      subtitle?: string
      backgroundColor?: string
      spinnerColor?: string
    } = {},
  ): string {
    return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${options.title || 'Loading...'}</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        background: ${options.backgroundColor || '#f5f5f5'};
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        flex-direction: column;
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    }
                    .spinner {
                        width: 50px;
                        height: 50px;
                        border: 5px solid rgba(0, 0, 0, 0.1);
                        border-radius: 50%;
                        border-top-color: ${options.spinnerColor || '#3498db'};
                        animation: spin 1s ease-in-out infinite;
                        margin-bottom: 20px;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                    h1 {
                        color: #333;
                        margin: 0 0 10px 0;
                    }
                    p {
                        color: #666;
                        margin: 0;
                    }
                </style>
            </head>
            <body>
                <div class="spinner"></div>
                <h1>${options.title || 'Loading Application'}</h1>
                <p>${options.subtitle || 'Please wait...'}</p>
            </body>
            </html>
        `
  }

  /**
   * 为窗口添加拖拽区域
   * @param window 窗口实例
   * @param cssSelector 可拖拽元素的CSS选择器
   */
  public static addDraggableRegion(
    window: BrowserWindow,
    cssSelector: string,
  ): void {
    window.webContents.executeJavaScript(`
            (function() {
                const element = document.querySelector('${cssSelector}');
                if (element) {
                    element.style.webkitAppRegion = 'drag';
                    element.querySelectorAll('button, a, input').forEach(el => {
                        el.style.webkitAppRegion = 'no-drag';
                    });
                }
            })();
        `)
  }

  /**
   * 设置窗口视觉效果（模糊/透明等）
   * @param window 窗口实例
   * @param effect 效果类型
   */
  public static setVisualEffect(
    window: BrowserWindow,
    effect: 'blur' | 'acrylic' | 'transparent' | 'none',
  ): void {
    if (process.platform === 'darwin') {
      // macOS 视觉效果
      switch (effect) {
        case 'blur':
          // window.setVibrancy('light')
          break
        case 'acrylic':
          window.setVibrancy('sidebar')
          break
        case 'transparent':
          window.setBackgroundColor('#00000000')
          break
        case 'none':
          window.setVibrancy(null)
          window.setBackgroundColor('#ffffffff')
          break
      }
    } else if (process.platform === 'win32') {
      // Windows 视觉效果
      // 注意：Windows上的实现可能需要额外的模块
      try {
        const { setBlurEffect } = require('electron-acrylic-window')
        switch (effect) {
          case 'blur':
          case 'acrylic':
            setBlurEffect(window, {
              theme: 'light',
              effect: 'acrylic',
              disableOnBlur: false,
            })
            break
          case 'transparent':
            window.setBackgroundColor('#00000000')
            break
          case 'none':
            window.setBackgroundColor('#ffffffff')
            break
        }
      } catch (error) {
        appLog.error('Failed to set visual effect:', error)
      }
    }
  }
}
