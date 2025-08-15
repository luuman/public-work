// main/PerfTracker.ts
// export const PerfTracker = {
//   marks: new Map<string, number>(),
//   measures: [] as { name: string; duration: number }[],
//   mark(name: string) {
//     this.marks.set(name, performance.now())
//   },
//   measure(name: string, startMark: string, endMark: string) {
//     const start = this.marks.get(startMark)
//     const end = this.marks.get(endMark)
//     if (start != null && end != null) {
//       this.measures.push({ name, duration: end - start })
//     }
//   },
// }
import { is } from '@electron-toolkit/utils'
import { performance, PerformanceObserver } from 'perf_hooks'

interface IPerfTracker {
  marks: Map<string, number>
  measures: { name: string; duration: number }[]
  mark(name: string): void
  measure(name: string, startMark: string, endMark: string): void
}

let PerfTracker: IPerfTracker | null = null

if (is.dev) {
  PerfTracker = {
    marks: new Map<string, number>(),
    measures: [] as { name: string; duration: number }[],
    mark(name: string) {
      this.marks.set(name, performance.now())
    },
    measure(name: string, startMark: string, endMark: string) {
      const start = this.marks.get(startMark)
      const end = this.marks.get(endMark)
      if (start != null && end != null) {
        this.measures.push({ name, duration: end - start })
      }
    },
  }
}
export const PerfObserver = PerformanceObserver

export default PerfTracker
