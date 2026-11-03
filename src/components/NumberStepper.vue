<template>
  <q-input
    :model-value="modelValue"
    :label="label"
    :hint="hint"
    :rules="rules"
    :suffix="suffix"
    type="number"
    :inputmode="decimals > 0 ? 'decimal' : 'numeric'"
    :step="step"
    input-class="text-center text-weight-medium"
    borderless
    hide-bottom-space
    @update:model-value="onInput"
  >
    <template #prepend>
      <q-btn
        unelevated
        padding="0"
        icon="remove"
        :aria-label="$t('decrease')"
        :disable="modelValue !== null && modelValue <= min"
        class="stepper-btn stepper-minus"
        @pointerdown.prevent="startRepeat(-step)"
        @keydown.enter.space.prevent="change(-step)"
      />
    </template>
    <template #append>
      <q-btn
        unelevated
        padding="0"
        icon="add"
        :aria-label="$t('increase')"
        :disable="modelValue !== null && modelValue >= max"
        class="stepper-btn stepper-plus"
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
    // Decimal places kept when stepping, e.g. 1 for 4.2
    decimals?: number;
    // Starting value when +/- is pressed on an empty field
    start?: number;
    label?: string;
    hint?: string;
    suffix?: string;
    rules?: ((value: number | null) => true | string)[];
  }>(),
  { step: 1, decimals: 0 },
);

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>();

function onInput(value: string | number | null) {
  emit('update:modelValue', value === '' || value === null ? null : Number(value));
}

function change(delta: number) {
  const current = props.modelValue ?? props.start ?? props.min;
  const base = props.modelValue === null ? current : current + delta;
  // Rounding keeps 4.2 + 0.1 at 4.3 instead of 4.300000000000001
  const factor = 10 ** props.decimals;
  const rounded = Math.round(base * factor) / factor;
  emit('update:modelValue', Math.min(props.max, Math.max(props.min, rounded)));
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

// Little space between the buttons and the value, so two fields fit side by side on phones
:deep(.q-field__prepend) {
  padding-right: 4px;
}

:deep(.q-field__append) {
  padding-left: 4px;
}

// Light tinted buttons: coral for minus, teal for plus
.stepper-minus {
  background: #fdeee9;
  color: #c2552d;
}

.stepper-plus {
  background: #e3f0ee;
  color: $primary;
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
