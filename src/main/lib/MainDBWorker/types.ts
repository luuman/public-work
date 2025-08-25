// types.ts
export interface LogWorkerData {
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  logFile: string
  maxLogSize?: number
  backupCount?: number
}

export interface DBWorkerData {
  dbPath: string
  dbKey: string
  dbName: string
}

export interface CombinedWorkerData extends LogWorkerData, DBWorkerData {}

export interface DatabaseOperation {
  action: string
  data?: any
}

export interface WorkerMessage {
  id: number
  type: 'log' | 'db' | 'system'
  operation: DatabaseOperation
  targetDb?: string
}
