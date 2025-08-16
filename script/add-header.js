const fs = require('fs/promises')
const path = require('path')
const { glob } = require('glob')

// Configuration
const TARGET_DIR = './src' // Directory to scan
const FILE_PATTERN = '**/*.ts' // Pattern to match TS files

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

        const fileName = path.basename(filePath, '.ts')
        const parentDir = path.basename(path.dirname(filePath))

        const displayName = fileName === 'index' ? parentDir : fileName
        const CODE_TO_ADD = `console.log('😊 ${displayName}')\n`

        // Skip if already has our header
        if (originalContent.startsWith(CODE_TO_ADD.trim())) {
          console.log(
            `Skipping ${path.relative(TARGET_DIR, filePath)} - already processed`,
          )
          continue
        }

        // Prepend new code
        const newContent = CODE_TO_ADD + originalContent
        console.log(`🚀 ${newContent}`)

        // // Write back to file
        await fs.writeFile(filePath, newContent, 'utf-8')
        console.log(`Updated ${path.relative(TARGET_DIR, filePath)}`)
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
