// workerManager.ts
import { Worker } from 'worker_threads'
import path from 'path'

/**
 * WorkerManager 封装了 worker_threads 的 Worker 对象，
 * 提供消息发送、错误处理和退出管理的统一接口，
 * 并处理绝对路径/相对路径兼容。
 */
export class WorkerManager {
  // Worker 实例
  private worker: Worker
  // 标记 Worker 是否已终止
  private isTerminated = false

  /**
   * 创建 WorkerManager 实例
   * @param workerFile - Worker 文件路径，支持绝对或相对路径
   * @param workerData - 初始化传递给 Worker 的数据
   */
  constructor(workerFile: string, workerData: any = {}) {
    // 如果传入的是相对路径，则转换为绝对路径
    const absPath = path.isAbsolute(workerFile)
      ? workerFile
      : path.join(__dirname, workerFile)

    // 创建 Worker 实例
    this.worker = new Worker(absPath, { workerData })

    // 监听 Worker 发送的消息
    this.worker.on('message', (msg) => {
      console.log(`🚀[Worker ${this.worker.threadId}] Message:`, msg)
    })

    // 监听 Worker 内部错误
    this.worker.on('error', (err) => {
      console.error(`🚀[Worker ${this.worker.threadId}] Error:`, err)
    })

    // 监听 Worker 退出事件
    this.worker.on('exit', (code) => {
      console.log(`🚀[Worker ${this.worker.threadId}] Exit code: ${code}`)
      this.isTerminated = true
    })

    // 如果 Worker 有 stdout，打印 Worker 输出
    this.worker.stdout?.on('data', (chunk) => {
      process.stdout.write(`[Worker] ${chunk}`)
    })

    // 如果 Worker 有 stderr，打印 Worker 错误输出
    this.worker.stderr?.on('data', (chunk) => {
      process.stderr.write(`[Worker ERR] ${chunk}`)
    })
  }

  /**
   * 向 Worker 发送消息
   * @param message - 需要发送给 Worker 的数据
   */
  public postMessage(message: any) {
    if (!this.isTerminated) {
      this.worker.postMessage(message)
    } else {
      console.warn(`Worker ${this.worker.threadId} 已结束，无法发送消息`)
    }
  }

  /**
   * 终止 Worker
   * 如果 Worker 已经结束，则不会重复终止
   */
  public terminate() {
    if (!this.isTerminated) {
      return this.worker.terminate()
    }
  }
}
