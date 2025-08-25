import { workerData } from 'worker_threads'
import { Sqlite3Worker } from '@/lib/sqlite3Worker'

// 创建并导出日志工作器实例
const worker = new Sqlite3Worker(workerData)
// console.log('Sqlite3Worker:', worker)
worker.dbLogs.info('Sqlite3Worker Database worker initialized')

// 处理进程退出
process.on('exit', () => {
  worker.destroy()
})

process.on('SIGINT', () => {
  worker.destroy()
  process.exit(0)
})

// import { dbWorker } from './dbWorker'
// import { parentPort, workerData } from 'worker_threads'

// const { dbPath, dbKey } = workerData

// console.log('🫁 dbWorker:dbPath', dbPath)
// console.log('🫁 dbWorker:dbKey', dbKey)

// const db = new dbWorker(dbPath, dbKey)

// if (!parentPort) throw new Error('This file must be run as a Worker')

// parentPort.on('message', async (msg) => {
//   const { id, method, args } = msg
//   console.log('parentPort:', id, method, args)
//   try {
//     if (typeof (db as any)[method] !== 'function') {
//       throw new Error(`Unknown method: ${method}`)
//     }

//     const result = await (db as any)[method](...(args || []))

//     parentPort!.postMessage({ id, result })
//   } catch (error) {
//     parentPort!.postMessage({ id, error: (error as Error).message })
//   }
// })
