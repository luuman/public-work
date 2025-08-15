/**
 * DialogPresenter 类
 * 通过渲染进程实现消息对话框（Message Dialog）
 * 对话框会显示在当前活动的 Tab 上，如果 Tab 在后台，会自动切换到前台
 * 每个活动窗口最多存在一个对话框，重复调用会触发上一个对话框的回调，返回 null
 * @see {@link SendTarget.DEFAULT_TAB}
 */
import {
  DialogRequest,
  DialogRequestParams,
  DialogResponse,
  IDialogPresenter,
} from '@shared/presenter'
import { eventBus, SendTarget } from '@/events/eventbus'
import { DIALOG_EVENTS } from '@/events/events'
import { nanoid } from 'nanoid'

export class DialogPresenter implements IDialogPresenter {
  // 存储待处理的对话框，用 id 作为 key
  // value 包含 resolve 和 reject，用于 Promise 的回调
  private pendingDialogs = new Map<
    string,
    {
      resolve: (response: string) => void
      reject: (error: Error) => void
    }
  >()

  /**
   * 在默认活动 Tab 上显示对话框
   * @param request DialogRequestParams 对话框参数
   * @returns Promise<string> 用户点击的按钮 key
   */
  async showDialog(request: DialogRequestParams): Promise<string> {
    // 必须传入 title，否则抛出异常
    if (!request.title) {
      throw new Error('Dialog title is required')
    }
    // 检查是否有多个默认按钮，如果有，抛出异常
    if (
      Array.isArray(request.buttons) &&
      request.buttons.filter((btn) => btn.default).length > 1
    ) {
      throw new Error('Dialog buttons cannot have more than one default button')
    }

    // 返回一个 Promise，在用户操作完成或发生错误时 resolve/reject
    return new Promise((resolve, reject) => {
      try {
        // 构建最终的 DialogRequest 对象
        const finalRequest: DialogRequest = {
          id: nanoid(8), // 使用 nanoid 生成唯一 id
          title: request.title,
          description: request.description,
          i18n: !!request.i18n, // 是否启用国际化
          icon: request.icon,
          buttons: request.buttons ?? [{ key: 'ok', label: 'OK' }], // 默认按钮
          timeout: request.timeout ?? 0, // 超时时间，0 表示不超时
        }

        // 将对话框加入待处理 Map
        this.pendingDialogs.set(finalRequest.id, { resolve, reject })

        try {
          // 发送对话框请求给渲染进程
          eventBus.sendToRenderer(
            DIALOG_EVENTS.REQUEST,
            SendTarget.DEFAULT_TAB,
            finalRequest,
          )
        } catch (error) {
          // 发送失败，清理 Map 并 reject
          this.pendingDialogs.delete(finalRequest.id)
          reject(error)
        }
      } catch (err) {
        console.error('❌[Dialog] Error in showDialog:', err)
        reject(err)
      }
    })
  }

  /**
   * 处理对话框响应
   * 当渲染进程返回用户操作结果时调用
   * @param response DialogResponse 对话框响应对象
   */
  async handleDialogResponse(response: DialogResponse): Promise<void> {
    if (this.pendingDialogs.has(response.id)) {
      console.log('[Dialog] response received:', response)
      const pendingDialog = this.pendingDialogs.get(response.id)
      // 从 pendingDialogs 中移除
      this.pendingDialogs.delete(response.id)
      // 调用 resolve，将用户点击的按钮 key 返回给调用方
      pendingDialog?.resolve(response.button)
    }
  }

  /**
   * 处理对话框错误（取消或异常）
   * @param id 对话框 id
   */
  async handleDialogError(id: string): Promise<void> {
    if (this.pendingDialogs.has(id)) {
      console.warn(`[Dialog] Error handling dialog with id: ${id}`)
      const pendingDialog = this.pendingDialogs.get(id)
      // 从 Map 中删除
      this.pendingDialogs.delete(id)
      // reject Promise，通知调用方对话框被取消
      pendingDialog?.reject(new Error(`Dialog with id ${id} was cancelled`))
    }
  }
}
