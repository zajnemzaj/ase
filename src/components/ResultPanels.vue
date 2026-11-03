<template>
  <q-card flat bordered class="overflow-hidden">
    <!-- Sheet tabs on top, like the sheets of a spreadsheet -->
    <q-tabs
      ref="tabsRef"
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
      <q-carousel-slide name="chart-grouping" class="column no-wrap q-pa-md">
        <div class="text-subtitle1 text-weight-medium text-center">
          {{ $t('chartGroupingTitle') }}
        </div>
        <div class="text-caption text-grey-7 text-center q-mb-sm">
          {{ $t('chartGroupingText') }}
        </div>
        <ScoreChart
          :series="groupingSeries"
          :x-max="FULL_FACE_RADIUS * 2"
          :x-scale="2"
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
          :x-max="FULL_FACE_RADIUS * 2"
          :x-scale="2"
          :x-label="$t('chartAxisFace')"
          :y-label="$t('chartAxisScore')"
        />
        <ChartLegend :items="legend.filter((l) => !l.reference)" />
      </q-carousel-slide>

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
          {{ $t('score') }}: {{ item.score }} · {{ $t('grouping') }}:
          {{ $t('mm', { value: item.groupingDiameter }) }}
          <template v-if="item.arrowDiameter !== null">
            · {{ $t('arrowShort') }}: {{ $t('mm', { value: item.arrowDiameter }) }}
          </template>
        </div>
        <div class="face-wrap">
          <TargetFace
            :face-radius="FULL_FACE_RADIUS"
            :arrows="item.arrows"
            :arrow-radius="item.arrowDiameter === null ? undefined : item.arrowDiameter / 2"
            :label="item.title"
          />
        </div>
        <div class="text-caption text-grey-7 text-center q-mt-sm">
          {{
            $t('arrowsShown', {
              rounds: item.rounds,
              diameter: item.groupingDiameter,
              score: item.averageScore,
            })
          }}
        </div>
      </q-carousel-slide>
    </q-carousel>
  </q-card>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from 'vue';
import { useI18n } from 'vue-i18n';

import ChartLegend from '@/components/ChartLegend.vue';
import ScoreChart, { type ChartSeries } from '@/components/ScoreChart.vue';
import TargetFace from '@/components/TargetFace.vue';
import { ARROWS_PER_ROUND, FULL_FACE_RADIUS } from '@/simulation/equalify';
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

// Each archer's grouping shot on the 40 cm face, from the first simulation step
const faceSlides = computed(() =>
  items.value
    .filter((item) => item.result.groupingRadius !== null)
    .map((item) => {
      const arrows = item.result.arrows;
      const rounds = arrows.length / ARROWS_PER_ROUND;
      const total = arrows.reduce((sum, arrow) => sum + arrow.score, 0);
      return {
        name: `face-${item.archer.id}`,
        label: item.title,
        title: t('groupingOf', { name: item.title }),
        color: item.color,
        score: item.archer.score,
        groupingDiameter: item.result.groupingRadius! * 2,
        // Arrows are drawn at real size when their diameter was counted
        arrowDiameter: store.results?.arrowDiameters ? item.archer.arrowDiameter : null,
        arrows,
        rounds,
        averageScore: Math.round(total / rounds),
      };
    }),
);

const groupingSeries = computed<ChartSeries[]>(() => {
  // Archers with the same arrows share a curve, each highlights their own score on it
  return items.value.map((item) => ({
    points: item.result.groupingPoints,
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
  { name: 'chart-grouping', label: t('tabGrouping'), icon: 'scatter_plot' },
  ...(faceSeries.value.length > 0
    ? [{ name: 'chart-face', label: t('tabFaceSize'), icon: 'show_chart' }]
    : []),
  ...faceSlides.value.map((s) => ({ name: s.name, label: s.label, color: s.color })),
]);
const slideNames = computed(() => tabs.value.map((tab) => tab.name));

const slide = ref(slideNames.value[0]!);

// Quasar's auto-scroll can stop a fraction of a pixel before the end of the tab
// bar, which keeps the arrow active. Once scrolling settles that close to an
// end, snap to it so the arrow fades.
const tabsRef = ref<ComponentPublicInstance | null>(null);
let tabsContent: HTMLElement | null = null;
let snapTimer: ReturnType<typeof setTimeout> | undefined;

function snapTabsToEdge() {
  clearTimeout(snapTimer);
  snapTimer = setTimeout(() => {
    if (!tabsContent) return;
    const max = tabsContent.scrollWidth - tabsContent.clientWidth;
    const pos = tabsContent.scrollLeft;
    if (pos > 0 && pos <= 2) tabsContent.scrollLeft = 0;
    else if (pos < max && max - pos <= 2) tabsContent.scrollLeft = max;
  }, 100);
}

onMounted(() => {
  tabsContent =
    (tabsRef.value?.$el as HTMLElement | undefined)?.querySelector('.q-tabs__content') ?? null;
  tabsContent?.addEventListener('scroll', snapTabsToEdge, { passive: true });
});

onBeforeUnmount(() => {
  clearTimeout(snapTimer);
  tabsContent?.removeEventListener('scroll', snapTabsToEdge);
});

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

// No hover highlight on the sheet that is already open
.sheet-tab--active :deep(.q-focus-helper) {
  display: none;
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
