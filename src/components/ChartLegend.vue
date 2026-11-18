<template>
  <div class="row justify-center q-gutter-x-md q-mt-sm text-caption">
    <div v-for="item in items" :key="item.label" class="row items-center no-wrap">
      <span class="swatch" :style="{ background: item.color }" />
      {{ item.label }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ items: { color: string; label: string }[] }>();
</script>

<style scoped>
.swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 4px;
}
</style>
