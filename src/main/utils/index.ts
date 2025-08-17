export async function handleShowHiddenWindow(mustShow: boolean) {
  const { presenter } = await import('@/presenter')

  const allWindows = presenter.windowPresenter.getAllWindows()
  if (allWindows.length === 0) {
    presenter.windowPresenter.createShellWindow({
      initialTab: {
        url: 'local://chat',
      },
    })
  } else {
    // 查找目标窗口 (焦点窗口或第一个窗口)
    const targetWindow =
      presenter.windowPresenter.getFocusedWindow() || allWindows[0]

    if (!targetWindow.isDestroyed()) {
      // 逻辑: 如果窗口可见且不是从托盘点击触发，则隐藏；否则显示并置顶
      if (targetWindow.isVisible() && !mustShow) {
        presenter.windowPresenter.hide(targetWindow.id)
      } else {
        presenter.windowPresenter.show(targetWindow.id)
        targetWindow.focus() // 确保窗口置顶
      }
    } else {
      console.warn('Target window for SHOW_HIDDEN_WINDOW event is destroyed.') // 保持 warn
      // 如果目标窗口已销毁，创建新窗口
      presenter.windowPresenter.createShellWindow({
        initialTab: {
          url: 'local://chat',
        },
      })
    }
  }
}

// 异步处理显示或隐藏隐藏窗口的逻辑
export async function handleShowHiddenWindows(mustShow: boolean) {
  // 延迟导入 presenter 模块，避免模块循环依赖或启动时加载过早
  const { presenter } = await import('@/presenter')

  // 获取当前所有窗口实例
  const allWindows = presenter.windowPresenter.getAllWindows()

  if (allWindows.length === 0) {
    // 如果没有任何窗口存在，说明应用可能是首次启动
    // 创建一个新的主窗口 (Shell 窗口)
    presenter.windowPresenter.createShellWindow({
      initialTab: {
        url: 'local://chat', // 初始页面 URL
      },
    })
  } else {
    // 查找目标窗口
    // 优先选择当前焦点窗口，如果没有焦点窗口，则使用第一个窗口
    const targetWindow =
      presenter.windowPresenter.getFocusedWindow() || allWindows[0]

    // 检查窗口是否已销毁
    if (!targetWindow.isDestroyed()) {
      // 如果窗口可见且不是必须显示，则隐藏窗口
      if (targetWindow.isVisible() && !mustShow) {
        presenter.windowPresenter.hide(targetWindow.id)
      } else {
        // 否则显示窗口并置顶
        presenter.windowPresenter.show(targetWindow.id)
        targetWindow.focus() // 确保窗口获得焦点并置顶
      }
    } else {
      // 如果目标窗口已销毁，打印警告
      console.warn('Target window for SHOW_HIDDEN_WINDOW event is destroyed.')

      // 创建新的主窗口以保证应用界面可用
      presenter.windowPresenter.createShellWindow({
        initialTab: {
          url: 'local://chat',
        },
      })
    }
  }
}
