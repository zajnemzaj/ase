<template>
  <svg
    :viewBox="`${-frameRadius} ${-frameRadius} ${frameRadius * 2} ${frameRadius * 2}`"
    class="target-face"
    role="img"
    :aria-label="label"
  >
    <!-- Outline of the 40 cm face for comparing sizes -->
    <circle
      :r="frameRadius"
      fill="none"
      stroke="currentColor"
      stroke-opacity="0.25"
      :stroke-width="frameRadius / 200"
      stroke-dasharray="4 4"
    />
    <circle
      v-for="(ring, i) in rings"
      :key="i"
      :r="ring.radius"
      :fill="ring.fill"
      :stroke="ring.stroke"
      :stroke-width="lineWidth"
    />
    <path
      :d="`M ${-cross} 0 H ${cross} M 0 ${-cross} V ${cross}`"
      stroke="#000"
      :stroke-width="lineWidth"
    />
    <circle
      v-for="(arrow, i) in arrows"
      :key="`a${i}`"
      :cx="arrow.x"
      :cy="-arrow.y"
      :r="arrowRadius"
      class="arrow"
      :stroke-width="arrowRadius / 3"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { FULL_FACE_RADIUS, type Arrow } from '@/simulation/equalify';
import { faceRings } from '@/simulation/targetFace';

const props = withDefaults(
  defineProps<{
    faceRadius: number;
    arrows?: Arrow[];
    // Radius shown by the whole picture, so faces of different sizes compare
    frameRadius?: number;
    label?: string;
  }>(),
  { arrows: () => [], frameRadius: FULL_FACE_RADIUS },
);

const rings = computed(() => faceRings(props.faceRadius));
// Lines stay visible on small faces but don't swamp large ones
const lineWidth = computed(() => Math.max(props.faceRadius / 250, props.frameRadius / 600));
const cross = computed(() => props.faceRadius / 100);
const arrowRadius = computed(() => props.frameRadius / 140);
</script>

<style scoped lang="scss">
.target-face {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1;
}

.arrow {
  fill: #2e7d32;
  stroke: #fff;
}
</style>
