<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UPageAside>
          <UContentNavigation
            highlight
            :navigation="navigation"
          />
        </UPageAside>
      </template>

      <slot />

      <template #right>
        <UPageAside>
          <UColorModeSelect />
        </UPageAside>
      </template>
    </UPage>
  </UContainer>
</template>
