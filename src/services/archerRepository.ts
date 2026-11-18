import { LocalStorage } from 'quasar';

import { DEFAULT_ARROW_DIAMETER } from '@/simulation/equalify';

/**
 * What is saved of an archer. Results are always recalculated, so they are
 * not part of it.
 */
export interface SavedArcher {
  id: string;
  name: string;
  score: number | null;
  // Arrow shaft in mm, used when arrow diameters are switched on
  arrowDiameter: number | null;
}

/**
 * Where the archer list is kept. Today it's the browser's local storage; with
 * user accounts an implementation backed by the server can replace it.
 */
export interface ArcherRepository {
  load(): Promise<SavedArcher[]>;
  save(archers: SavedArcher[]): Promise<void>;
}

const STORAGE_KEY = 'ase.archers';

function isSavedArcher(value: unknown): value is SavedArcher {
  const archer = value as SavedArcher;
  return (
    typeof archer?.id === 'string' &&
    typeof archer.name === 'string' &&
    (archer.score === null || typeof archer.score === 'number') &&
    (archer.arrowDiameter === undefined ||
      archer.arrowDiameter === null ||
      typeof archer.arrowDiameter === 'number')
  );
}

export const localArcherRepository: ArcherRepository = {
  load() {
    const saved: unknown = LocalStorage.getItem(STORAGE_KEY);
    const archers = Array.isArray(saved) ? saved.filter(isSavedArcher) : [];
    // Archers saved before arrow diameters existed get the default
    return Promise.resolve(
      archers.map((archer) => ({
        ...archer,
        arrowDiameter:
          archer.arrowDiameter === undefined ? DEFAULT_ARROW_DIAMETER : archer.arrowDiameter,
      })),
    );
  },
  save(archers) {
    LocalStorage.set(STORAGE_KEY, archers);
    return Promise.resolve();
  },
};
