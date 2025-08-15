import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationPresenter } from '../../../src/main/presenter/notifactionPresenter'

// 模拟 Electron API
vi.mock('electron', () => ({
  Notification: vi.fn(function (this: any, options: any) {
    this.options = options
    this.show = vi.fn()
    this.on = vi.fn()
  }),
  nativeImage: {
    createFromPath: vi.fn(() => 'mock-icon'),
  },
}))

// 模拟 icon 路径
vi.mock('../../../resources/icon.png?asset', () => ({
  default: 'mock-icon-path',
}))

// 模拟 eventBus
vi.mock('@/events/eventbus', () => ({
  eventBus: { sendToRenderer: vi.fn() },
  SendTarget: { ALL_WINDOWS: 'ALL_WINDOWS' },
}))

// 模拟事件常量
vi.mock('@/events/events', () => ({
  NOTIFICATION_EVENTS: { SYS_NOTIFY_CLICKED: 'SYS_NOTIFY_CLICKED' },
}))

// 模拟 presenter.configPresenter
vi.mock('.', () => ({
  presenter: {
    configPresenter: {
      getNotificationsEnabled: vi.fn(() => true),
    },
  },
}))

describe('NotificationPresenter', () => {
  let notificationPresenter: NotificationPresenter
  let MockNotification: any

  beforeEach(() => {
    notificationPresenter = new NotificationPresenter()
    MockNotification = require('electron').Notification
    vi.clearAllMocks()
  })

  it('应创建并显示通知', async () => {
    const id = await notificationPresenter.showNotification({
      id: '123',
      title: '测试标题',
      body: '测试内容',
    })

    expect(id).toBe('123')
    expect(MockNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '测试标题',
        body: '测试内容',
        icon: 'mock-icon',
      }),
    )
    expect(MockNotification.mock.instances[0].show).toHaveBeenCalled()
  })

  it('通知点击时应发送事件并清除', async () => {
    const { eventBus } = require('@/events/eventbus')
    const mockOn = vi.fn((event: string, cb: Function) => {
      if (event === 'click') cb()
    })
    MockNotification.mockImplementationOnce(function (this: any, options: any) {
      this.options = options
      this.show = vi.fn()
      this.on = mockOn
    })

    await notificationPresenter.showNotification({
      id: 'click-test',
      title: 'Click Test',
      body: 'Click Body',
    })

    expect(eventBus.sendToRenderer).toHaveBeenCalledWith(
      'SYS_NOTIFY_CLICKED',
      'ALL_WINDOWS',
      'click-test',
    )
  })

  it('通知关闭时应从 Map 中删除', async () => {
    const mockOn = vi.fn((event: string, cb: Function) => {
      if (event === 'close') cb()
    })
    MockNotification.mockImplementationOnce(function (this: any, options: any) {
      this.options = options
      this.show = vi.fn()
      this.on = mockOn
    })

    await notificationPresenter.showNotification({
      id: 'close-test',
      title: 'Close Test',
      body: 'Close Body',
    })

    expect(notificationPresenter['notifications'].has('close-test')).toBe(false)
  })

  it('clearNotification 应移除指定通知', async () => {
    notificationPresenter['notifications'].set('to-clear', {
      id: 'to-clear',
      notification: {} as any,
    })
    notificationPresenter.clearNotification('to-clear')
    expect(notificationPresenter['notifications'].has('to-clear')).toBe(false)
  })

  it('clearAllNotifications 应清空所有通知', async () => {
    notificationPresenter['notifications'].set('n1', {
      id: 'n1',
      notification: {} as any,
    })
    notificationPresenter['notifications'].set('n2', {
      id: 'n2',
      notification: {} as any,
    })

    notificationPresenter.clearAllNotifications()
    expect(notificationPresenter['notifications'].size).toBe(0)
  })
})
