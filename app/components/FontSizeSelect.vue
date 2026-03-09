<script setup lang="ts">
const { fontSize, fontSizeItems } = useFontSize()
</script>

<template>
  <USelect
    v-model="fontSize"
    icon="i-lucide-a-large-small"
    :items="fontSizeItems"
  />
</template>
