<script setup lang="ts">
const items = ref(['System', 'Light', 'Dark'])
const value = ref('System')
</script>

<template>
  <URadioGroup
    v-model="value"
    :items="items"
  />
</template>
