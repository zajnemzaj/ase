<template>
  <q-card flat bordered class="archer-card">
    <q-card-section class="q-pb-sm">
      <div class="row items-center no-wrap q-gutter-x-sm">
        <q-avatar size="36px" text-color="white" :style="{ background: color }">
          {{ index + 1 }}
        </q-avatar>
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

    <q-card-section class="q-pt-none">
      <NumberStepper
        v-model="archer.score"
        :min="MIN_SCORE"
        :max="MAX_SCORE"
        :start="250"
        :label="$t('score')"
        :rules="[scoreRule]"
      />
    </q-card-section>

    <q-card-section v-if="result" class="q-pt-none">
      <div class="row items-center q-mb-sm text-body2 text-grey-8">
        <q-icon name="adjust" class="q-mr-xs" />
        {{ $t('groupingRadius') }}:
        <span class="text-weight-medium q-ml-xs">
          {{
            result.groupingRadius === null
              ? $t('noResult')
              : $t('mm', { value: result.groupingRadius })
          }}
        </span>
        <q-badge v-if="isReference" color="accent" class="q-ml-sm">{{ $t('reference') }}</q-badge>
      </div>
      <div class="row items-start no-wrap q-gutter-x-sm">
        <NumberStepper
          :model-value="faceRadius"
          :min="5"
          :max="FULL_FACE_RADIUS"
          :label="`${$t('faceRadius')} (${archer.radiusOverride === null ? $t('calculated') : $t('enteredByUser')})`"
          suffix="mm"
          class="col"
          @update:model-value="setRadius"
        />
        <q-btn
          v-if="archer.radiusOverride !== null"
          flat
          round
          icon="restart_alt"
          color="primary"
          class="q-mt-sm"
          :aria-label="$t('resetRadius')"
          @click="archer.radiusOverride = null"
        >
          <q-tooltip>{{ $t('resetRadius') }}</q-tooltip>
        </q-btn>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import NumberStepper from '@/components/NumberStepper.vue';
import { FULL_FACE_RADIUS, MAX_SCORE, MIN_SCORE, isValidScore } from '@/simulation/equalify';
import { useArcherStore } from '@/stores/archers';
import { archerColor } from '@/utils/archerColors';

const props = defineProps<{ archerId: string; index: number }>();

const store = useArcherStore();
const archer = computed(() => store.archers.find((a) => a.id === props.archerId)!);
const { t } = useI18n();

const color = computed(() => archerColor(props.index));
const result = computed(() => store.resultOf(props.archerId));
const faceRadius = computed(() => store.faceRadiusOf(archer.value));
const isReference = computed(() => archer.value.score === store.results?.minScore);

function scoreRule(value: number | null): true | string {
  return (
    value === null || isValidScore(value) || t('scoreInvalid', { min: MIN_SCORE, max: MAX_SCORE })
  );
}

function setRadius(value: number | null) {
  // Typing the calculated value back counts as calculated again
  archer.value.radiusOverride = value === result.value?.faceRadius ? null : value;
}
</script>
