<script setup lang="ts">
type ColorModePreference = 'system' | 'light' | 'dark'

type ColorModeTreeItem = {
  id: ColorModePreference
  label: string
  icon: string
}

const colorMode = useColorMode()
const appConfig = useAppConfig()
const { t } = useLocale()

const items = ref<ColorModeTreeItem[]>([
  {
    id: 'system',
    label: t('colorMode.system'),
    icon: appConfig.ui.icons.system
  },
  {
    id: 'light',
    label: t('colorMode.light'),
    icon: appConfig.ui.icons.light
  },
  {
    id: 'dark',
    label: t('colorMode.dark'),
    icon: appConfig.ui.icons.dark
  }
])

const colorModeSelection = computed({
  get: () => {
    return items.value.find(option => option.id === colorMode.preference as ColorModePreference)
  },
  set: value => colorMode.preference = value!.id
})
</script>

<template>
  <!-- Title classes from UPageLinks -->
  <div class="hidden lg:flex flex-col gap-3 mt-8">
    <div class="text-sm font-semibold flex items-center gap-1.5">
      {{ t('contentSearch.theme') }}
    </div>
    <UTree
      v-model="colorModeSelection"
      :items="items"
      color="neutral"
    />
  </div>
</template>
