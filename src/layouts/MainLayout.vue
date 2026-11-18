<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-avatar size="32px" square>
          <img src="icons/logo-ase.png" alt="" />
        </q-avatar>
        <q-toolbar-title class="text-weight-medium" :class="{ 'text-subtitle1': $q.screen.xs }">
          {{ $t('appTitle') }}
        </q-toolbar-title>

        <q-btn flat round icon="translate" :aria-label="$t('language')">
          <q-menu auto-close>
            <q-list style="min-width: 140px">
              <q-item
                v-for="language in languages"
                :key="language.value"
                clickable
                :active="locale === language.value"
                @click="setLocale(language.value)"
              >
                <q-item-section>{{ language.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <q-tooltip>{{ $t('language') }}</q-tooltip>
        </q-btn>
        <q-btn flat round icon="help_outline" :aria-label="$t('help')" @click="helpOpen = true">
          <q-tooltip>{{ $t('help') }}</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-dialog v-model="helpOpen">
      <q-card style="max-width: 520px">
        <q-card-section>
          <div class="text-h6">{{ $t('help') }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <p v-for="(paragraph, i) in $tm('helpText')" :key="i">{{ $rt(paragraph) }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat color="primary" :label="$t('close')" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { LocalStorage } from 'quasar';
import { useI18n } from 'vue-i18n';

import { LOCALE_KEY, languages, type MessageLanguages } from '@/boot/i18n';

const { locale } = useI18n();
const helpOpen = ref(false);

function setLocale(value: MessageLanguages) {
  locale.value = value;
  LocalStorage.set(LOCALE_KEY, value);
}

watch(locale, (value) => (document.documentElement.lang = value), { immediate: true });
</script>
