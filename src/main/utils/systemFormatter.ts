/**
 * 将字节数格式化为可读字符串
 * @param bytes 字节数
 * @param decimals 保留小数位，默认 2
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`
}

/**
 * 格式化百分比
 * @param value 百分比数值 0~100
 * @param decimals 保留小数位，默认 2
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * 将 process.platform 转换为友好系统名称
 */
export function getPlatformName(platform: NodeJS.Platform): string {
  switch (platform) {
    case 'win32':
      return 'Windows'
    case 'darwin':
      return 'macOS'
    case 'linux':
      return 'Linux'
    default:
      return platform
  }
}
