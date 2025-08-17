// 导入所需模块和配置
const { TARGET_DIR, FILE_PATTERN } = require('./config') // 从配置文件导入目标目录和文件匹配模式
const fs = require('fs/promises') // 文件系统模块（Promise版本）
const path = require('path') // 路径处理模块
const { parse } = require('@babel/parser') // Babel解析器（用于生成AST）
const traverse = require('@babel/traverse').default // AST遍历工具
const generate = require('@babel/generator').default // AST生成代码工具
const t = require('@babel/types') // Babel类型工具

/**
 * 处理单个文件，为其函数添加console.log
 * @param {string} filePath 文件路径
 */
async function processFile(filePath) {
  try {
    // 读取文件内容
    const code = await fs.readFile(filePath, 'utf-8')

    // 将代码解析为AST（抽象语法树）
    const ast = parse(code, {
      sourceType: 'module', // 模块化语法
      plugins: ['typescript'], // 支持TypeScript
      tokens: true, // 保留token信息以维持代码格式
    })

    let modified = false // 标记文件是否被修改

    // 遍历AST树
    traverse(ast, {
      // 处理函数声明
      FunctionDeclaration(path) {
        addFunctionLog(path, '函数', filePath)
      },
      // 处理函数表达式
      FunctionExpression(path) {
        if (t.isVariableDeclarator(path.parent)) {
          addFunctionLog(path, '函数', filePath)
        }
      },
      // 处理箭头函数
      ArrowFunctionExpression(path) {
        if (t.isVariableDeclarator(path.parent)) {
          addFunctionLog(path, '箭头函数', filePath)
        }
      },
      // 处理类方法
      ClassMethod(path) {
        addFunctionLog(path, '方法', filePath)
      },
    })

    /**
     * 添加函数调用日志
     * @param {Object} path AST节点路径
     * @param {string} type 函数类型描述
     */
    function addFunctionLog(path, type, filePath) {
      const functionName = getFunctionName(path) // 获取函数名
      if (!functionName) return // 如果没有函数名则跳过

      // 创建console.log的AST节点
      const logStatement = t.expressionStatement(
        t.callExpression(
          t.memberExpression(t.identifier('console'), t.identifier('log')),
          [t.stringLiteral(`\n🚀 调用${filePath}: ${functionName}`)],
        ),
      )

      console.log(` ${functionName}: ${logStatement}`)
      // 将日志添加到函数体开头
      if (t.isBlockStatement(path.node.body)) {
        // 处理有函数体的函数
        const body = path.get('body.body')
        if (body.length > 0) {
          // 检查第一个语句是否有分号
          const firstStatement = body[0]
          const originalCode = code.slice(
            firstStatement.start,
            firstStatement.end,
          )
          const hasSemicolon = originalCode.trim().endsWith(';')
          console.log(` ${functionName}: ${originalCode}`)

          // 添加log语句，保持与原代码相同的分号风格
          body[0].insertBefore(
            t.cloneNode({
              ...logStatement,
              trailingComments: hasSemicolon ? [t.createComment(';')] : [],
            }),
          )
        } else {
          // 空函数体直接添加
          path.get('body').pushContainer('body', logStatement)
        }
      } else {
        // 处理简写箭头函数（如：() => value）
        const block = t.blockStatement([
          logStatement,
          t.returnStatement(path.node.body),
        ])
        path.get('body').replaceWith(block)
      }

      modified = true // 标记文件已被修改
    }

    /**
     * 获取函数名称
     * @param {Object} path AST节点路径
     * @returns {string|null} 函数名或null
     */
    function getFunctionName(path) {
      // 函数声明
      if (t.isFunctionDeclaration(path.node)) {
        return path.node.id?.name
      }
      // 变量声明的函数表达式
      if (t.isVariableDeclarator(path.parent)) {
        return path.parent.id?.name
      }
      // 类方法
      if (t.isClassMethod(path.node)) {
        return path.node.key.name
      }
      return null
    }

    // 如果文件被修改过，生成新代码并写回文件
    if (modified) {
      const output = generate(ast, {
        retainLines: true, // 保持原行号
        retainFunctionParens: true, // 保持函数括号
        comments: true, // 保留注释
        compact: false, // 不压缩代码
        concise: false, // 不使用简洁模式
        jsescOption: {
          minimal: true, // 最小化转义
          quotes: 'double',
        },
      })
        .code.replace(/;(\s*)$/gm, '$1') // 移除行尾分号
        .replace(/;(\s*[)}\],])/g, '$1') // 移除结构后的分号

      await fs.writeFile(filePath, output, 'utf-8')
    }
  } catch (error) {
    // console.error(`处理文件 ${filePath} 出错:`, error)
  }
}

/**
 * 递归处理目录下的所有TS文件
 * @param {string} dirPath 目录路径
 */
async function processDirectory(dirPath) {
  const files = await fs.readdir(dirPath)
  for (const file of files) {
    const fullPath = path.join(dirPath, file)
    const stat = await fs.stat(fullPath)

    if (stat.isDirectory()) {
      // 如果是目录则递归处理
      await processDirectory(fullPath)
    } else if (file.endsWith('.ts')) {
      // 如果是TS文件则处理
      await processFile(fullPath)
    }
  }
}

// 主执行入口：从配置的目标目录开始处理
processDirectory(TARGET_DIR).then(() => {
  //   console.log('函数日志添加完成')
})
