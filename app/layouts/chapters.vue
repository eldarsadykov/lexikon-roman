<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const { t } = useLocale()
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
        <UPageAside :ui="{ root: 'lg:pe-0' }">
          <div class="flex flex-col gap-6">
            <AsideSection :title="t('contentSearch.theme')">
              <UColorModeSelect />
            </AsideSection>
          </div>
        </UPageAside>
      </template>
    </UPage>
  </UContainer>
</template>
