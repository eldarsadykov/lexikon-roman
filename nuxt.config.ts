// https://nuxt.com/docs/api/configuration/nuxt-config

import routeRules from './pug-to-md/generated/route-rules'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    'nuxt-og-image',
    'nuxt-llms'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  content: {
    build: {
      markdown: {
        toc: {
          searchDepth: 1
        }
      }
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
    provider: 'server'
  },

  llms: {
    domain: 'https://lexikon-roman.vercel.app/',
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
