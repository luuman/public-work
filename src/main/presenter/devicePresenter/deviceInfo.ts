import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
import type { DeviceInfo, MemoryInfo, DiskInfo } from '@shared/presenter'

// 将 exec 包装成异步函数
const execAsync = promisify(exec)

/**
 * 获取设备基本信息
 * @returns 返回 DeviceInfo 对象
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  return {
    platform: process.platform, // 操作系统平台，如 win32 / darwin / linux
    arch: process.arch, // CPU 架构，如 x64 / arm64
    cpuModel: os.cpus()[0].model, // CPU 型号（取第一个核心的型号）
    totalMemory: os.totalmem(), // 总内存（单位：字节）
    osVersion: os.release(), // 系统版本号
  }
}

/**
 * 获取 CPU 使用率（百分比）
 * 通过两次采样 CPU 时间差计算
 */
export async function getCPUUsage(): Promise<number> {
  // 第一次采样 CPU 时间
  const startMeasure = os.cpus().map((cpu) => cpu.times)

  // 等待 100ms
  await new Promise((resolve) => setTimeout(resolve, 100))

  // 第二次采样 CPU 时间
  const endMeasure = os.cpus().map((cpu) => cpu.times)

  // 计算每个核心的空闲率差异，并得到使用率
  const idleDifferences = endMeasure.map((end, i) => {
    const start = startMeasure[i]
    const idle = end.idle - start.idle // 空闲时间差
    const total =
      end.user -
      start.user + // 用户态时间差
      (end.nice - start.nice) + // nice 优先级时间差
      (end.sys - start.sys) + // 系统态时间差
      (end.irq - start.irq) + // 中断时间差
      idle // 空闲时间差
    return 1 - idle / total // 使用率 = 1 - 空闲比例
  })

  // 返回所有核心的平均使用率（百分比）
  return (
    (idleDifferences.reduce((sum, idle) => sum + idle, 0) /
      idleDifferences.length) *
    100
  )
}

/**
 * 获取内存使用情况
 * @returns 返回 MemoryInfo 对象
 */
export async function getMemoryUsage(): Promise<MemoryInfo> {
  const total = os.totalmem() // 总内存
  const free = os.freemem() // 可用内存
  const used = total - free // 已使用内存
  return { total, free, used }
}

/**
 * 获取磁盘使用情况
 * Windows 使用 wmic 命令，Mac/Linux 使用 df 命令
 * @returns 返回 DiskInfo 对象
 */
export async function getDiskSpace(): Promise<DiskInfo> {
  if (process.platform === 'win32') {
    // Windows 系统
    const { stdout } = await execAsync('wmic logicaldisk get size,freespace')
    const lines = stdout.trim().split('\n').slice(1) // 去掉标题行
    let total = 0,
      free = 0

    // 遍历每个磁盘
    lines.forEach((line) => {
      const [freeSpace, size] = line.trim().split(/\s+/).map(Number)
      if (!isNaN(freeSpace) && !isNaN(size)) {
        total += size // 累加总容量
        free += freeSpace // 累加空闲容量
      }
    })

    return { total, free, used: total - free } // 返回磁盘信息
  } else {
    // macOS / Linux 系统
    const { stdout } = await execAsync('df -k /') // 获取根目录磁盘信息，单位 KB
    const [, line] = stdout.trim().split('\n') // 取第二行，包含磁盘数据
    const [, total, , used, free] = line.split(/\s+/)

    return {
      total: parseInt(total) * 1024, // 转为字节
      used: parseInt(used) * 1024, // 转为字节
      free: parseInt(free) * 1024, // 转为字节
    }
  }
}
