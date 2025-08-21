import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
// import autoprefixer from 'autoprefixer'
// import tailwind from 'tailwindcss'
import vueDevTools from 'vite-plugin-vue-devtools'
// import svgLoader from 'vite-svg-loader'
// import monacoEditorPlugin from 'vite-plugin-monaco-editor-esm'
import path from 'node:path'
// import path from 'path';
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ['mermaid', 'dompurify'],
      }),
    ],
    define: {
      __DEV__: process.env.NODE_ENV === 'development',
    },
    resolve: {
      alias: {
        '@': resolve('src/main/'),
        '@shared': resolve('src/shared'),
      },
    },
    build: {
      minify: isDev ? false : 'terser',
      terserOptions: {
        compress: {
          drop_console: !isDev,
          drop_debugger: !isDev,
        },
      },
      rollupOptions: {
        input: {
          index: resolve('src/main/index.ts'),
          fibonacciWorker: resolve('src/main/worker/fibonacciWorker.ts'),
          logWorker: resolve('src/main/worker/logWorker.ts'),
          log4jsWorker: resolve('src/main/worker/log4jsWorker/index.ts'),
        },
        output: {
          entryFileNames: (chunk) => {
            if (
              chunk.name === 'fibonacciWorker' ||
              chunk.name === 'logWorker' ||
              chunk.name === 'log4jsWorker'
            ) {
              return 'worker/[name].js'
            }
            return '[name].js'
          },
        },
        external: ['file-type', 'sharp', 'pdf-parse-new'],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
      },
    },
    build: {
      minify: isDev ? false : 'terser',
      terserOptions: {
        compress: {
          drop_console: !isDev,
          drop_debugger: !isDev,
        },
      },
      rollupOptions: {
        input: {
          index: resolve('src/preload/index.ts'),
          // floating: resolve('src/preload/floating-preload.ts'),
        },
      },
    },
  },
  renderer: {
    optimizeDeps: {
      include: ['monaco-editor', 'axios'],
    },
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@shell': resolve('src/renderer/shell'),
        '@shared': resolve('src/shared'),
        vue: 'vue/dist/vue.esm-bundler.js',
      },
    },
    css: {
      postcss: {
        // @ts-ignore
        // plugins: [tailwind(), autoprefixer()]
      },
    },
    server: {
      host: '0.0.0.0', // 防止代理干扰，导致vite-electron之间ws://localhost:5713和http://localhost:5713通信失败、页面组件无法加载
    },
    plugins: [
      // monacoEditorPlugin({
      //   languageWorkers: ['editorWorkerService', 'typescript', 'css', 'html', 'json'],
      //   customDistPath(_root, buildOutDir, _base) {
      //     return path.resolve(buildOutDir, 'monacoeditorwork')
      //   }
      // }),
      // svgLoader(),
      createSvgIconsPlugin({
        // 存放 SVG 的目录
        iconDirs: [
          path.resolve(process.cwd(), 'src/renderer/src/assets/icons'),
        ],
        // symbolId 格式：icon-文件名
        symbolId: 'icon-[name]',
      }),
      vueDevTools({}),
      vue(),
    ],
    build: {
      minify: 'esbuild',
      rollupOptions: {
        input: {
          // shell: resolve('src/renderer/shell/index.html'),
          index: resolve('src/renderer/index.html'),
          // floating: resolve('src/renderer/floating/index.html')
        },
      },
    },
  },
})
