import { workerData } from 'worker_threads'
import { LogWorker, LogWorkerData } from '@/lib/log4jsWorker'

// 创建并导出日志工作器实例
const logWorker = new LogWorker(workerData as LogWorkerData)

// 处理进程退出
process.on('exit', () => {
  logWorker.dispose()
})

process.on('SIGINT', () => {
  logWorker.dispose()
  process.exit(0)
})
