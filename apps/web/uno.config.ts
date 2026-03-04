import { presetAntdTailwind4 } from '@antdv-next/unocss'
import presetWebFonts from '@unocss/preset-web-fonts'
import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'
import { defineConfig, presetIcons, presetWind4 } from 'unocss'

export default defineConfig({
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|[jt]s|vine.ts|mdx?|astro|elm|php|phtml|html)($|\?)/
      ],
      exclude: [/node_modules/]
    }
  },
  presets: [
    presetWind4(),
    presetAntdTailwind4({
      prefix: 'a',
      antPrefix: 'ant'
    }),
    presetIcons({
      scale: 1.2,
      warn: true
    }),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono'
      },
      processors: createLocalFontProcessor({
        cacheDir: 'node_modules/.cache/unocss/fonts',
        fontAssetsDir: 'public/fonts',
        fontServeBaseUrl: '/fonts'
      })
    })
  ]
})
