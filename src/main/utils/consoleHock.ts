const originalConsole = { ...console }
;['log', 'warn', 'error', 'debug', 'info'].forEach((method) => {
  console[method] = (...args) => {
    const timestamp = new Date().toISOString()
    originalConsole[method](`[${timestamp}]`, ...args)
  }
})
