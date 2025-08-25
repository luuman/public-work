import { workerData } from 'worker_threads'
import { MainDBWorker } from '@/lib/MainDBWorker'

// 创建并导出日志工作器实例
const worker = new MainDBWorker(workerData)

// 处理进程退出
process.on('exit', () => {
  worker.destroy()
})

process.on('SIGINT', () => {
  worker.destroy()
  process.exit(0)
})
