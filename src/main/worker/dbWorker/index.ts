import { dbWorker } from './dbWorker'
import { parentPort, workerData } from 'worker_threads'

const { dbPath, dbKey } = workerData

// console.log('🫁 dbWorker:dbPath', dbPath)
// console.log('🫁 dbWorker:dbKey', dbKey)

const db = new dbWorker(dbPath, dbKey)

if (!parentPort) throw new Error('This file must be run as a Worker')

parentPort.on('message', async (msg) => {
  const { id, method, args } = msg
  console.log('parentPort:', id, method, args)
  try {
    if (typeof (db as any)[method] !== 'function') {
      throw new Error(`Unknown method: ${method}`)
    }

    const result = await (db as any)[method](...(args || []))

    parentPort!.postMessage({ id, result })
  } catch (error) {
    parentPort!.postMessage({ id, error: (error as Error).message })
  }
})
