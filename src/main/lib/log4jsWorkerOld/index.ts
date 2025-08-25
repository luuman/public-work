import { parentPort, workerData } from 'worker_threads'
import log4js from 'log4js'
// import log4js from './lib/log4js'
import { handleConfig, initLogConfig } from './config'

// 从 workerData 获取配置
const { logPath, isDev, appenderNames, categoryNames, APP_NAME } = workerData

// Worker 内部常量
const FLUSH_INTERVAL = 3000
const password = !isDev ? '' : 'empty'

// 初始化 log4js 配置
const config = initLogConfig(logPath, APP_NAME, '6M', password)
handleConfig(config, { appenderNames, categoryNames }, logPath)

// 自定义日志格式
log4js.addLayout('mypattern', () => (logEvent) => {
  return `[${logEvent.startTime.toISOString()}] [${logEvent.level.levelStr}] ${logEvent.data.join(' ')}`
})

// 应用配置
log4js.configure(config)

interface LogBufferItem {
  fileName: string
  message: string
}
const buffer: LogBufferItem[] = []
let flushTimer: NodeJS.Timeout | null = null

function flushLogs() {
  buffer.forEach(({ fileName, message }) => {
    const logger = log4js.getLogger(fileName || 'default')
    logger.info(message)
  })
  buffer.length = 0
  flushTimer = null
}

function bufferedWrite(fileName: string, message: string) {
  buffer.push({ fileName, message })
  if (!flushTimer) {
    flushTimer = setTimeout(flushLogs, FLUSH_INTERVAL)
  }
}

if (!parentPort) throw new Error('This file must be run as a Worker')

// 接收主线程消息
interface WorkerMessage {
  level: keyof typeof log4js
  message: string
  fileName?: string
}

parentPort.on('message', (data: WorkerMessage) => {
  const { message, fileName } = data
  bufferedWrite(fileName || 'default', `${message}`)
})
