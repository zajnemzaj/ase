<template>
  <div ref="container" class="score-chart">
    <canvas ref="canvas" role="img" :aria-label="`${xLabel} / ${yLabel}`" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { MAX_SCORE, SCORE_TOLERANCE, type ChartPoint } from '@/simulation/equalify';

export interface ChartSeries {
  points: ChartPoint[];
  color: string;
  // Points within the tolerance of this score are highlighted
  targetScore: number;
  // Calculated radius, drawn as a vertical line
  radius: number | null;
}

const props = defineProps<{
  series: ChartSeries[];
  xMax: number;
  xLabel: string;
  yLabel: string;
}>();

const container = ref<HTMLDivElement>();
const canvas = ref<HTMLCanvasElement>();
const MUTED = 'rgba(0, 0, 0, 0.18)';
const PADDING = { left: 44, right: 12, top: 12, bottom: 36 };

function draw() {
  const el = canvas.value;
  const box = container.value;
  if (!el || !box) return;
  const width = box.clientWidth;
  const height = Math.round(width * 0.75);
  const dpr = window.devicePixelRatio || 1;
  el.width = width * dpr;
  el.height = height * dpr;
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
  const ctx = el.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const plotW = width - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;
  const x = (radius: number) => PADDING.left + (radius / props.xMax) * plotW;
  const y = (score: number) => PADDING.top + (1 - score / MAX_SCORE) * plotH;

  // Grid and axis labels
  ctx.font = '11px Roboto, sans-serif';
  ctx.fillStyle = '#666';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let score = 0; score <= MAX_SCORE; score += 50) {
    ctx.beginPath();
    ctx.moveTo(PADDING.left, y(score));
    ctx.lineTo(width - PADDING.right, y(score));
    ctx.stroke();
    ctx.fillText(String(score), PADDING.left - 6, y(score));
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const xStep = props.xMax > 100 ? 50 : 25;
  for (let radius = 0; radius <= props.xMax; radius += xStep) {
    ctx.fillText(String(radius), x(radius), height - PADDING.bottom + 6);
  }
  ctx.fillText(props.xLabel, PADDING.left + plotW / 2, height - 14);
  ctx.save();
  ctx.translate(11, PADDING.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textBaseline = 'middle';
  ctx.fillText(props.yLabel, 0, 0);
  ctx.restore();

  // Points outside the tolerance first, so highlighted ones stay on top
  for (const highlighted of [false, true]) {
    for (const s of props.series) {
      ctx.fillStyle = highlighted ? s.color : MUTED;
      for (const p of s.points) {
        if (Math.abs(p.score - s.targetScore) <= SCORE_TOLERANCE !== highlighted) continue;
        ctx.fillRect(x(p.radius) - 1, y(p.score) - 1, 2, 2);
      }
    }
  }

  // Calculated radius of each series
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 2;
  for (const s of props.series) {
    if (s.radius === null) continue;
    ctx.strokeStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(x(s.radius), PADDING.top);
    ctx.lineTo(x(s.radius), PADDING.top + plotH);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

let observer: ResizeObserver | undefined;
onMounted(() => {
  observer = new ResizeObserver(() => draw());
  if (container.value) observer.observe(container.value);
  draw();
});
onBeforeUnmount(() => observer?.disconnect());
// Series are rebuilt on every change, a deep watch over thousands of points isn't needed
watch(() => props.series, draw);
</script>

<style scoped>
.score-chart {
  width: 100%;
}

canvas {
  display: block;
}
</style>
