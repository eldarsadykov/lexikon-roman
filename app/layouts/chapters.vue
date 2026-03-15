<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const { t } = useLocale()
const { focusMode } = useFocusMode()
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UPageAside :class="{ invisible: focusMode }">
          <UContentNavigation
            highlight
            default-open
            :navigation="navigation"
          />
        </UPageAside>
      </template>

      <slot />

      <template #right>
        <UPageAside
          :class="{ invisible: focusMode }"
        >
          <div class="flex flex-col gap-6">
            <AsideSection :title="t('contentSearch.theme')">
              <UColorModeSelect />
            </AsideSection>
            <AsideSection :title="t('fontSize.label')">
              <FontSizeSelect />
            </AsideSection>
            <AsideSection :title="t('audio.label')">
              <ClientOnly><AudioControls /></ClientOnly>
            </AsideSection>
          </div>
        </UPageAside>
      </template>
    </UPage>
  </UContainer>
</template>
