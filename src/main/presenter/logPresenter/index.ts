import { logPresenter } from './logPresenter'

export const screenshot = logPresenter.getLogger('screenshot')
export const appLog = logPresenter.getLogger()
export const msgAllLog = logPresenter.getLogger('msgAllLog')

const originalConsole = { ...console }

;['log', 'warn', 'error', 'debug', 'info'].forEach((method) => {
  console[method] = (...args) => {
    const timestamp = new Date().toISOString()
    originalConsole[method](`[${timestamp}]`, ...args)
  }
})
