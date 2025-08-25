// 在主线程中使用
import { Worker } from 'worker_threads'
import path from 'path'

// 启动数据库工作线程
const dbWorker = new Worker(path.join(\_\_dirname, 'DbWorker.js'), {
workerData: {
dbPath: './data.db',
dbKey: 'my-secret-key',
schema: [
{
name: 'users',
columns: [
{ name: 'id', type: 'TEXT', constraints: ['PRIMARY KEY'] },
{ name: 'name', type: 'TEXT', constraints: ['NOT NULL'] },
{ name: 'email', type: 'TEXT', constraints: ['UNIQUE'] },
{
name: 'created_at',
type: 'INTEGER',
constraints: ["DEFAULT (strftime('%s','now'))"],
},
],
indexes: [
{ name: 'idx_users_email', columns: ['email'], unique: true },
],
},
],
options: {
verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
},
},
})

// 发送数据库操作
dbWorker.postMessage({
id: 1,
method: 'set',
args: ['user:1', { name: 'John Doe', email: 'john@example.com' }],
})

// 处理响应
dbWorker.on('message', (msg) => {
console.log('Database operation result:', msg)
})

dbWorker.on('error', (err) => {
console.error('Database worker error:', err)
})

dbWorker.on('exit', (code) => {
console.log('Database worker exited with code:', code)
})
