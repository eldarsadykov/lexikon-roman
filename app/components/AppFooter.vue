<script setup lang="ts">
const { footer } = useAppConfig()
</script>

<template>
  <UFooter>
    <template #left>
      <NuxtLink
        to="https://github.com/eldarsadykov/lexikon-roman/blob/main/LICENSE"
        target="_blank"
        class="text-sm text-muted"
      >
        Veröffentlicht unter <span class="text-highlighted">MIT-Lizenz</span>
      </NuxtLink>
    </template>
    <template #right>
      <UColorModeButton v-if="footer?.colorMode" />

      <template v-if="footer?.links">
        <UButton
          v-for="(link, index) of footer?.links"
          :key="index"
          v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
        />
      </template>
    </template>
  </UFooter>
</template>
