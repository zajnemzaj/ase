/**
 * Archery score equalizing simulation, ported from legacy/js/ase-pure.js.
 *
 * Model: an archer's arrows land uniformly inside a circle (the grouping
 * radius). A round is 30 arrows. All sizes are radii in mm; the official
 * 40 cm target face has a 200 mm radius and is used by the lowest scorer.
 *
 * 1. Grouping radius for a score: shoot one round at every grouping radius
 *    from 200 mm down to 1 mm on the 40 cm face, keep the radii whose round
 *    score is within ±5 of the archer's score, and average them. Repeated
 *    `GROUPING_RUNS` times.
 * 2. Target face radius for a higher scorer: with their grouping radius,
 *    shoot 10 rounds on every face radius from 200 mm down to the grouping
 *    radius, and average the face radii where the round score is within ±5
 *    of the lowest archer's score.
 */

export const FULL_FACE_RADIUS = 200;
export const ARROWS_PER_ROUND = 30;
export const SCORE_TOLERANCE = 5;
export const GROUPING_RUNS = 32;
export const ROUNDS_PER_FACE_SIZE = 10;

// Even arrows spread over the whole 40 cm face average about 115 points,
// lower scores can't be reached; 125 is the lowest that reliably works
export const MIN_SCORE = 125;
export const MAX_SCORE = ARROWS_PER_ROUND * 10;

export type RandomFn = () => number;

export interface Arrow {
  // Position from the face center in mm
  x: number;
  y: number;
  score: number;
}

export interface ChartPoint {
  radius: number;
  score: number;
}

export function isValidScore(score: number | null | undefined): score is number {
  return Number.isInteger(score) && score! >= MIN_SCORE && score! <= MAX_SCORE;
}

/**
 * Random integer between 1 and maxNo, as getRandomNumber() in the legacy code
 */
function randomInt(maxNo: number, random: RandomFn): number {
  return Math.floor(random() * maxNo + 1);
}

/**
 * Shoots one arrow inside the grouping circle and scores it on the target face
 */
export function shootArrow(groupingRadius: number, faceRadius: number, random: RandomFn): Arrow {
  const ringWidth = faceRadius / 10;
  let x: number;
  let y: number;
  let distance: number;
  // Integer coordinates in the bounding square, rejected outside the circle
  do {
    x = randomInt(groupingRadius * 2, random) - groupingRadius;
    y = randomInt(groupingRadius * 2, random) - groupingRadius;
    distance = Math.sqrt(x * x + y * y);
  } while (distance > groupingRadius);
  const ring = Math.max(1, Math.ceil(distance / ringWidth));
  return { x, y, score: Math.max(0, 11 - ring) };
}

export function shootRound(groupingRadius: number, faceRadius: number, random: RandomFn): number {
  let score = 0;
  for (let i = 0; i < ARROWS_PER_ROUND; i++) {
    score += shootArrow(groupingRadius, faceRadius, random).score;
  }
  return score;
}

/**
 * One round at each grouping radius from 200 mm to 1 mm on the 40 cm face,
 * repeated for every run. It doesn't depend on any archer's score, so one
 * curve serves every archer.
 * @return curve[run][radius - 1] = round score
 */
export function simulateGroupingCurve(
  random: RandomFn,
  runs = GROUPING_RUNS,
  onRun?: (run: number) => void,
): number[][] {
  const curve: number[][] = [];
  for (let run = 0; run < runs; run++) {
    const scores: number[] = [];
    for (let radius = 1; radius <= FULL_FACE_RADIUS; radius++) {
      scores.push(shootRound(radius, FULL_FACE_RADIUS, random));
    }
    curve.push(scores);
    onRun?.(run);
  }
  return curve;
}

/**
 * Average grouping radius that shoots the given score on the 40 cm face
 * @return radius in mm, or null if no run got within the tolerance
 */
export function groupingRadiusForScore(curve: number[][], score: number): number | null {
  let runSum = 0;
  let runCount = 0;
  for (const scores of curve) {
    let radiusSum = 0;
    let radiusCount = 0;
    scores.forEach((roundScore, i) => {
      if (Math.abs(roundScore - score) <= SCORE_TOLERANCE) {
        radiusSum += i + 1;
        radiusCount++;
      }
    });
    if (radiusCount > 0) {
      runSum += Math.trunc(radiusSum / radiusCount);
      runCount++;
    }
  }
  return runCount > 0 ? Math.round(runSum / runCount) : null;
}

/**
 * Face radius on which an archer with the given grouping shoots the target score
 * @return radius in mm and the simulated points, radius is null if never matched
 */
export function faceRadiusForTargetScore(
  groupingRadius: number,
  targetScore: number,
  random: RandomFn,
): { radius: number | null; points: ChartPoint[] } {
  const points: ChartPoint[] = [];
  let radiusSum = 0;
  let radiusCount = 0;
  for (let faceRadius = FULL_FACE_RADIUS; faceRadius >= groupingRadius; faceRadius--) {
    for (let i = 0; i < ROUNDS_PER_FACE_SIZE; i++) {
      const score = shootRound(groupingRadius, faceRadius, random);
      points.push({ radius: faceRadius, score });
      if (Math.abs(score - targetScore) <= SCORE_TOLERANCE) {
        radiusSum += faceRadius;
        radiusCount++;
      }
    }
  }
  return { radius: radiusCount > 0 ? Math.trunc(radiusSum / radiusCount) : null, points };
}

/**
 * Arrows of a few rounds, to show an archer's grouping on a target face
 */
export function sampleArrows(
  groupingRadius: number,
  faceRadius: number,
  random: RandomFn,
  rounds = 3,
): Arrow[] {
  const arrows: Arrow[] = [];
  for (let i = 0; i < rounds * ARROWS_PER_ROUND; i++) {
    arrows.push(shootArrow(groupingRadius, faceRadius, random));
  }
  return arrows;
}

export interface ArcherScore {
  id: string;
  score: number;
}

export interface ArcherResult {
  groupingRadius: number | null;
  faceRadius: number | null;
  // A few rounds with the archer's grouping on the 40 cm face
  arrows: Arrow[];
  // Score vs. face radius points, empty for the lowest scorer
  facePoints: ChartPoint[];
}

export interface EqualifyResult {
  minScore: number;
  archers: Record<string, ArcherResult>;
  // Score vs. grouping radius on the 40 cm face, all runs
  groupingPoints: ChartPoint[];
}

/**
 * Calculates grouping and target face radius for every archer.
 * Archers with the same score get the same results.
 */
export function equalify(
  archers: ArcherScore[],
  random: RandomFn = Math.random,
  onProgress?: (done: number, total: number) => void,
): EqualifyResult {
  const minScore = Math.min(...archers.map((a) => a.score));
  const distinctScores = [...new Set(archers.map((a) => a.score))];
  const total = GROUPING_RUNS + distinctScores.length;
  let done = 0;

  const curve = simulateGroupingCurve(random, GROUPING_RUNS, () => onProgress?.(++done, total));

  const byScore = new Map<number, ArcherResult>();
  for (const score of distinctScores) {
    const groupingRadius = groupingRadiusForScore(curve, score);
    let faceRadius: number | null = null;
    let facePoints: ChartPoint[] = [];
    if (score === minScore) {
      faceRadius = FULL_FACE_RADIUS;
    } else if (groupingRadius !== null) {
      ({ radius: faceRadius, points: facePoints } = faceRadiusForTargetScore(
        groupingRadius,
        minScore,
        random,
      ));
    }
    const arrows =
      groupingRadius !== null ? sampleArrows(groupingRadius, FULL_FACE_RADIUS, random) : [];
    byScore.set(score, { groupingRadius, faceRadius, arrows, facePoints });
    onProgress?.(++done, total);
  }

  const result: EqualifyResult = { minScore, archers: {}, groupingPoints: [] };
  for (const archer of archers) {
    result.archers[archer.id] = byScore.get(archer.score)!;
  }
  for (const scores of curve) {
    scores.forEach((score, i) => result.groupingPoints.push({ radius: i + 1, score }));
  }
  return result;
}
