<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { de } from '@nuxt/ui/locale'

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
          <!-- Title classes from UPageLinks -->
          <div class="flex flex-col gap-3">
            <div class="text-sm font-semibold flex items-center gap-1.5">
              {{ de.messages.contentSearch.theme }}
            </div>
            <UColorModeSelect />
          </div>
        </UPageAside>
      </template>
    </UPage>
  </UContainer>
</template>
