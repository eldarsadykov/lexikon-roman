<script setup lang="ts">
definePageMeta({
  layout: 'chapters'
})

const route = useRoute()

const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('pages').path(route.path).first()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: false })
}

const title = page.value.title
useSeoMeta({ title, ogTitle: title })
const { fontSizeClass } = useFontSize()
</script>

<template>
  <UPage v-if="page">
    <UPageHeader :title="page.title" />
    <UPageBody>
      <ContentRenderer
        :value="page"
        :class="['lexikon-roman-artikel', fontSizeClass]"
      />
    </UPageBody>
  </UPage>
</template>
