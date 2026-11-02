<template>
  <q-page class="page q-pa-md">
    <div class="text-body2 text-grey-8 q-mb-md">{{ $t('appSubtitle') }}</div>

    <div class="row items-center q-mb-sm">
      <div class="text-h6 col">{{ $t('archers') }}</div>
    </div>

    <transition-group name="archer" tag="div" class="column q-gutter-y-md">
      <ArcherCard
        v-for="(archer, index) in store.archers"
        :key="archer.id"
        :archer-id="archer.id"
        :index="index"
      />
    </transition-group>

    <q-btn
      outline
      color="primary"
      icon="person_add"
      :label="$t('addArcher')"
      class="full-width q-mt-md add-btn"
      @click="store.addArcher()"
    />

    <q-banner v-if="message" rounded class="bg-orange-1 text-orange-10 q-mt-md" dense>
      <template #avatar><q-icon name="info" /></template>
      {{ message }}
    </q-banner>

    <div class="text-h6 q-mt-lg q-mb-sm">{{ $t('panels') }}</div>
    <ResultPanels v-if="store.calculatedArchers.length > 0" />
    <q-card v-else flat bordered>
      <q-card-section class="text-grey-7 text-center">{{ $t('noPanels') }}</q-card-section>
    </q-card>

    <q-input
      v-model="fileName"
      :label="$t('fileName')"
      outlined
      dense
      class="q-mt-lg"
      suffix=".pdf"
    />

    <!-- Main actions stay in reach of the thumb on phones -->
    <q-page-sticky expand position="bottom" class="action-bar">
      <div class="row q-gutter-sm q-pa-sm full-width no-wrap action-inner">
        <q-btn
          unelevated
          color="primary"
          icon="calculate"
          :label="$t('calculate')"
          :loading="store.calculating"
          :disable="!store.canCalculate"
          class="col action-btn"
          @click="store.calculate()"
        />
        <q-btn
          unelevated
          color="positive"
          icon="picture_as_pdf"
          :label="$t('savePdf')"
          :loading="saving"
          :disable="!store.canCalculate"
          class="col action-btn"
          @click="onSavePdf"
        />
      </div>
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import ArcherCard from '@/components/ArcherCard.vue';
import ResultPanels from '@/components/ResultPanels.vue';
import { useArcherStore } from '@/stores/archers';

const store = useArcherStore();
const { t } = useI18n();
const $q = useQuasar();

const fileName = ref('targetfaces');
const saving = ref(false);

const message = computed(() => {
  if (store.invalidArchers.length > 0) return t('fixScores');
  if (!store.canCalculate) return t('needTwoArchers');
  if (store.resultsOutdated) return t('resultsOutdated');
  return '';
});

async function onSavePdf() {
  saving.value = true;
  try {
    // Calculate first if nothing or something outdated was calculated, as before
    if (!store.results || store.resultsOutdated) await store.calculate();
    const faces = store.calculatedArchers.flatMap((archer) => {
      const radius = store.faceRadiusOf(archer);
      if (radius === null) return [];
      const index = store.archers.indexOf(archer);
      return [
        {
          name: archer.name.trim() || t('archer', { n: index + 1 }),
          score: archer.score!,
          radius,
          calculated: archer.radiusOverride === null,
        },
      ];
    });
    // jsPDF is large, it's only loaded when a PDF is saved
    const { createFacesPdf, savePdf } = await import('@/services/pdf');
    const doc = await createFacesPdf(faces, {
      name: t('pdfName'),
      score: t('pdfScore'),
      radius: t('pdfRadius'),
      calculated: t('calculated'),
      enteredByUser: t('enteredByUser'),
    });
    savePdf(doc, fileName.value.trim() || 'targetfaces');
    $q.notify({ type: 'positive', message: t('pdfSaved'), position: 'top' });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.page {
  max-width: 640px;
  margin: 0 auto;
  // Room for the sticky action bar
  padding-bottom: 96px;
}

.add-btn,
.action-btn {
  min-height: 48px;
}

.action-bar {
  z-index: 10;
}

.action-inner {
  max-width: 640px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(6px);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
}

.archer-enter-active,
.archer-leave-active {
  transition: all 0.2s ease;
}

.archer-enter-from,
.archer-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
