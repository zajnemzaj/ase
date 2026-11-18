import { defineBoot } from '#q-app';

import { useArcherStore } from '@/stores/archers';

// Load the saved archers before the first render
export default defineBoot(async ({ store }) => {
  await useArcherStore(store).load();
});
