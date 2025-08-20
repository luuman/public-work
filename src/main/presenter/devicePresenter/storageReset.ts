import fs from 'fs'
import path from 'path'
import { app, dialog } from 'electron'
import { eventBus, SendTarget } from '@/events/eventbus'
import { NOTIFICATION_EVENTS } from '@/events/events'
import { is } from '@electron-toolkit/utils'
import { appLog } from '@/presenter/logPresenter'

function removeDirectory(dirPath: string) {
  appLog.info('devicePresenter removeDirectory')
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const currentPath = path.join(dirPath, file)
      if (fs.lstatSync(currentPath).isDirectory()) removeDirectory(currentPath)
      else fs.unlinkSync(currentPath)
    })
    fs.rmdirSync(dirPath)
  }
}

function removeFile(filePath: string) {
  appLog.info('devicePresenter removeFile')
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

export async function resetDataWithConfirm(): Promise<void> {
  appLog.info('devicePresenter resetDataWithConfirm')
  const response = dialog.showMessageBoxSync({
    type: 'warning',
    buttons: ['确认', '取消'],
    defaultId: 0,
    message: '清除本地的所有数据',
    detail: '注意本操作会导致本地记录彻底删除，你确定么？',
  })

  if (response === 0) {
    try {
      removeDirectory(path.join(app.getPath('userData'), 'app_db'))
      app.relaunch()
      app.exit()
    } catch (err) {
      console.error('❌softReset failed', err)
      throw err
    }
  }
}

export function restartAppWithDelay() {
  appLog.info('devicePresenter restartAppWithDelay')
  if (is.dev) {
    eventBus.sendToRenderer(
      NOTIFICATION_EVENTS.DATA_RESET_COMPLETE_DEV,
      SendTarget.ALL_WINDOWS,
    )
    return
  }
  setTimeout(() => {
    app.relaunch()
    app.exit()
  }, 1000)
}
