import { dialog, app } from 'electron'
import { appLog } from '@/presenter/logPresenter'

export async function selectDirectory(): Promise<{
  canceled: boolean
  filePaths: string[]
}> {
  appLog.info('devicePresenter selectDirectory')
  return dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
  })
}

export function restartApp(): void {
  appLog.info('devicePresenter restartApp')
  app.relaunch()
  app.exit()
}
