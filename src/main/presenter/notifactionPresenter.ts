console.log('😊 notifactionPresenter')
import {
  nativeImage,
  Notification,
  NotificationConstructorOptions,
} from 'electron'
import icon from '../../../resources/icon.png?asset'
import { eventBus, SendTarget } from '@/events/eventbus'
import { NOTIFICATION_EVENTS } from '@/events/events'
import { presenter } from '.'

interface NotificationItem {
  id: string
  notification: Notification
}

export class NotificationPresenter {
  private notifications: Map<string, NotificationItem> = new Map()

  /**
   * 显示系统通知
   */
  async showNotification(options: {
    id: string
    title: string
    body: string
    silent?: boolean
  }) {
    const notificationsEnabled =
      presenter.configPresenter.getNotificationsEnabled()
    if (!notificationsEnabled) {
      return
    }

    // 如果已经存在相同ID的通知，先清除
    this.clearNotification(options.id)

    const iconFile = nativeImage.createFromPath(icon)
    const notificationOptions: NotificationConstructorOptions = {
      title: options.title,
      body: options.body,
      silent: options.silent,
      // 可以根据需要添加更多选项，如图标等
      icon: iconFile,
    }

    const notification = new Notification(notificationOptions)

    notification.on('click', () => {
      eventBus.sendToRenderer(
        NOTIFICATION_EVENTS.SYS_NOTIFY_CLICKED,
        SendTarget.ALL_WINDOWS,
        options.id,
      )
      this.clearNotification(options.id)
    })

    // 在通知关闭时自动从管理列表移除
    notification.on('close', () => {
      this.notifications.delete(options.id)
    })

    this.notifications.set(options.id, {
      id: options.id,
      notification,
    })

    notification.show()

    return options.id
  }

  /**
   * 清除指定ID的通知
   */
  clearNotification(id: string) {
    const notificationItem = this.notifications.get(id)
    if (notificationItem) {
      // Electron的Notification没有直接的close方法，但可以通过销毁对象来关闭通知
      // 这里我们依赖GC来处理，从Map中移除引用
      this.notifications.delete(id)
    }
  }

  /**
   * 清除所有通知
   */
  clearAllNotifications() {
    this.notifications.forEach((item) => {
      this.clearNotification(item.id)
    })
    this.notifications.clear()
  }
}
