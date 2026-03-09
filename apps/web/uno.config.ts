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
      scale: 1.3,
      warn: true,
      collections: {
        'twemoji': () => import('@iconify-json/twemoji/icons.json').then(m => m.default as any),
        'streamline-emojis': () => import('@iconify-json/streamline-emojis/icons.json').then(m => m.default as any),
        'carbon': () => import('@iconify-json/carbon/icons.json').then(m => m.default as any),
        'iconParkSolid': () => import('@iconify-json/icon-park-solid/icons.json').then(m => m.default as any)
      }
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
