/**
 * @fileoverview log4js 是一个类 log4j（Java 版日志框架）的 TypeScript 版本主模块
 * 支持多种输出方式（appenders）、日志分级（levels）、分类（categories）
 * 并且可以用于单进程或多进程（clustering）环境
 */

import debugLib from 'debug'
import fs from 'fs'
import deepClone from 'rfdc'
import * as configuration from './configuration'
import * as layouts from './layouts'
import * as levels from './levels'
import * as appenders from './appenders'
import * as categories from './categories'
import Logger from './logger'
import * as clustering from './clustering'
import connectLogger from './connect-logger'
import recordingModule from './appenders/recording'

const debug = debugLib('log4js:main')
const clone = deepClone({ proto: true }) // 深拷贝工具（支持原型链）

let enabled = false

export interface LogEvent {
  categoryName: string
  level: { levelStr: string }
  data: unknown[]
  startTime: Date
}

/**
 * 将日志事件分发给对应的 appender
 */
export function sendLogEventToAppender(logEvent: LogEvent) {
  if (!enabled) return
  debug('Received log event ', logEvent)
  const categoryAppenders = categories.appendersForCategory(
    logEvent.categoryName,
  )
  categoryAppenders.forEach((appender) => appender(logEvent))
}

/**
 * 从 JSON 文件加载配置
 */
export function loadConfigurationFile(filename: string) {
  debug(`Loading configuration from ${filename}`)
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'))
  } catch (e: any) {
    throw new Error(`读取配置文件 "${filename}" 出错: ${e.message}`)
  }
}

/**
 * 初始化 log4js
 * @param configurationFileOrObject - 配置文件路径 或 配置对象
 */
export function configure(configurationFileOrObject: string | object) {
  if (enabled) shutdown()

  let configObject: object = configurationFileOrObject

  if (typeof configObject === 'string') {
    configObject = loadConfigurationFile(configurationFileOrObject)
  }

  debug(`Configuration is ${configObject}`)
  configuration.configure(clone(configObject))
  clustering.onMessage(sendLogEventToAppender)

  enabled = true
  return log4js
}

/**
 * 获取 recording 模块（测试/调试用）
 */
export function recording() {
  return recordingModule
}

/**
 * 关闭所有日志输出
 * @param cb - 完成回调
 */
export function shutdown(cb?: (err?: Error) => void) {
  debug('Shutdown called. Disabling all log writing.')
  enabled = false

  const appendersToCheck = Array.from(appenders.values())
  appenders.init()
  categories.init()

  const shutdownFunctions = appendersToCheck.reduceRight(
    (accum, next) => (next.shutdown ? accum + 1 : accum),
    0,
  )
  if (shutdownFunctions === 0) {
    debug('No appenders with shutdown functions found.')
    return cb?.()
  }

  let completed = 0
  let error: Error | undefined

  function complete(err?: Error) {
    error = error || err
    completed += 1
    debug(`Appender shutdowns complete: ${completed} / ${shutdownFunctions}`)
    if (completed >= shutdownFunctions) cb?.(error)
  }

  appendersToCheck
    .filter((a) => a.shutdown)
    .forEach((a) => a.shutdown!(complete))
}

/**
 * 获取 Logger 实例
 */
export function getLogger(category?: string) {
  if (!enabled) {
    configure(
      process.env.LOG4JS_CONFIG || {
        appenders: { out: { type: 'stdout' } },
        categories: { default: { appenders: ['out'], level: 'OFF' } },
      },
    )
  }
  return new Logger(category || 'default')
}

/**
 * log4js 模块导出
 */
const log4js = {
  getLogger,
  configure,
  shutdown,
  connectLogger,
  levels,
  addLayout: layouts.addLayout,
  layout: layouts.layout,
  recording,
}

export default log4js
