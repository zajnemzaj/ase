<template>
  <q-card flat bordered class="archer-card">
    <q-card-section class="q-pb-sm">
      <div class="row items-center no-wrap q-gutter-x-sm">
        <!-- Number in the archer's chart color -->
        <div class="archer-number text-weight-bold" :style="{ color }">{{ index + 1 }}</div>
        <q-input
          v-model="archer.name"
          :label="$t('archerName')"
          dense
          outlined
          class="col"
          autocomplete="off"
        />
        <q-btn
          flat
          round
          icon="delete_outline"
          color="grey-7"
          :aria-label="$t('removeArcher')"
          @click="store.removeArcher(archer.id)"
        >
          <q-tooltip>{{ $t('removeArcher') }}</q-tooltip>
        </q-btn>
      </div>
    </q-card-section>

    <!-- Side by side when both fit, stacked only on very narrow screens -->
    <q-card-section class="q-pt-none input-grid">
      <NumberStepper
        v-model="archer.score"
        :min="MIN_SCORE"
        :max="MAX_SCORE"
        :start="250"
        :label="$t('scoreShort')"
        :rules="[scoreRule]"
      />
      <NumberStepper
        v-if="store.useArrowDiameters"
        v-model="archer.arrowDiameter"
        :min="MIN_ARROW_DIAMETER"
        :max="MAX_ARROW_DIAMETER"
        :step="0.1"
        :decimals="1"
        :start="DEFAULT_ARROW_DIAMETER"
        :label="$t('arrowShort')"
        :rules="[arrowRule]"
        suffix="mm"
      />
    </q-card-section>

    <q-card-section v-if="result" class="q-pt-none">
      <div class="row items-center q-mb-sm text-body2 text-grey-8">
        <q-icon name="adjust" class="q-mr-xs" />
        {{ $t('grouping') }}:
        <span class="text-weight-medium q-ml-xs">
          {{
            result.groupingRadius === null
              ? $t('noResult')
              : $t('mm', { value: result.groupingRadius * 2 })
          }}
        </span>
        <q-badge v-if="isReference" color="accent" class="q-ml-sm">{{ $t('reference') }}</q-badge>
      </div>
      <div class="row items-start no-wrap q-gutter-x-sm">
        <NumberStepper
          :model-value="faceDiameter"
          :min="10"
          :max="FULL_FACE_RADIUS * 2"
          :label="`${$t('faceDiameter')} (${archer.radiusOverride === null ? $t('calculated') : $t('enteredByUser')})`"
          suffix="mm"
          class="col"
          @update:model-value="setDiameter"
        />
        <q-btn
          v-if="archer.radiusOverride !== null"
          flat
          round
          icon="restart_alt"
          color="primary"
          class="q-mt-sm"
          :aria-label="$t('resetDiameter')"
          @click="archer.radiusOverride = null"
        >
          <q-tooltip>{{ $t('resetDiameter') }}</q-tooltip>
        </q-btn>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import NumberStepper from '@/components/NumberStepper.vue';
import {
  DEFAULT_ARROW_DIAMETER,
  FULL_FACE_RADIUS,
  MAX_ARROW_DIAMETER,
  MAX_SCORE,
  MIN_ARROW_DIAMETER,
  MIN_SCORE,
  isValidArrowDiameter,
  isValidScore,
} from '@/simulation/equalify';
import { useArcherStore } from '@/stores/archers';
import { archerColor } from '@/utils/archerColors';

const props = defineProps<{ archerId: string; index: number }>();

const store = useArcherStore();
const archer = computed(() => store.archers.find((a) => a.id === props.archerId)!);
const { t } = useI18n();

const color = computed(() => archerColor(props.index));
const result = computed(() => store.resultOf(props.archerId));
// Shown as a diameter, archers measure faces that way
const faceDiameter = computed(() => {
  const radius = store.faceRadiusOf(archer.value);
  return radius === null ? null : radius * 2;
});
const isReference = computed(() => archer.value.score === store.results?.minScore);

function scoreRule(value: number | null): true | string {
  return (
    value === null || isValidScore(value) || t('scoreInvalid', { min: MIN_SCORE, max: MAX_SCORE })
  );
}

function arrowRule(value: number | null): true | string {
  return (
    isValidArrowDiameter(value) ||
    t('arrowDiameterInvalid', { min: MIN_ARROW_DIAMETER, max: MAX_ARROW_DIAMETER })
  );
}

function setDiameter(value: number | null) {
  const radius = value === null ? null : value / 2;
  // Typing the calculated value back counts as calculated again
  archer.value.radiusOverride = radius === result.value?.faceRadius ? null : radius;
}
</script>

<style scoped>
.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.archer-number {
  min-width: 24px;
  font-size: 22px;
  text-align: center;
}
</style>
