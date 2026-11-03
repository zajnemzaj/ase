<template>
  <q-input
    :model-value="modelValue"
    :label="label"
    :hint="hint"
    :rules="rules"
    :suffix="suffix"
    type="number"
    inputmode="numeric"
    input-class="text-center text-weight-medium"
    outlined
    hide-bottom-space
    @update:model-value="onInput"
  >
    <template #prepend>
      <q-btn
        unelevated
        padding="0"
        color="primary"
        icon="remove"
        :aria-label="$t('decrease')"
        :disable="modelValue !== null && modelValue <= min"
        class="stepper-btn"
        @pointerdown.prevent="startRepeat(-step)"
        @keydown.enter.space.prevent="change(-step)"
      />
    </template>
    <template #append>
      <q-btn
        unelevated
        padding="0"
        color="primary"
        icon="add"
        :aria-label="$t('increase')"
        :disable="modelValue !== null && modelValue >= max"
        class="stepper-btn"
        @pointerdown.prevent="startRepeat(step)"
        @keydown.enter.space.prevent="change(step)"
      />
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: number | null;
    min: number;
    max: number;
    step?: number;
    // Starting value when +/- is pressed on an empty field
    start?: number;
    label?: string;
    hint?: string;
    suffix?: string;
    rules?: ((value: number | null) => true | string)[];
  }>(),
  { step: 1 },
);

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>();

function onInput(value: string | number | null) {
  emit('update:modelValue', value === '' || value === null ? null : Number(value));
}

function change(delta: number) {
  const current = props.modelValue ?? props.start ?? props.min;
  const base = props.modelValue === null ? current : current + delta;
  emit('update:modelValue', Math.min(props.max, Math.max(props.min, Math.round(base))));
}

// Holding a button keeps stepping, faster after a while
let timer: ReturnType<typeof setTimeout> | undefined;

function startRepeat(delta: number) {
  change(delta);
  let delay = 400;
  const repeat = () => {
    change(delta);
    delay = Math.max(50, delay * 0.8);
    timer = setTimeout(repeat, delay);
  };
  timer = setTimeout(repeat, delay);
  window.addEventListener('pointerup', stopRepeat, { once: true });
  window.addEventListener('pointercancel', stopRepeat, { once: true });
}

function stopRepeat() {
  clearTimeout(timer);
  timer = undefined;
}

onBeforeUnmount(stopRepeat);
</script>

<style scoped lang="scss">
.stepper-btn {
  // Comfortable touch target, a rounded square like the other buttons
  width: 40px;
  height: 40px;
}

:deep(input[type='number']) {
  -moz-appearance: textfield;
  appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}
</style>
