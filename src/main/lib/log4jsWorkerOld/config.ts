import path from 'path'

export const joinSep = ')=> '

export function handleConfig(
  config,
  { appenderNames, categoryNames },
  configDir,
) {
  const appendersConf = config.appenders.main
  const categoryConf = config.categories.main

  for (let index = 0; index < appenderNames.length; index++) {
    const item = appenderNames[index]
    if (item.appenderName) {
      if (item.appenderName === 'cst-meeting-agent') {
        config.appenders[item.appenderName] = {
          ...appendersConf,
          filename: path.join(
            configDir,
            'logs',
            item.filename,
            item.appenderName + '.log',
          ),
          layout: {
            ...appendersConf.layout,
            pattern: `(%d{yyyy-MM-dd hh:mm:ss.SSS}${joinSep}%m`,
          },
        }
      }
      if (item.appenderName === 'msgAllLog') {
        config.appenders[item.appenderName] = {
          ...appendersConf,
          filename: path.join(
            configDir,
            'logs',
            item.filename || '',
            item.appenderName + '.log',
          ),
          maxLogSize: '8M',
          backups: 5,
        }
      } else {
        config.appenders[item.appenderName] = {
          ...appendersConf,
          filename: path.join(
            configDir,
            'logs',
            item.filename || '',
            item.appenderName + '.log',
          ),
        }
      }
      config.categories[item.appenderName] = {
        ...categoryConf,
        appenders: [item.appenderName],
        enableCallStack: true,
      }
    }
  }

  for (let index = 0; index < categoryNames.length; index++) {
    const item = categoryNames[index]
    if (item.categoryName) {
      if (item.appenderName) {
        config.categories[item.categoryName] = {
          ...categoryConf,
          appenders: [item.appenderName],
        }
      } else {
        config.categories[item.categoryName] = {
          ...categoryConf,
        }
      }
    }
  }
}

export function initLogConfig(defaultUrl, filename = 'main', size, password) {
  return {
    appenders: {
      console: {
        type: 'console', // 控制台输出
        layout: {
          type: 'colored', // 使用color模式让控制台输出分类更加鲜明
        },
      },
      main: {
        type: 'fileSync',
        filename: path.join(defaultUrl, 'logs', filename + '.log'),
        fileNameSep: '.',
        maxLogSize: size || '6M', //  K, M, G
        backups: 2,
        keepFileExt: true,
        // pattern: 'yyyy-MM-dd.log',
        pattern: 'log',
        alwaysIncludePattern: true,
        compress: false,
        layout: {
          type: 'mypattern',
          pattern: `[%d{yyyy-MM-dd hh:mm:ss.SSS}] (%p${joinSep}%m [%f{1}:%l]`,
          password: password,
        },
      },
    },
    categories: {
      default: { appenders: ['main'], level: 'all', enableCallStack: true },
      main: { appenders: ['main'], level: 'all', enableCallStack: true },
    },
  }
}

// return a string through input array
// function reverse(xs) {
//   xs = Array.isArray(xs) ? xs : xs.split('')
//   if (xs.length == 0) {
//     return ''
//   } else {
//     return xs.reverse().join('')
//   }
// }
