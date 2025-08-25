import { workerData } from 'worker_threads'
import { LogWorker, LogWorkerData } from '@/lib/logWorker'

const logWorker = new LogWorker(workerData as LogWorkerData)

process.on('exit', () => {
  logWorker.dispose()
})

process.on('SIGINT', () => {
  logWorker.dispose()
  process.exit(0)
})

// import { parentPort, workerData } from 'worker_threads'
// import log from 'electron-log'
// import path from 'path'
// const { logPath, isDev } = workerData

// if (!parentPort) throw new Error('This file must be run as a Worker')

// if (logPath) {
//   log.transports.file.resolvePathFn = () => path.join(logPath, '')
// }
// // console.log('🚀[Worker] Log worker logPath', logPath)

// log.transports.file.level = 'info'
// log.transports.console.level = isDev ? 'debug' : 'info'
// log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}'

// // 缓存 & 批量写入
// const buffer: string[] = []
// const flushInterval = 3000 // 1秒刷一次
// let flushTimer: NodeJS.Timeout | null = null

// function flushLogs() {
//   buffer.forEach((msg) => log.info(msg))
//   buffer.length = 0
//   flushTimer = null
// }

// function bufferedWrite(message: string) {
//   buffer.push(message)
//   if (!flushTimer) flushTimer = setTimeout(flushLogs, flushInterval)
// }

// // console.log('🚀[Worker] Log worker workerData', workerData)

// // 接收主线程消息
// parentPort.on(
//   'message',
//   (data: { level: keyof typeof log; message: string }) => {
//     // console.log('🚀[Worker] Log worker data', buffer.length)
//     const { level, message } = data
//     bufferedWrite(`[${level.toUpperCase()}] ${message}`)
//   },
// )
