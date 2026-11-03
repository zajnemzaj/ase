// Distinct colors for archers on the charts and in the list, starting with the theme colors
const COLORS = [
  '#10695c',
  '#e63946',
  '#1d3557',
  '#f4a261',
  '#457b9d',
  '#7b4b94',
  '#8a9a5b',
  '#c9184a',
  '#7f5539',
];

export function archerColor(index: number): string {
  return COLORS[index % COLORS.length]!;
}
