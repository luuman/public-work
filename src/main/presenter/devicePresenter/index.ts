import * as DeviceInfoModule from './deviceInfo'
import * as ResourceCacheModule from './resourceCache'
import * as StorageResetModule from './storageReset'
import * as SystemOpsModule from './systemOps'
import { appLog } from '@/presenter/logPresenter'
import {
  formatBytes,
  formatPercent,
  getPlatformName,
} from '@/utils/systemFormatter'

export class DevicePresenter {
  // deviceInfo
  getDeviceInfo = async () => {
    const device = await DeviceInfoModule.getDeviceInfo()
    appLog.info(
      '操作系统:',
      getPlatformName(device.platform as NodeJS.Platform),
      device.osVersion,
    )
    appLog.info('CPU 架构:', device.arch)
    appLog.info('CPU 型号:', device.cpuModel)
    return device
  }
  getCPUUsage = async () => {
    const cpuUsage = await DeviceInfoModule.getCPUUsage()
    appLog.info('CPU 使用率:', formatPercent(cpuUsage))
    return cpuUsage
  }
  getMemoryUsage = async () => {
    const memory = await DeviceInfoModule.getMemoryUsage()
    appLog.info('总内存:', formatBytes(memory.total))
    appLog.info('已用内存:', formatBytes(memory.used))
    appLog.info('可用内存:', formatBytes(memory.free))
    return memory
  }
  getDiskSpace = async () => {
    const disk = await DeviceInfoModule.getDiskSpace()
    appLog.info('磁盘总容量:', formatBytes(disk.total))
    appLog.info('磁盘已用:', formatBytes(disk.used))
    appLog.info('磁盘可用:', formatBytes(disk.free))
    return disk
  }

  // resourceCache
  cacheImage = ResourceCacheModule.cacheImage

  // storageReset
  resetDataWithConfirm = StorageResetModule.resetDataWithConfirm
  restartAppWithDelay = StorageResetModule.restartAppWithDelay

  // systemOps
  selectDirectory = SystemOpsModule.selectDirectory
  restartApp = SystemOpsModule.restartApp
}
