<script setup lang="ts">
import { fontSizeItems } from '~/composables/useFontSize'

const { fontSize } = useFontSize()
</script>

<template>
  <USelect
    v-model="fontSize"
    icon="i-lucide-a-large-small"
    :items="fontSizeItems"
  />
</template>
