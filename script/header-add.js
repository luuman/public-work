const fs = require('fs/promises')
const path = require('path')
const { glob } = require('glob')
const { CODE_TO_ADD, TARGET_DIR, FILE_PATTERN } = require('./config')

// 获取显示名称（返回相对于TARGET_DIR的路径，不带扩展名）
function getDisplayName(filePath) {
  const relativePath = path.relative(TARGET_DIR, filePath)
  const withoutExt = relativePath.replace(/\.ts$/, '')
  // console.log(relativePath, withoutExt)
  return withoutExt
}

async function processFiles() {
  try {
    // Find all TS files recursively
    const files = await glob(FILE_PATTERN, {
      cwd: TARGET_DIR,
      absolute: true,
      ignore: '**/node_modules/**',
    })

    console.log(`Found ${files.length} TypeScript files to process`)

    for (const filePath of files) {
      try {
        // Read original content
        const originalContent = await fs.readFile(filePath, 'utf-8')

        const displayName = getDisplayName(filePath)

        // Skip if already has our header
        const name = CODE_TO_ADD(displayName)
        if (originalContent.startsWith(name.trim())) {
          // console.log(
          //   `Skipping ${path.relative(TARGET_DIR, filePath)} - already processed`,
          // )
          continue
        }

        // Prepend new code
        const newContent = name + originalContent
        // console.log(`🚀 ${newContent}`)

        // // Write back to file
        await fs.writeFile(filePath, newContent, 'utf-8')
        // console.log(`Updated ${path.relative(TARGET_DIR, filePath)}`)
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error)
      }
    }

    console.log('Processing complete!')
  } catch (error) {
    console.error('Error finding files:', error)
  }
}

processFiles()
