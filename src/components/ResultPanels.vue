<template>
  <q-card flat bordered class="overflow-hidden">
    <!-- Sheet tabs on top, like the sheets of a spreadsheet -->
    <q-tabs
      v-model="slide"
      dense
      no-caps
      inline-label
      align="left"
      outside-arrows
      mobile-arrows
      indicator-color="transparent"
      active-class="sheet-tab--active"
      class="sheet-tabs"
    >
      <q-tab v-for="tab in tabs" :key="tab.name" :name="tab.name" class="sheet-tab">
        <span v-if="tab.color" class="color-dot" :style="{ background: tab.color }" />
        <q-icon v-else :name="tab.icon" size="18px" class="q-mr-xs" />
        <span class="ellipsis sheet-tab__label">{{ tab.label }}</span>
      </q-tab>
    </q-tabs>

    <q-carousel
      v-model="slide"
      swipeable
      animated
      transition-prev="slide-right"
      transition-next="slide-left"
      :height="undefined"
      class="result-carousel"
    >
      <q-carousel-slide
        v-for="item in faceSlides"
        :key="item.name"
        :name="item.name"
        class="column no-wrap items-center q-pa-md"
      >
        <div class="text-subtitle1 text-weight-medium text-center">
          <span class="color-dot" :style="{ background: item.color }" />
          {{ item.title }}
        </div>
        <div class="text-body2 text-grey-8 text-center q-mb-sm">
          {{ $t('score') }}: {{ item.score }} · {{ $t('faceRadius') }}:
          {{ $t('mm', { value: item.faceRadius }) }}
        </div>
        <div class="face-wrap">
          <TargetFace :face-radius="item.faceRadius" :arrows="item.arrows" :label="item.title" />
        </div>
        <div
          v-if="item.groupingRadius !== null"
          class="text-caption text-grey-7 text-center q-mt-sm"
        >
          {{ $t('arrowsShown', { n: item.arrows.length, radius: item.groupingRadius }) }}
        </div>
      </q-carousel-slide>

      <q-carousel-slide name="chart-grouping" class="column no-wrap q-pa-md">
        <div class="text-subtitle1 text-weight-medium text-center">
          {{ $t('chartGroupingTitle') }}
        </div>
        <div class="text-caption text-grey-7 text-center q-mb-sm">
          {{ $t('chartGroupingText') }}
        </div>
        <ScoreChart
          :series="groupingSeries"
          :x-max="FULL_FACE_RADIUS"
          :x-label="$t('chartAxisGrouping')"
          :y-label="$t('chartAxisScore')"
        />
        <ChartLegend :items="legend" />
      </q-carousel-slide>

      <q-carousel-slide
        v-if="faceSeries.length > 0"
        name="chart-face"
        class="column no-wrap q-pa-md"
      >
        <div class="text-subtitle1 text-weight-medium text-center">
          {{ $t('chartFaceTitle') }}
        </div>
        <div class="text-caption text-grey-7 text-center q-mb-sm">
          {{ $t('chartFaceText', { score: store.results?.minScore }) }}
        </div>
        <ScoreChart
          :series="faceSeries"
          :x-max="FULL_FACE_RADIUS"
          :x-label="$t('chartAxisFace')"
          :y-label="$t('chartAxisScore')"
        />
        <ChartLegend :items="legend.filter((l) => !l.reference)" />
      </q-carousel-slide>
    </q-carousel>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import ChartLegend from '@/components/ChartLegend.vue';
import ScoreChart, { type ChartSeries } from '@/components/ScoreChart.vue';
import TargetFace from '@/components/TargetFace.vue';
import { FULL_FACE_RADIUS } from '@/simulation/equalify';
import { useArcherStore } from '@/stores/archers';
import { archerColor } from '@/utils/archerColors';

const store = useArcherStore();
const { t } = useI18n();

// Calculated archers with their place in the full list, for numbers and colors
const items = computed(() =>
  store.calculatedArchers.map((archer) => {
    const index = store.archers.indexOf(archer);
    const result = store.resultOf(archer.id)!;
    return {
      archer,
      result,
      color: archerColor(index),
      title: archer.name.trim() || t('archer', { n: index + 1 }),
      reference: archer.score === store.results?.minScore,
    };
  }),
);

const faceSlides = computed(() =>
  items.value
    .map((item) => ({
      name: `face-${item.archer.id}`,
      label: item.title,
      title: t('faceOf', { name: item.title }),
      color: item.color,
      score: item.archer.score,
      faceRadius: store.faceRadiusOf(item.archer),
      groupingRadius: item.result.groupingRadius,
      arrows: item.result.arrows,
    }))
    .filter((slide): slide is typeof slide & { faceRadius: number } => slide.faceRadius !== null),
);

const groupingSeries = computed<ChartSeries[]>(() => {
  const points = store.results?.groupingPoints ?? [];
  // The curve is shared, every archer highlights their own score on it
  return items.value.map((item) => ({
    points,
    color: item.color,
    targetScore: item.archer.score!,
    radius: item.result.groupingRadius,
  }));
});

const faceSeries = computed<ChartSeries[]>(() =>
  items.value
    .filter((item) => !item.reference && item.result.facePoints.length > 0)
    .map((item) => ({
      points: item.result.facePoints,
      color: item.color,
      targetScore: store.results!.minScore,
      radius: item.result.faceRadius,
    })),
);

const legend = computed(() =>
  items.value.map((item) => ({
    color: item.color,
    label: `${item.title} (${item.archer.score})`,
    reference: item.reference,
  })),
);

interface Tab {
  name: string;
  label: string;
  color?: string;
  icon?: string;
}

const tabs = computed<Tab[]>(() => [
  ...faceSlides.value.map((s) => ({ name: s.name, label: s.label, color: s.color })),
  { name: 'chart-grouping', label: t('tabGrouping'), icon: 'scatter_plot' },
  ...(faceSeries.value.length > 0
    ? [{ name: 'chart-face', label: t('tabFaceSize'), icon: 'show_chart' }]
    : []),
]);
const slideNames = computed(() => tabs.value.map((tab) => tab.name));

const slide = ref(slideNames.value[0]!);

// Stay on a slide that still exists after archers change
watch(slideNames, (names) => {
  if (!names.includes(slide.value)) slide.value = names[0]!;
});
</script>

<style scoped lang="scss">
.sheet-tabs {
  background: #eef1f0;
  padding: 6px 4px 0;
}

.sheet-tab {
  min-height: 36px;
  margin-right: 2px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  color: #5f6b69;
}

// The active sheet is the panel's color, so it flows into the panel without a line
.sheet-tab--active {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.12);
  color: $primary;
  font-weight: 500;
}

.sheet-tab__label {
  max-width: 120px;
}

.result-carousel {
  height: auto;
  min-height: 0;
}

.face-wrap {
  width: 100%;
  max-width: 420px;
}

.color-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}
</style>
