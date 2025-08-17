console.log('😊 logPresenterconfig')
// import { name } from 'pkg'
import { app } from 'electron'

export const categoryNames = [
  //   { categoryName: 'appLog' },
  //   { categoryName: 'bridgeLog' },
  //   { categoryName: 'ipcMainLog' },
  //   { categoryName: 'sdkLog' },
  //   { categoryName: 'e2eeLog' },
  //   { categoryName: 'meetingLog' },
  //   { categoryName: 'updaterLog' },
  //   { categoryName: 'renderLog' },
  //   { categoryName: 'callfeedbackLogMain', appenderName: 'callfeedbackLog' },
  //   { categoryName: 'fileViewerMainLog', appenderName: 'fileViewer' },
  //   { categoryName: 'screenshotLogMain', appenderName: 'screenshot' },
  //   { categoryName: 'fileLog' },
  //   { categoryName: 'messageLog' },
  //   { categoryName: 'apiLog' },
  //   { categoryName: 'ackLog' },
  //   { categoryName: 'offlineMsgLog' },
  //   { categoryName: 'storageDataLog' },
  //   { categoryName: 'msgTaskLog' },
  //   { categoryName: 'e2eeLog' },
]

export const appenderNames = [
  //   { appenderName: 'avr-risk' },
  //   { appenderName: 'callfeedbackLog' },
  //   { appenderName: 'deleteAccountFeedback' },
  //   { appenderName: 'delete-account' },
  //   { appenderName: 'file-dev' },
  //   { appenderName: 'fileViewer' },
  { appenderName: 'info-dev' },
  { appenderName: 'msgAllLog' },
  { appenderName: 'cst-meeting-sdk' },
  { appenderName: 'cst-meeting-agent', filename: 'CST_Meeting/agent' },
  { appenderName: 'pictureViewer' },
  { appenderName: 'screenshot' },
  //   { appenderName: 'h-sdk' },
  //   { appenderName: 'session-dev' },
  //   { appenderName: 'setEmoji' },
  //   { appenderName: 'storage-data' },
  //   { appenderName: 'ack' },
  //   { appenderName: 'offlineMsg' },
  //   { appenderName: 'msgTask' },
  //   { appenderName: 'e2ee' },
  { appenderName: app.getName() },
]
