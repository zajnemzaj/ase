import { defineStore, acceptHMRUpdate } from 'pinia';
import { LocalStorage } from 'quasar';
import { computed, ref, watch } from 'vue';

import {
  DEFAULT_ARROW_DIAMETER,
  equalify,
  isValidArrowDiameter,
  isValidScore,
  type ArcherResult,
} from '@/simulation/equalify';
import { localArcherRepository, type SavedArcher } from '@/services/archerRepository';

export interface Archer extends SavedArcher {
  // Radius set by hand on the result, null uses the calculated one
  radiusOverride: number | null;
}

interface Results {
  // Inputs the results were calculated from, by archer id
  inputs: Record<string, string>;
  minScore: number;
  archers: Record<string, ArcherResult>;
  // Arrow diameters were counted (line cutters)
  arrowDiameters: boolean;
}

const DEFAULT_ARCHERS: SavedArcher[] = [
  { id: newId(), name: '', score: 245, arrowDiameter: DEFAULT_ARROW_DIAMETER },
  { id: newId(), name: '', score: 285, arrowDiameter: DEFAULT_ARROW_DIAMETER },
];

const ARROW_DIAMETERS_KEY = 'ase.arrowDiameters';

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
  // Count arrow diameters, so arrows touching a higher ring score it
  const useArrowDiameters = ref(LocalStorage.getItem(ARROW_DIAMETERS_KEY) === true);
  // How long the last calculation took, in ms
  const lastDuration = ref<number | null>(null);

  watch(useArrowDiameters, (value) => LocalStorage.set(ARROW_DIAMETERS_KEY, value));

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
      void repository.save(
        list.map(({ id, name, score, arrowDiameter }) => ({ id, name, score, arrowDiameter })),
      );
    },
    { deep: true },
  );

  const scoredArchers = computed(() => archers.value.filter((a) => a.score !== null));
  const invalidArchers = computed(() =>
    scoredArchers.value.filter(
      (a) =>
        !isValidScore(a.score) ||
        (useArrowDiameters.value && !isValidArrowDiameter(a.arrowDiameter)),
    ),
  );

  // Arrow radius used in the simulation, 0 scores arrows as points
  function arrowRadiusOf(archer: Archer): number {
    return useArrowDiameters.value ? archer.arrowDiameter! / 2 : 0;
  }

  // What a result depends on, to tell when it's outdated
  function inputOf(archer: Archer): string {
    return `${archer.score}|${arrowRadiusOf(archer)}`;
  }
  const canCalculate = computed(
    () => scoredArchers.value.length >= 2 && invalidArchers.value.length === 0,
  );

  // Results are outdated when a scored archer was added, removed or changed
  const resultsOutdated = computed(() => {
    if (!results.value) return false;
    const inputs = results.value.inputs;
    return (
      scoredArchers.value.length !== Object.keys(inputs).length ||
      scoredArchers.value.some((a) => inputs[a.id] !== inputOf(a))
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
    const lastArrow = archers.value.at(-1)?.arrowDiameter ?? DEFAULT_ARROW_DIAMETER;
    archers.value.push({
      id: newId(),
      name: '',
      score: lastScore,
      arrowDiameter: lastArrow,
      radiusOverride: null,
    });
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
      const input = scoredArchers.value.map((a) => ({
        id: a.id,
        score: a.score!,
        arrowRadius: arrowRadiusOf(a),
      }));
      const start = performance.now();
      const result = equalify(input);
      lastDuration.value = Math.round(performance.now() - start);
      results.value = {
        inputs: Object.fromEntries(scoredArchers.value.map((a) => [a.id, inputOf(a)])),
        minScore: result.minScore,
        archers: result.archers,
        arrowDiameters: useArrowDiameters.value,
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
    useArrowDiameters,
    lastDuration,
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
