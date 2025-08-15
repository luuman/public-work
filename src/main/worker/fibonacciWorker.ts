import { parentPort, workerData, isMainThread } from 'worker_threads'

/**
 * 递归计算斐波那契数列
 */
export function getFibonacciNumber(num: number): number {
  if (typeof num !== 'number' || num < 0) throw new Error('参数必须为非负整数')
  if (num === 0) return 0
  if (num === 1) return 1
  return getFibonacciNumber(num - 1) + getFibonacciNumber(num - 2)
}

if (!isMainThread && parentPort) {
  try {
    const { num } = workerData
    const result = getFibonacciNumber(num)
    parentPort.postMessage({ result, error: null })
  } catch (error: any) {
    parentPort.postMessage({ result: null, error: error.message })
  }
}
