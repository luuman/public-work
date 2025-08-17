const { TARGET_DIR, FILE_PATTERN } = require('./config')
const fs = require('fs/promises')
const path = require('path')
const { parse } = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const t = require('@babel/types')

async function processFile(filePath) {
  try {
    const code = await fs.readFile(filePath, 'utf-8')

    // 解析为AST
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
      tokens: true, // 保留token信息以维持格式
    })

    let modified = false

    // 遍历AST
    traverse(ast, {
      FunctionDeclaration(path) {
        addFunctionLog(path, '函数')
      },
      FunctionExpression(path) {
        if (t.isVariableDeclarator(path.parent)) {
          addFunctionLog(path, '函数')
        }
      },
      ArrowFunctionExpression(path) {
        if (t.isVariableDeclarator(path.parent)) {
          addFunctionLog(path, '箭头函数')
        }
      },
      ClassMethod(path) {
        addFunctionLog(path, '方法')
      },
    })

    // 添加函数日志的辅助函数
    function addFunctionLog(path, type) {
      const functionName = getFunctionName(path)
      if (!functionName) return

      // 创建console.log节点
      const logStatement = t.expressionStatement(
        t.callExpression(
          t.memberExpression(t.identifier('console'), t.identifier('log')),
          [t.stringLiteral(`🚀 调用${type}: ${functionName}`)],
        ),
      )

      // 添加到函数体开头
      if (t.isBlockStatement(path.node.body)) {
        // 保持原有分号风格
        const body = path.get('body.body')
        if (body.length > 0) {
          // 检查第一个语句是否有分号
          const firstStatement = body[0]
          const originalCode = code.slice(
            firstStatement.start,
            firstStatement.end,
          )
          const hasSemicolon = originalCode.trim().endsWith(';')

          // 添加log语句，保持分号风格一致
          const newCode = generate(logStatement).code
          body[0].insertBefore(
            t.cloneNode({
              ...logStatement,
              trailingComments: hasSemicolon ? [t.createComment(';')] : [],
            }),
          )
        } else {
          path.get('body').pushContainer('body', logStatement)
        }
      } else {
        // 处理简写箭头函数
        const block = t.blockStatement([
          logStatement,
          t.returnStatement(path.node.body),
        ])
        path.get('body').replaceWith(block)
      }

      modified = true
    }

    // 获取函数名的辅助函数
    function getFunctionName(path) {
      if (t.isFunctionDeclaration(path.node)) {
        return path.node.id?.name
      }
      if (t.isVariableDeclarator(path.parent)) {
        return path.parent.id?.name
      }
      if (t.isClassMethod(path.node)) {
        return path.node.key.name
      }
      return null
    }

    // 生成代码时保留原有格式
    if (modified) {
      const output = generate(ast, {
        retainLines: true,
        retainFunctionParens: true,
        comments: true,
        compact: false,
        concise: false,
      }).code

      await fs.writeFile(filePath, output, 'utf-8')
      //   console.log(`已更新: ${filePath}`)
    } else {
      //   console.log(`无变更: ${filePath}`)
    }
  } catch (error) {
    // console.error(`处理文件 ${filePath} 出错:`, error)
  }
}

// 处理目录下所有TS文件
async function processDirectory(dirPath) {
  const files = await fs.readdir(dirPath)
  for (const file of files) {
    const fullPath = path.join(dirPath, file)
    const stat = await fs.stat(fullPath)
    console.log(`已更新: ${fullPath} ${stat.isDirectory()}`)

    if (stat.isDirectory()) {
      await processDirectory(fullPath)
    } else if (file.endsWith('.ts')) {
      await processFile(fullPath)
    }
  }
}

// 使用示例
processDirectory(TARGET_DIR).then(() => {
  //   console.log('处理完成')
})
