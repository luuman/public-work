const fs = require('fs/promises')
const path = require('path')
const { glob } = require('glob')
const { CODE_TO_EMJIO } = require('./config')
const { TARGET_DIR, FILE_PATTERN } = require('./config')

async function processFiles() {
  try {
    // Find all TS files recursively
    const files = await glob(FILE_PATTERN, {
      cwd: TARGET_DIR,
      absolute: true,
      ignore: '**/node_modules/**',
    })

    console.log(`Found ${files.length} TypeScript files to process`)

    for (const file of files) {
      try {
        // console.log(`Found ${file} TypeScript files to process`)
        const content = await fs.readFile(file, 'utf-8')
        const pattern = new RegExp(
          `(console\\s*\\.\\s*log\\s*\\(\\s*['"]${escapeRegExp(CODE_TO_EMJIO)}\\s*)\\w+(\\s*['"]\\s*\\))\\s*([\\r\\n]+)`,
          'g',
        )
        // console.log(pattern)

        // 使用文件名（不含扩展名）作为新Presenter名称
        const newName = path.basename(file, '.ts')
        const isHeader = pattern.test(content)
        if (isHeader) {
          const newContent = content.replace(pattern, '')
          console.log(isHeader, newContent)

          if (newContent !== content) {
            await fs.writeFile(file, newContent, 'utf-8')
            console.log(`已更新 ${file} 中的Presenter名称`)
          }
        }
      } catch (error) {
        console.error(`处理 ${file} 时出错:`, error)
      }
    }

    console.log('Processing complete!')
  } catch (error) {
    console.error('Error finding files:', error)
  }
}

processFiles().then(() => console.log('处理完成'))

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
