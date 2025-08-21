const CODE_TO_EMJIO = '😊'

const TARGET_DIR = './src/main'
const FILE_PATTERN = '**/*.ts' // Pattern to match TS files

function CODE_TO_ADD(displayName) {
  // return `import { appLog } from '@/presenter/logPresenter'\n`
  return `console.log('${CODE_TO_EMJIO} ${displayName}')\n`
}

module.exports = { CODE_TO_EMJIO, CODE_TO_ADD, TARGET_DIR, FILE_PATTERN }
