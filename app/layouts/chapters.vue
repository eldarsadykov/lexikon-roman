<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { de } from '@nuxt/ui/locale'
import type { TreeItem } from '@nuxt/ui'

const colorMode = useColorMode()

const items = ref<TreeItem[]>([
  {
    id: 'system',
    label: de.messages.colorMode.system,
    icon: 'i-lucide-monitor'
  },
  {
    id: 'light',
    label: de.messages.colorMode.light,
    icon: 'i-lucide-sun'
  },
  {
    id: 'dark',
    label: de.messages.colorMode.dark,
    icon: 'i-lucide-moon'
  }
])

const colorModeSelection = computed({
  get: () => {
    switch (colorMode.preference) {
      case 'light':
        return items.value[1]
      case 'dark':
        return items.value[2]
      default:
        return items.value[0]
    }
  },
  set: value => colorMode.preference = value?.id
})

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
        <!-- Title classes from UPageLinks -->
        <div class="hidden lg:flex flex-col gap-3 mt-8">
          <div class="text-sm font-semibold flex items-center gap-1.5">
            {{ de.messages.contentSearch.theme }}
          </div>
          <UTree
            v-model="colorModeSelection"
            :items="items"
            color="neutral"
          />
        </div>
      </template>
    </UPage>
  </UContainer>
</template>
