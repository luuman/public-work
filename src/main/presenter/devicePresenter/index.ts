import * as DeviceInfoModule from './deviceInfo'
import * as ResourceCacheModule from './resourceCache'
import * as StorageResetModule from './storageReset'
import * as SystemOpsModule from './systemOps'

export class DevicePresenter {
  // deviceInfo
  getDeviceInfo = DeviceInfoModule.getDeviceInfo
  getCPUUsage = DeviceInfoModule.getCPUUsage
  getMemoryUsage = DeviceInfoModule.getMemoryUsage
  getDiskSpace = DeviceInfoModule.getDiskSpace

  // resourceCache
  cacheImage = ResourceCacheModule.cacheImage

  // storageReset
  resetDataWithConfirm = StorageResetModule.resetDataWithConfirm
  restartAppWithDelay = StorageResetModule.restartAppWithDelay

  // systemOps
  selectDirectory = SystemOpsModule.selectDirectory
  restartApp = SystemOpsModule.restartApp
}
