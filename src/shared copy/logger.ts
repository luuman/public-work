import log from 'electron-log'
import { app } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'
import { performance } from 'perf_hooks'

// 配置日志文件路径
// 使用logger记录而不是console
const userData = app?.getPath('userData') || ''
if (userData) {
  log.transports.file.resolvePathFn = () => path.join(userData, 'logs/main.log')
}

// 配置控制台日志
log.transports.console.level = is.dev ? 'debug' : 'info'
log.transports.file.level = 'info'
log.transports.file.maxSize = 1024 * 1024 * 10 // 10MB
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

// 获取日志开关状态
let loggingEnabled = false
// 导出设置日志开关的方法
export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled
  log.transports.file.level = enabled ? 'info' : false
}

const flushInterval = 100000 // ms
let buffer: string[] = []
let flushTimer: NodeJS.Timeout | null = null

function flushLogs() {
  buffer.forEach((msg) => log.transports.file.write(msg))
  buffer = []
  flushTimer = null
}

function bufferedWrite(message: string) {
  buffer.push(message)
  if (!flushTimer) {
    flushTimer = setTimeout(flushLogs, flushInterval)
  }
}

log.transports.file.write = bufferedWrite

export function createLogger(moduleName?: string) {
  const prefix = moduleName ? `[${moduleName}]` : ''
  const wrap =
    (fn: (...args: unknown[]) => void) =>
    (...args: unknown[]) => {
      if (loggingEnabled || is.dev) {
        fn(`${prefix}`, ...args)
      }
    }

  return {
    error: wrap(log.error),
    warn: wrap(log.warn),
    info: wrap(log.info),
    verbose: wrap(log.verbose),
    debug: wrap(log.debug),
    silly: wrap(log.silly),
    log: wrap(log.info),
  }
}

// 拦截console方法，重定向到logger
export function hookConsole() {
  const original = { ...console }
  console.log = (...args: unknown[]) =>
    loggingEnabled || is.dev ? log.info(...args) : undefined
  console.warn = (...args: unknown[]) =>
    loggingEnabled || is.dev ? log.warn(...args) : undefined
  console.error = (...args: unknown[]) =>
    loggingEnabled || is.dev ? log.error(...args) : undefined
  console.info = (...args: unknown[]) =>
    loggingEnabled || is.dev ? log.info(...args) : undefined
  console.debug = (...args: unknown[]) =>
    loggingEnabled || is.dev ? log.debug(...args) : undefined
  console.trace = (...args: unknown[]) =>
    loggingEnabled || is.dev ? log.info(new Error().stack, ...args) : undefined
  return original
}

/**
 * 开发环境才执行耗时日志
 */

export function timeLogger<T extends (...args: any[]) => any>(
  fn: T,
  label?: string,
): (...args: Parameters<T>) => ReturnType<T> {
  if (process.env.NODE_ENV !== 'development') return fn
  const name = fn.name || 'anonymous'
  return (...args: Parameters<T>) => {
    const start = performance.now()
    const result = fn(...args)
    const logTime = () => {
      const end = performance.now()
      log.info(
        `[耗时][DEV] ${label ?? ''} ${name}: ${(end - start).toFixed(2)}ms`,
      )
    }
    if (result instanceof Promise) {
      return result.finally(logTime)
    } else {
      logTime()
      return result
    }
  }
}

// 导出原始console方法，以便需要时可以恢复
export const originalConsole = hookConsole()
export default createLogger()
