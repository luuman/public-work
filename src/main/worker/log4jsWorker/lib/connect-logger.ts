/* eslint no-underscore-dangle: ["error", { "allow": ["__statusCode", "_remoteAddress", "__headers", "_logging"] }] */

import { IncomingMessage, ServerResponse } from 'http'
import Level from './levels'
import log4js from 'log4js'

const DEFAULT_FORMAT =
  ':remote-addr - - ":method :url HTTP/:http-version" :status :content-length ":referrer" ":user-agent"'

interface Token {
  token: string | RegExp
  replacement: string | ((...args: any[]) => string)
}

interface StatusRule {
  from?: number
  to?: number
  codes?: number[]
  level: keyof typeof Level | Level
}

interface LoggerOptions {
  format?:
    | string
    | ((
        req: IncomingMessage,
        res: ServerResponse,
        formatter: (str: string) => string,
      ) => string)
  level?: keyof typeof Level | Level | 'auto'
  nolog?:
    | string
    | RegExp
    | Array<string | RegExp>
    | ((req: IncomingMessage, res: ServerResponse) => boolean)
  statusRules?: StatusRule[]
  tokens?: Token[]
  context?: boolean
}

/**
 * 获取请求 URL
 */
function getUrl(req: IncomingMessage): string {
  return (req as any).originalUrl || req.url || ''
}

/**
 * 合并默认 token 和自定义 token
 */
function assembleTokens(
  req: IncomingMessage,
  res: ServerResponse,
  customTokens: Token[] = [],
): Token[] {
  const arrayUniqueTokens = (array: Token[]): Token[] => {
    const a = array.concat()
    for (let i = 0; i < a.length; ++i) {
      for (let j = i + 1; j < a.length; ++j) {
        if (a[i].token == a[j].token) {
          a.splice(j--, 1)
        }
      }
    }
    return a
  }

  const defaultTokens: Token[] = [
    { token: ':url', replacement: getUrl(req) },
    { token: ':protocol', replacement: (req as any).protocol },
    { token: ':hostname', replacement: (req as any).hostname },
    { token: ':method', replacement: req.method || '' },
    {
      token: ':status',
      replacement: (res as any).__statusCode || res.statusCode,
    },
    { token: ':response-time', replacement: (res as any).responseTime },
    { token: ':date', replacement: new Date().toUTCString() },
    {
      token: ':referrer',
      replacement: req.headers.referer || req.headers.referrer || '',
    },
    {
      token: ':http-version',
      replacement: `${req.httpVersionMajor}.${req.httpVersionMinor}`,
    },
    {
      token: ':remote-addr',
      replacement:
        req.headers['x-forwarded-for'] ||
        (req as any).ip ||
        (req as any)._remoteAddress ||
        (req.socket &&
          (req.socket.remoteAddress ||
            (req.socket as any).socket?.remoteAddress)),
    },
    { token: ':user-agent', replacement: req.headers['user-agent'] || '' },
    {
      token: ':content-length',
      replacement:
        res.getHeader('content-length') ||
        ((res as any).__headers && (res as any).__headers['Content-Length']) ||
        '-',
    },
    {
      token: /:req\[([^\]]+)]/g,
      replacement: (_, field: string) => req.headers[field.toLowerCase()] || '',
    },
    {
      token: /:res\[([^\]]+)]/g,
      replacement: (_, field: string) =>
        res.getHeader(field.toLowerCase()) ||
        ((res as any).__headers && (res as any).__headers[field]),
    },
  ]

  return arrayUniqueTokens(customTokens.concat(defaultTokens))
}

/**
 * 格式化日志字符串
 */
function format(str: string, tokens: Token[]): string {
  for (const t of tokens) {
    str = str.replace(t.token, t.replacement as string)
  }
  return str
}

/**
 * 创建 no-log 条件
 */
function createNoLogCondition(
  nolog?: string | RegExp | Array<string | RegExp>,
): RegExp | null {
  if (!nolog) return null
  if (nolog instanceof RegExp) return nolog
  if (typeof nolog === 'string') return new RegExp(nolog)
  if (Array.isArray(nolog))
    return new RegExp(
      nolog.map((r) => (r instanceof RegExp ? r.source : r)).join('|'),
    )
  return null
}

/**
 * 匹配状态码规则
 */
function matchRules(
  statusCode: number,
  currentLevel: Level,
  ruleSet?: StatusRule[],
): Level {
  let level = currentLevel

  if (ruleSet) {
    const matchedRule = ruleSet.find((rule) => {
      if (rule.from !== undefined && rule.to !== undefined) {
        return statusCode >= rule.from && statusCode <= rule.to
      }
      if (rule.codes) {
        return rule.codes.includes(statusCode)
      }
      return false
    })

    if (matchedRule) {
      level = Level.getLevel(matchedRule.level, level)
    }
  }

  return level
}

/**
 * HTTP Logger 中间件
 */
export default function getLogger(
  logger4js: log4js.Logger,
  options: LoggerOptions = {},
) {
  if (typeof options === 'string' || typeof options === 'function') {
    options = { format: options } as LoggerOptions
  }

  const thisLogger = logger4js
  let level = Level.getLevel(options.level, Level.INFO)
  const fmt = options.format || DEFAULT_FORMAT

  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if ((req as any)._logging !== undefined) return next()

    // nolog
    if (typeof options.nolog !== 'function') {
      const nolog = createNoLogCondition(options.nolog)
      if (nolog && nolog.test((req as any).originalUrl)) return next()
    }

    if (thisLogger.isLevelEnabled(level) || options.level === 'auto') {
      const start = Date.now()
      const writeHead = res.writeHead.bind(res)

      ;(req as any)._logging = true

      // 拦截 writeHead
      res.writeHead = (code: number, headers?: any) => {
        res.writeHead = writeHead
        res.writeHead(code, headers)
        ;(res as any).__statusCode = code
        ;(res as any).__headers = headers || {}
      }

      let finished = false
      const handler = () => {
        if (finished) return
        finished = true

        if (
          typeof options.nolog === 'function' &&
          options.nolog(req, res) === true
        ) {
          ;(req as any)._logging = false
          return
        }

        ;(res as any).responseTime = Date.now() - start

        if (res.statusCode && options.level === 'auto') {
          level = Level.INFO
          if (res.statusCode >= 300) level = Level.WARN
          if (res.statusCode >= 400) level = Level.ERROR
        }

        level = matchRules(res.statusCode || 0, level, options.statusRules)

        const combinedTokens = assembleTokens(req, res, options.tokens || [])

        if (options.context) (thisLogger as any).addContext('res', res)
        if (typeof fmt === 'function') {
          const line = fmt(req, res, (str) => format(str, combinedTokens))
          if (line) (thisLogger as any).logger(level, line)
        } else {
          ;(thisLogger as any).logger(level, format(fmt, combinedTokens))
        }
        if (options.context) (thisLogger as any).removeContext('res')
      }

      res.on('end', handler)
      res.on('finish', handler)
      res.on('error', handler)
      res.on('close', handler)
    }

    return next()
  }
}
