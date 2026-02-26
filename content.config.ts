import { defineContentConfig, defineCollection } from '@nuxt/content'
import { ChapterMetaSchema } from './schemas'

export default defineContentConfig({
  collections: {
    landing: defineCollection({
      type: 'page',
      source: 'index.md'
    }),
    chapters: defineCollection({
      type: 'page',
      source: {
        include: '**',
        exclude: ['index.md']
      },
      schema: ChapterMetaSchema
    })
  }
})
