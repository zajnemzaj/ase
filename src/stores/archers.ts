import { defineStore, acceptHMRUpdate } from 'pinia';
import { computed, ref, watch } from 'vue';

import { equalify, isValidScore, type ArcherResult, type ChartPoint } from '@/simulation/equalify';
import { localArcherRepository, type SavedArcher } from '@/services/archerRepository';

export interface Archer extends SavedArcher {
  // Radius set by hand on the result, null uses the calculated one
  radiusOverride: number | null;
}

interface Results {
  // Scores the results were calculated from, by archer id
  scores: Record<string, number>;
  minScore: number;
  archers: Record<string, ArcherResult>;
  groupingPoints: ChartPoint[];
}

const DEFAULT_ARCHERS: SavedArcher[] = [
  { id: newId(), name: '', score: 245 },
  { id: newId(), name: '', score: 285 },
];

const NEW_ARCHER_SCORE = 250;

// crypto.randomUUID() needs HTTPS, the app may be served over plain HTTP
function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export const useArcherStore = defineStore('archers', () => {
  const repository = localArcherRepository;
  const archers = ref<Archer[]>([]);
  const results = ref<Results | null>(null);
  const calculating = ref(false);
  const loaded = ref(false);

  async function load() {
    const saved = await repository.load();
    archers.value = (saved.length > 0 ? saved : DEFAULT_ARCHERS).map((archer) => ({
      ...archer,
      radiusOverride: null,
    }));
    loaded.value = true;
  }

  watch(
    archers,
    (list) => {
      if (!loaded.value) return;
      void repository.save(list.map(({ id, name, score }) => ({ id, name, score })));
    },
    { deep: true },
  );

  const scoredArchers = computed(() => archers.value.filter((a) => a.score !== null));
  const invalidArchers = computed(() => scoredArchers.value.filter((a) => !isValidScore(a.score)));
  const canCalculate = computed(
    () => scoredArchers.value.length >= 2 && invalidArchers.value.length === 0,
  );

  // Results are outdated when a scored archer was added, removed or changed
  const resultsOutdated = computed(() => {
    if (!results.value) return false;
    const scores = results.value.scores;
    return (
      scoredArchers.value.length !== Object.keys(scores).length ||
      scoredArchers.value.some((a) => scores[a.id] !== a.score)
    );
  });

  // Archers with results, in list order
  const calculatedArchers = computed(() =>
    archers.value.filter((a) => results.value?.archers[a.id] && !resultsOutdated.value),
  );

  // A new archer starts from the last entered score, so it counts right away
  function addArcher() {
    const lastScore =
      scoredArchers.value.filter((a) => isValidScore(a.score)).at(-1)?.score ?? NEW_ARCHER_SCORE;
    archers.value.push({ id: newId(), name: '', score: lastScore, radiusOverride: null });
  }

  function removeArcher(id: string) {
    archers.value = archers.value.filter((a) => a.id !== id);
  }

  function resultOf(id: string): ArcherResult | null {
    return resultsOutdated.value ? null : (results.value?.archers[id] ?? null);
  }

  // Radius printed on the PDF: set by hand or calculated
  function faceRadiusOf(archer: Archer): number | null {
    return archer.radiusOverride ?? resultOf(archer.id)?.faceRadius ?? null;
  }

  async function calculate() {
    if (!canCalculate.value) return;
    calculating.value = true;
    // Let the progress indicator render before the simulation blocks the thread
    await new Promise((resolve) => setTimeout(resolve, 50));
    try {
      const input = scoredArchers.value.map((a) => ({ id: a.id, score: a.score! }));
      const result = equalify(input);
      results.value = {
        scores: Object.fromEntries(input.map((a) => [a.id, a.score])),
        minScore: result.minScore,
        archers: result.archers,
        groupingPoints: result.groupingPoints,
      };
      for (const archer of archers.value) archer.radiusOverride = null;
    } finally {
      calculating.value = false;
    }
  }

  return {
    archers,
    results,
    calculating,
    load,
    invalidArchers,
    canCalculate,
    resultsOutdated,
    calculatedArchers,
    addArcher,
    removeArcher,
    resultOf,
    faceRadiusOf,
    calculate,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useArcherStore, import.meta.hot));
}
