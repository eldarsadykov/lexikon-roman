<script setup lang="ts">
import de from '~/locales/de'

const { seo } = useAppConfig()

const { focusMode } = useFocusMode()

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('chapters'))
const { data: files } = useLazyAsyncData('search', () => queryCollectionSearchSections('chapters'), {
  server: false
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
    { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' }
  ],
  htmlAttrs: {
    lang: 'de'
  }
})

useSeoMeta({
  titleTemplate: `%s - ${seo?.siteName}`,
  ogSiteName: seo?.siteName,
  twitterCard: 'summary_large_image'
})

provide('navigation', navigation)

// if (import.meta.client) {
//   useChapterAudio()
// }

useFaviconFromTheme()
</script>

<template>
  <UApp :locale="de">
    <NuxtLoadingIndicator />

    <AppHeader :class="{ invisible: focusMode }" />

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <AppFooter :class="{ invisible: focusMode }" />

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
      />
    </ClientOnly>

    <UButton
      class="fixed bottom-6 right-6 z-50 hidden lg:flex"
      color="neutral"
      variant="subtle"
      :icon="focusMode ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
      :aria-label="focusMode ? 'Vollbild beenden' : 'Vollbild'"
      @click="focusMode = !focusMode"
    />
  </UApp>
</template>
