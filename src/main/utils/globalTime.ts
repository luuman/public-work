// utils/globalTime.ts
const globalTimers = new Map<string, number>()

export function hookConsoleTime() {
  const originalTime = console.time
  const originalTimeEnd = console.timeEnd

  console.time = (label = 'default') => {
    // console.log('🚀AppStartupTime hookConsoleTime', label, globalTimers)

    if (!globalTimers.has(label)) {
      globalTimers.set(label, Date.now())
    }
    originalTime.call(console, label)
  }

  console.timeEnd = (label = 'default') => {
    // console.log('🚀AppStartupTime hookConsoleTimetimeEnd', label, globalTimers)
    const start = globalTimers.get(label)
    if (!start) {
      console.warn(`No such label '${label}' for console.timeEnd()`)
      return
    }
    const duration = Date.now() - start
    globalTimers.delete(label)
    // console.log(`⏱ ${label}: ${duration}ms`)
    originalTimeEnd.call(console, label)
  }
}
