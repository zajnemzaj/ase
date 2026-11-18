/**
 * World Archery target face rings, outermost first, with the colors of the
 * legacy SVG face.
 */
export interface Ring {
  radius: number;
  fill: string;
  stroke: string;
}

export const FACE_COLORS = {
  white: '#ffffff',
  black: '#000000',
  blue: '#41b7c8',
  red: '#fd1b14',
  gold: '#fff535',
};

function zoneFill(score: number): string {
  if (score >= 9) return FACE_COLORS.gold;
  if (score >= 7) return FACE_COLORS.red;
  if (score >= 5) return FACE_COLORS.blue;
  if (score >= 3) return FACE_COLORS.black;
  return FACE_COLORS.white;
}

/**
 * Rings of a face with the given radius, from the 1 ring to the inner 10 (X)
 */
export function faceRings(faceRadius: number): Ring[] {
  const rings: Ring[] = [];
  for (let score = 1; score <= 10; score++) {
    rings.push({
      radius: (faceRadius * (11 - score)) / 10,
      fill: zoneFill(score),
      // The line between the two black rings is white
      stroke: score === 4 ? FACE_COLORS.white : FACE_COLORS.black,
    });
  }
  rings.push({ radius: faceRadius / 20, fill: FACE_COLORS.gold, stroke: FACE_COLORS.black });
  return rings;
}
