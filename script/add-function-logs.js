const fs = require('fs/promises')
const path = require('path')
const { glob } = require('glob')
const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const t = require('@babel/types')
const { TARGET_DIR, FILE_PATTERN } = require('./config')

// 为函数添加console.log
function addFunctionLogs(code) {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['typescript'],
  })

  traverse(ast, {
    FunctionDeclaration(path) {
      const functionName = path.node.id?.name
      if (functionName) {
        const consoleLog = t.expressionStatement(
          t.callExpression(
            t.memberExpression(t.identifier('console'), t.identifier('log')),
            [t.stringLiteral(`🚀 调用函数: ${functionName}`)],
          ),
        )
        path.get('body').unshiftContainer('body', consoleLog)
      }
    },
    ArrowFunctionExpression(path) {
      if (t.isVariableDeclarator(path.parent)) {
        const functionName = path.parent.id?.name
        if (functionName) {
          const consoleLog = t.expressionStatement(
            t.callExpression(
              t.memberExpression(t.identifier('console'), t.identifier('log')),
              [t.stringLiteral(`🚀 调用箭头函数: ${functionName}`)],
            ),
          )
          if (t.isBlockStatement(path.node.body)) {
            path.get('body').unshiftContainer('body', consoleLog)
          } else {
            // 处理简写箭头函数 (如: () => 'something')
            const block = t.blockStatement([
              consoleLog,
              t.returnStatement(path.node.body),
            ])
            path.get('body').replaceWith(block)
          }
        }
      }
    },
    FunctionExpression(path) {
      if (t.isVariableDeclarator(path.parent)) {
        const functionName = path.parent.id?.name
        if (functionName) {
          const consoleLog = t.expressionStatement(
            t.callExpression(
              t.memberExpression(t.identifier('console'), t.identifier('log')),
              [t.stringLiteral(`🚀 调用函数表达式: ${functionName}`)],
            ),
          )
          path.get('body').unshiftContainer('body', consoleLog)
        }
      }
    },
  })

  return generate(ast).code
}

async function processFiles() {
  try {
    const files = await glob(FILE_PATTERN, {
      cwd: TARGET_DIR,
      absolute: true,
      ignore: ['**/node_modules/**', '**/*.d.ts'],
    })

    console.log(`找到 ${files.length} 个TypeScript文件`)

    for (const filePath of files) {
      try {
        const code = await fs.readFile(filePath, 'utf-8')
        const newCode = addFunctionLogs(code)

        if (newCode !== code) {
          await fs.writeFile(filePath, newCode, 'utf-8')
          console.log(`已更新: ${path.relative(TARGET_DIR, filePath)}`)
        } else {
          console.log(`无变更: ${path.relative(TARGET_DIR, filePath)}`)
        }
      } catch (error) {
        console.error(`处理文件 ${filePath} 出错:`, error)
      }
    }

    console.log('处理完成!')
  } catch (error) {
    console.error('查找文件出错:', error)
  }
}

processFiles()
