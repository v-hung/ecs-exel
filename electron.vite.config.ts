import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

import Icons from 'unplugin-icons/vite'
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      react(),
      AutoImport({
        dts: 'src/types/components.d.ts',
        resolvers: [
          IconsResolver({
            // prefix: false,
            extension: 'jsx'
          })
        ]
      }),
      Icons({
        autoInstall: true,
        compiler: 'jsx',
        jsx: 'react',
        iconCustomizer(_, __, props) {
          props.width = '24px'
          props.height = '24px'
        }
      })
    ]
  }
})
