// utils/performanceMonitor.js
class PerformanceMonitor {
  static marks = new Map()

  static mark(name) {
    this.marks.set(name, {
      time: Date.now(),
      memory: process.memoryUsage(),
    })
  }

  //   static measure(startMark, endMark) {
  //     const start = this.marks.get(startMark)
  //     const end = this.marks.get(endMark)

  //     if (start && end) {
  //       return {
  //         duration: end.time - start.time,
  //         memoryDiff: this.calculateMemoryDiff(start.memory, end.memory),
  //       }
  //     }
  //   }

  static calculateMemoryDiff(startMem, endMem) {
    return {
      rss: endMem.rss - startMem.rss,
      heapTotal: endMem.heapTotal - startMem.heapTotal,
      heapUsed: endMem.heapUsed - startMem.heapUsed,
    }
  }
}

// // 在关键节点添加性能标记
// PerformanceMonitor.mark('app-start');
// // ...
// PerformanceMonitor.mark('window-created');
// const metrics = PerformanceMonitor.measure('app-start', 'window-created');
