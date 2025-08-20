import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { nanoid } from 'nanoid'
import axios from 'axios'
import { appLog } from '@/presenter/logPresenter'

export async function cacheImage(imageData: string): Promise<string> {
  appLog.info('devicePresenter cacheImage')

  if (imageData.startsWith('imgcache://')) return imageData

  const cacheDir = path.join(app.getPath('userData'), 'images')
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true })

  const fileName = `img_${Date.now()}_${nanoid(8)}`

  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    return cacheImageFromUrl(imageData, cacheDir, fileName)
  } else if (imageData.startsWith('data:image/')) {
    return cacheImageFromBase64(imageData, cacheDir, fileName)
  } else {
    console.warn('不支持的图片格式')
    return imageData
  }
}

async function cacheImageFromUrl(
  url: string,
  cacheDir: string,
  fileName: string,
): Promise<string> {
  appLog.info('devicePresenter cacheImageFromUrl')

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
    })
    const contentType = response.headers['content-type'] || 'image/jpeg'
    const extension = contentType.includes('png')
      ? 'png'
      : contentType.includes('gif')
        ? 'gif'
        : contentType.includes('webp')
          ? 'webp'
          : contentType.includes('svg')
            ? 'svg'
            : 'jpg'
    const fullPath = path.join(cacheDir, `${fileName}.${extension}`)
    await fs.promises.writeFile(fullPath, Buffer.from(response.data))
    return `imgcache://${fileName}.${extension}`
  } catch {
    return url
  }
}

async function cacheImageFromBase64(
  base64Data: string,
  cacheDir: string,
  fileName: string,
): Promise<string> {
  appLog.info('devicePresenter cacheImageFromBase64')

  try {
    const matches = base64Data.match(/^data:([^;]+);base64,(.*)$/)
    if (!matches || matches.length !== 3) return base64Data
    const mimeType = matches[1]
    const extension = mimeType.includes('png')
      ? 'png'
      : mimeType.includes('gif')
        ? 'gif'
        : mimeType.includes('webp')
          ? 'webp'
          : mimeType.includes('svg')
            ? 'svg'
            : 'jpg'
    const fullPath = path.join(cacheDir, `${fileName}.${extension}`)
    await fs.promises.writeFile(fullPath, Buffer.from(matches[2], 'base64'))
    return `imgcache://${fileName}.${extension}`
  } catch {
    return base64Data
  }
}
