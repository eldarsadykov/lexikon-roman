<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { findPageHeadline } from '@nuxt/content/utils'

definePageMeta({
  layout: 'chapters'
})

const route = useRoute()
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const { data: page } = await useAsyncData(route.path, async () => {
  const directPage = await queryCollection('chapters').path(route.path).first()
  if (directPage) return directPage

  const segments = route.path.split('/').filter(Boolean)
  if (segments.length > 1) {
    const fallbackPath = `/${segments.at(-1)}`
    return queryCollection('chapters').path(fallbackPath).first()
  }

  return null
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: surround } = await useAsyncData(`${route.path}-surround`, () => {
  return queryCollectionItemSurroundings('chapters', route.path, {
    fields: ['description']
  })
})

const title = page.value.seo?.title || page.value.title
const description = page.value.seo?.description || page.value.description

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

const headline = computed(() => findPageHeadline(navigation?.value, page.value?.path))

defineOgImageComponent('LexikonRoman', {
  title,
  description,
  headline: headline.value || 'Lexikon-Roman'
})

const pageNumber = computed({
  get: () => page.value?.articleIndex,
  set: async (index: number) => {
    await navigateTo(`${index.toString().padStart(2, '0')}`)
  }
})

const articleId = computed(() => {
  if (!page.value) return ''
  const slug = page.value.slug ?? ''
  const number = page.value.articlesCount > 1 ? '-' + page.value.articleIndex : ''
  return slug + number
})
</script>

<template>
  <UPage v-if="page">
    <UPageHeader :title="page.title">
      <template
        v-if="page.articlesCount > 1"
        #links
      >
        <UPagination
          v-model:page="pageNumber"
          :items-per-page="1"
          :total="page.articlesCount"
          variant="ghost"
          active-variant="ghost"
        />
      </template>
    </UPageHeader>

    <UPageBody>
      <ContentRenderer
        v-if="page"
        :id="articleId"
        tag="article"
        :value="page"
        class="lexikon-roman-kapitel"
      />

      <USeparator v-if="surround?.length" />

      <UContentSurround :surround="surround" />
    </UPageBody>
  </UPage>
</template>
