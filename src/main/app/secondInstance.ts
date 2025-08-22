import { appLog } from '@/presenter/logPresenter'

export function handleSecondInstance(argv: string[], cwd: string) {
  let commands = argv.slice()
  let activeUrl = decodeURI(String(commands.pop()))

  const url = argv.find((arg) => arg.startsWith('matrxmeeting://'))

  appLog.info('second-instance argv:', activeUrl, 'url:', url, 'cwd:', cwd)
}
