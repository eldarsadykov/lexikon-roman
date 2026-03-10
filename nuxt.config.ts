// https://nuxt.com/docs/api/configuration/nuxt-config

import routeRules from './pug-to-md/generated/route-rules'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    'nuxt-og-image',
    'nuxt-llms',
    '@vite-pwa/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: 'https://lexikonroman.at',
    name: 'Lexikon-Roman'
  },

  content: {
    build: {
      markdown: {
        toc: {
          searchDepth: 1
        }
      }
    }
  },

  runtimeConfig: {
    public: {
      freesoundApiToken: process.env.NUXT_PUBLIC_FREESOUND_API_TOKEN
    }
  },

  experimental: {
    asyncContext: true
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    routeRules,
    prerender: {
      routes: [
        '/'
      ],
      crawlLinks: true,
      autoSubfolderIndex: false
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  icon: {
    clientBundle: {
      scan: true
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Lexikon-Roman',
      short_name: 'Lexikon-Roman',
      description: 'Lexikon einer sentimentalen Reise zum Exporteurtreffen in Druden – Roman',
      lang: 'de',
      theme_color: '#ffffff',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      navigateFallback: null
    }
  },

  llms: {
    domain: 'https://lexikonroman.at/',
    title: 'Lexikon Roman',
    description: 'Lexikon Roman content.',
    sections: [
      {
        title: 'Chapters',
        contentCollection: 'chapters'
      },
      {
        title: 'Landing',
        contentCollection: 'landing'
      }
    ]
  }
})
