console.log('😊 logPresenter')
import { logPresenter } from './logPresenter'

export const screenshot = logPresenter.getLogger('screenshot')
export const appLog = logPresenter.getLogger()
export const msgAllLog = logPresenter.getLogger('msgAllLog')
