import { LocalStorage } from 'quasar';

/**
 * What is saved of an archer. Results are always recalculated, so they are
 * not part of it.
 */
export interface SavedArcher {
  id: string;
  name: string;
  score: number | null;
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
    (archer.score === null || typeof archer.score === 'number')
  );
}

export const localArcherRepository: ArcherRepository = {
  load() {
    const saved: unknown = LocalStorage.getItem(STORAGE_KEY);
    return Promise.resolve(Array.isArray(saved) ? saved.filter(isSavedArcher) : []);
  },
  save(archers) {
    LocalStorage.set(STORAGE_KEY, archers);
    return Promise.resolve();
  },
};
