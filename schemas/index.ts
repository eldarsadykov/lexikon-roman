import { z } from 'zod'
import { slugs } from './slugs'

export const ChapterLinkSchema = z.object({
  to: z.enum(slugs),
  mainRoute: z.boolean()
})

export const ChapterMetaSchema = z.object({
  title: z.string(),
  slug: z.string(),
  index: z.number().min(0).max(slugs.length),
  articleIndex: z.number().int().min(1),
  articlesCount: z.number(),
  titleEndsWithPeriod: z.boolean(),
  links: z.array(ChapterLinkSchema)
})

export type ChapterLink = z.infer<typeof ChapterLinkSchema>
export type ChapterMeta = z.infer<typeof ChapterMetaSchema>
