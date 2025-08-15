import { protocol, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'

/**
 * 注册自定义协议处理器
 * - 'appcdn' 用于加载应用内置资源，模拟 CDN 行为
 * - 'imgcache' 用于加载用户数据目录下缓存的图片资源
 */
export function registerProtocols() {
  // 注册 'appcdn' 协议处理函数
  protocol.handle('appcdn', (request) => {
    try {
      // 从请求 URL 中截取资源路径，去掉协议前缀 'appcdn://'
      const filePath = request.url.slice('appcdn://'.length)

      // 根据当前环境（开发 or 生产）确定资源根目录路径
      const resourcesPath = is.dev
        ? path.join(app.getAppPath(), 'resources') // 开发模式下，资源路径通常在项目目录下
        : process.resourcesPath // 生产模式下，资源路径在打包后的位置

      // 拼接可能的解包资源路径，app.asar.unpacked 用于存放未打包的文件
      const unpackedResourcesPath = path.join(
        resourcesPath,
        'app.asar.unpacked',
        'resources',
      )

      // 判断是否存在解包目录，优先使用解包路径，避免文件被打包导致读取失败
      const baseResourcesDir = fs.existsSync(unpackedResourcesPath)
        ? unpackedResourcesPath
        : path.join(resourcesPath, 'resources') // 如果没有解包目录，则使用默认路径

      // 资源完整路径，指向 cdn 文件夹内对应资源
      const fullPath = path.join(baseResourcesDir, 'cdn', filePath)

      // 根据文件扩展名设置响应的 MIME 类型，默认为二进制流
      let mimeType = 'application/octet-stream'
      if (filePath.endsWith('.js')) {
        mimeType = 'text/javascript'
      } else if (filePath.endsWith('.css')) {
        mimeType = 'text/css'
      } else if (filePath.endsWith('.json')) {
        mimeType = 'application/json'
      } else if (filePath.endsWith('.wasm')) {
        mimeType = 'application/wasm'
      } else if (filePath.endsWith('.data')) {
        mimeType = 'application/octet-stream'
      } else if (filePath.endsWith('.html')) {
        mimeType = 'text/html'
      }

      // 检查资源文件是否存在
      if (!fs.existsSync(fullPath)) {
        // 找不到文件，记录警告并返回 404 响应
        console.warn(`appcdn handler: File not found: ${fullPath}`)
        return new Response(`找不到文件: ${filePath}`, {
          status: 404,
          headers: { 'Content-Type': 'text/plain' },
        })
      }

      // 读取文件内容（同步读取）
      const fileContent = fs.readFileSync(fullPath)

      // 返回带有正确 MIME 类型的响应体
      return new Response(fileContent, {
        headers: { 'Content-Type': mimeType },
      })
    } catch (error: unknown) {
      // 捕获处理过程中的异常，记录错误日志并返回 500 错误响应
      console.error('❌处理appcdn请求时出错:', error)
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return new Response(`服务器错误: ${errorMessage}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      })
    }
  })

  // 注册 'imgcache' 协议处理函数，用于加载用户数据目录下的图片缓存
  protocol.handle('imgcache', (request) => {
    try {
      // 去除协议前缀，得到图片文件相对路径
      const filePath = request.url.slice('imgcache://'.length)

      // 计算图片文件的绝对路径，存储在 app 的 userData 目录的 images 文件夹中
      const fullPath = path.join(app.getPath('userData'), 'images', filePath)

      // 检查图片文件是否存在
      if (!fs.existsSync(fullPath)) {
        // 找不到图片，记录警告并返回 404 响应
        console.warn(`imgcache handler: Image file not found: ${fullPath}`)
        return new Response(`找不到图片: ${filePath}`, {
          status: 404,
          headers: { 'Content-Type': 'text/plain' },
        })
      }

      // 根据图片文件扩展名设置对应的 MIME 类型，默认二进制流
      let mimeType = 'application/octet-stream'
      if (filePath.endsWith('.png')) {
        mimeType = 'image/png'
      } else if (filePath.endsWith('.gif')) {
        mimeType = 'image/gif'
      } else if (filePath.endsWith('.webp')) {
        mimeType = 'image/webp'
      } else if (filePath.endsWith('.svg')) {
        mimeType = 'image/svg+xml'
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        mimeType = 'image/jpeg'
      } else if (filePath.endsWith('.bmp')) {
        mimeType = 'image/bmp'
      } else if (filePath.endsWith('.ico')) {
        mimeType = 'image/x-icon'
      } else if (filePath.endsWith('.avif')) {
        mimeType = 'image/avif'
      }

      // 读取图片文件内容
      const fileContent = fs.readFileSync(fullPath)

      // 返回带 MIME 类型的响应
      return new Response(fileContent, {
        headers: { 'Content-Type': mimeType },
      })
    } catch (error: unknown) {
      // 发生异常时记录错误，返回 500 错误响应
      console.error('❌处理imgcache请求时出错:', error)
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      return new Response(`服务器错误: ${errorMessage}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      })
    }
  })
}
