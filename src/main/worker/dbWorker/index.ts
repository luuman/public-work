import { dbWorker } from './dbWorker'
import { parentPort, workerData } from 'worker_threads'

const { dbPath, dbKey } = workerData

console.log('🫁 dbWorker:dbPath', dbPath)
console.log('🫁 dbWorker:dbKey', dbKey)

// 打开数据库
const db = new dbWorker(dbPath)

if (!parentPort) throw new Error('This file must be run as a Worker')

parentPort.on('message', (msg) => {
  const { id, type, sql, params } = msg
  try {
    let result
    if (type === 'run') {
      const stmt = db.prepare(sql)
      result = stmt.run(params)
    } else if (type === 'get') {
      const stmt = db.prepare(sql)
      result = stmt.get(params)
    } else if (type === 'all') {
      const stmt = db.prepare(sql)
      result = stmt.all(params)
    }
    parentPort.send({ id, success: true, result })
  } catch (err) {
    parentPort.send({ id, success: false, error: err.message })
  }
})
