declare module 'electron-store' {
  interface Options<T> {
    defaults?: Partial<T>
    name?: string
    // 其他选项...
  }

  class Store<T extends Record<string, any>> {
    constructor(options?: Options<T>)
    get<K extends keyof T>(key: K, defaultValue?: T[K]): T[K]
    set<K extends keyof T>(key: K, value: T[K]): void
    has(key: string): boolean
    delete(key: string): void
    clear(): void
  }

  export = Store
}
