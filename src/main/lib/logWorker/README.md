# LogWorker 类文档

## 概述

`LogWorker` 是一个基于 Electron 日志系统的 Worker 线程类，专门用于处理应用程序的日志记录。它提供了缓冲写入机制，能够批量处理日志消息，减少 I/O 操作，提高性能。

## 构造函数

### `new LogWorker(workerData: LogWorkerData)`

创建一个新的 LogWorker 实例。

**参数：**

- `workerData: LogWorkerData` - 配置对象，包含以下属性：
  - `logPath?: string` - 可选，日志文件存储路径
  - `isDev: boolean` - 是否为开发环境

**示例：**

```typescript
const logWorker = new LogWorker({
  logPath: './logs',
  isDev: process.env.NODE_ENV === 'development',
})
```

## 公共方法

### `log(level: keyof typeof log, message: string): void`

直接记录日志消息，不经过缓冲区。

**参数：**

- `level: keyof typeof log` - 日志级别，可选值：'error', 'warn', 'info', 'verbose', 'debug', 'silly'
- `message: string` - 日志消息内容

**示例：**

```typescript
logWorker.log('info', '应用程序启动成功')
logWorker.log('error', '数据库连接失败')
```

### `getBufferStatus(): { count: number; size: number }`

获取当前缓冲区的状态信息。

**返回值：**

- `count: number` - 缓冲区中的消息数量
- `size: number` - 缓冲区数据的总大小（字节）

**示例：**

```typescript
const status = logWorker.getBufferStatus()
console.log(`缓冲区中有 ${status.count} 条消息，总大小 ${status.size} 字节`)
```

### `flushImmediately(): void`

立即刷新缓冲区，将所有缓冲的日志消息写入文件。

**示例：**

```typescript
// 在应用退出前确保所有日志都已写入
logWorker.flushImmediately()
```

### `dispose(): void`

清理资源，停止计时器并清空缓冲区。应在不再需要 LogWorker 实例时调用。

**示例：**

```typescript
// 应用退出时清理资源
process.on('exit', () => {
  logWorker.dispose()
})
```

## 接口定义

### `LogWorkerData` 接口

Worker 初始化配置数据。

```typescript
interface LogWorkerData {
  logPath?: string // 日志文件存储路径
  isDev: boolean // 是否为开发环境
}
```

### `LogMessage` 接口

日志消息数据结构。

```typescript
interface LogMessage {
  level: keyof typeof log // 日志级别
  message: string // 日志消息内容
}
```

## 使用示例

### 基本用法

```typescript
import { Worker } from 'worker_threads'
import path from 'path'

// 创建 LogWorker
const worker = new Worker(path.join(__dirname, 'LogWorker.js'), {
  workerData: {
    logPath: './application-logs',
    isDev: process.env.NODE_ENV === 'development',
  },
})

// 发送日志消息
worker.postMessage({
  level: 'info',
  message: '应用程序启动完成',
})

worker.postMessage({
  level: 'error',
  message: '无法连接到数据库服务器',
})

// 处理工作线程事件
worker.on('message', (message) => {
  console.log('收到来自日志工作线程的消息:', message)
})

worker.on('error', (error) => {
  console.error('日志工作线程错误:', error)
})

worker.on('exit', (code) => {
  console.log('日志工作线程退出，代码:', code)
})
```

### 集成到 Electron 应用

```typescript
// 在主进程中
import { app, ipcMain } from 'electron'
import { Worker } from 'worker_threads'
import path from 'path'

let logWorker: Worker

app.whenReady().then(() => {
  // 创建日志工作线程
  logWorker = new Worker(path.join(__dirname, 'LogWorker.js'), {
    workerData: {
      logPath: app.getPath('userData') + '/logs',
      isDev: !app.isPackaged,
    },
  })

  // 设置 IPC 处理器，允许渲染进程发送日志
  ipcMain.handle('log-message', (event, level: string, message: string) => {
    logWorker.postMessage({ level, message })
  })
})

// 应用退出时清理
app.on('before-quit', () => {
  if (logWorker) {
    // 发送刷新指令，确保所有日志都已写入
    logWorker.postMessage({ action: 'flush' })
    setTimeout(() => logWorker.terminate(), 100)
  }
})
```

## 特性

1. **缓冲写入**：默认每 3 秒或缓冲区达到 100 条消息时批量写入日志
2. **性能优化**：减少磁盘 I/O 操作，提高应用性能
3. **多级别支持**：支持 error、warn、info、verbose、debug、silly 等多种日志级别
4. **开发环境优化**：在开发环境下输出更详细的日志到控制台
5. **资源管理**：提供完整的资源清理机制

## 注意事项

1. 确保在应用退出前调用 `flushImmediately()` 或等待缓冲区自动刷新，避免丢失日志
2. 在生产环境中，建议设置适当的日志路径，避免日志文件存储在临时目录
3. 日志文件会自动轮转，但需要注意磁盘空间管理

## 故障排除

如果遇到日志不写入的问题：

1. 检查日志路径是否有写入权限
2. 确认 `isDev` 参数设置正确
3. 检查是否有足够的磁盘空间

---

通过使用 `LogWorker` 类，您可以轻松地在 Electron 应用中实现高效、可靠的日志记录功能。
