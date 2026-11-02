// Distinct colors for archers on the charts and in the list
const COLORS = [
  '#1976d2',
  '#e65100',
  '#2e7d32',
  '#6a1b9a',
  '#c62828',
  '#00838f',
  '#ad1457',
  '#4e342e',
  '#283593',
];

export function archerColor(index: number): string {
  return COLORS[index % COLORS.length]!;
}
