import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DevicePresenter } from '../../../src/main/presenter/DevicePresenter'

// ==== mock 系统模块 ====
vi.mock('os', () => ({
  default: {
    cpus: vi.fn(() => [
      {
        model: 'Intel i7',
        times: { idle: 100, user: 50, nice: 0, sys: 30, irq: 20 },
      },
    ]),
    totalmem: vi.fn(() => 16000),
    freemem: vi.fn(() => 8000),
    release: vi.fn(() => '1.0.0'),
  },
}))

vi.mock('path', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    join: (...args: string[]) => args.join('/'),
  }
})

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(() => []),
    lstatSync: vi.fn(() => ({ isDirectory: () => false })),
    unlinkSync: vi.fn(),
    rmdirSync: vi.fn(),
    promises: {
      writeFile: vi.fn().mockResolvedValue(undefined),
    },
  },
}))

// vi.mock('child_process', () => ({
//   exec: vi.fn((cmd, opts, cb) => {
//     if (typeof opts === 'function') cb = opts // 兼容两种写法
//     cb(null, 'FreeSpace  Size\n1000 2000')
//   }),
// }))

vi.mock('util', () => ({
  promisify: (fn: any) => fn,
}))

vi.mock('axios', () => ({
  default: vi.fn(() =>
    Promise.resolve({
      data: Buffer.from('mock image data'),
      headers: { 'content-type': 'image/png' },
    }),
  ),
}))

vi.mock('nanoid', () => ({
  nanoid: () => 'abc12345',
}))

// ==== mock Electron ====
vi.mock('electron', () => ({
  app: {
    getVersion: vi.fn(() => '1.2.3'),
    getPath: vi.fn(() => '/mock/userData'),
    relaunch: vi.fn(),
    exit: vi.fn(),
  },
  dialog: {
    showMessageBoxSync: vi.fn(() => 0),
    showOpenDialog: vi.fn(() =>
      Promise.resolve({ canceled: false, filePaths: ['/mock/path'] }),
    ),
  },
}))

// ==== mock 业务内部依赖 ====
vi.mock('@electron-toolkit/utils', () => ({
  is: { dev: false },
}))

vi.mock('@/events/eventbus', () => ({
  eventBus: { sendToRenderer: vi.fn() },
  SendTarget: { ALL_WINDOWS: 'all' },
}))

vi.mock('@/events//events', () => ({
  NOTIFICATION_EVENTS: { DATA_RESET_COMPLETE_DEV: 'DATA_RESET_COMPLETE_DEV' },
}))

describe('DevicePresenter', () => {
  let presenter: DevicePresenter

  beforeEach(() => {
    presenter = new DevicePresenter()
    vi.clearAllMocks()
  })

  it('should return app version', async () => {
    const version = await presenter.getAppVersion()
    expect(version).toBe('1.2.3')
  })

  it('should return device info', async () => {
    const info = await presenter.getDeviceInfo()
    expect(info.cpuModel).toBe('Intel i7')
    expect(info.totalMemory).toBe(16000)
  })

  //   it('should calculate CPU usage', async () => {
  //     const usage = await presenter.getCPUUsage()
  //     expect(usage).toBeGreaterThan(0)
  //   })

  it('should return memory usage', async () => {
    const mem = await presenter.getMemoryUsage()
    expect(mem.used).toBe(8000)
  })

  //   it('should get disk space on win32', async () => {
  //     vi.stubGlobal('process', { platform: 'win32' })
  //     const disk = await presenter.getDiskSpace()
  //     expect(disk.total).toBeGreaterThan(0)
  //   })

  it('should cache image from URL', async () => {
    const url = 'https://example.com/image.png'
    const result = await presenter.cacheImage(url)
    expect(result.startsWith('imgcache://')).toBe(true)
  })

  it('should cache image from Base64', async () => {
    const base64 =
      'data:image/png;base64,' + Buffer.from('123').toString('base64')
    const result = await presenter.cacheImage(base64)
    expect(result.startsWith('imgcache://')).toBe(true)
  })

  it('should select directory', async () => {
    const res = await presenter.selectDirectory()
    expect(res.filePaths[0]).toBe('/mock/path')
  })

  //   it('should restart app', async () => {
  //     await presenter.restartApp()
  //     expect(require('electron').app.relaunch).toHaveBeenCalled()
  //     expect(require('electron').app.exit).toHaveBeenCalled()
  //   })
})
