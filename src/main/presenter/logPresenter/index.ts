import { app } from 'electron'
import { logPresenter } from './logPresenter'

export const appLog = logPresenter?.getLogger(app.getName())
export const screenshot = logPresenter?.getLogger('screenshot')
export const msgAllLog = logPresenter?.getLogger('msgAllLog')

if (__DEV__) performance.mark('log:ready')
