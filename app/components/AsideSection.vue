<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <div class="hidden lg:flex flex-col gap-3">
    <div class="text-sm font-semibold flex items-center gap-1.5">
      <slot name="title">
        {{ title }}
      </slot>
    </div>
    <slot name="default" />
  </div>
</template>

<style scoped>

</style>
