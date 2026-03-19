<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import type { NavigationMenuItem } from '@nuxt/ui'
import HeaderControlsSection from '~/components/HeaderControlsSection.vue'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const { header } = useAppConfig()

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [{
  label: 'Lesen',
  to: `/artikel/gebrauchsanweisung`,
  active: route.path.startsWith(`/artikel`)
}, {
  label: 'Über',
  to: '/ueber',
  active: route.path.startsWith('/ueber')
}])
</script>

<template>
  <UHeader
    :ui="{ root: 'static lg:sticky' }"
    :to="header?.to || '/'"
  >
    <UNavigationMenu
      :items="items"
      variant="link"
    />
    <template
      v-if="header?.logo?.dark || header?.logo?.light || header?.title"
      #title
    >
      <UColorModeImage
        v-if="header?.logo?.dark || header?.logo?.light"
        :light="header?.logo?.light!"
        :dark="header?.logo?.dark!"
        :alt="header?.logo?.alt"
        class="h-6 w-auto shrink-0"
      />

      <span v-else-if="header?.title">
        {{ header.title }}
      </span>
    </template>

    <template
      v-else
      #left
    >
      <NuxtLink :to="header?.to || '/'">
        <AppLogo class="w-auto h-6 shrink-0" />
      </NuxtLink>

      <TemplateMenu />
    </template>

    <template #right>
      <UContentSearchButton
        v-if="header?.search"
      />

      <UColorModeButton v-if="header?.colorMode" />

      <template v-if="header?.links">
        <UButton
          v-for="(link, index) of header.links"
          :key="index"
          v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
        />
      </template>
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />
      <USeparator
        class="my-4"
        type="dashed"
      />
      <div class="flex gap-3">
        <UColorModeSelect />
        <FontSizeSelect />
      </div>
      <USeparator
        class="my-4"
        type="dashed"
      />
      <HeaderControlsSection title="Audio">
        <AudioControls />
      </HeaderControlsSection>
      <USeparator
        class="my-4"
        type="dashed"
      />
      <UContentNavigation
        highlight
        default-open
        :navigation="navigation"
      />
    </template>
  </UHeader>
</template>
