import { answerOf } from './facts';
import { shuffle, type Rng } from './rng';
import type { Problem } from './types';

export const CHOICE_COUNT = 4;

/** The number a child gets by using the wrong operation, e.g. adding instead of subtracting. */
export function wrongOperationResult(p: Problem): number {
  const { a, b, c } = p;
  switch (p.unknown) {
    case 'c':
      return { add: Math.abs(a - b), sub: a + b, mul: a + b, div: a * b }[p.op];
    case 'b':
      return { add: c + a, sub: a + c, mul: c - a, div: a * c }[p.op];
    case 'a':
      return { add: c + b, sub: c - b, mul: c - b, div: c / b }[p.op];
  }
}

export function swappedDigits(n: number): number | null {
  if (n < 10) return null;
  const swapped = Number(String(n).split('').reverse().join(''));
  return swapped === n ? null : swapped;
}

/**
 * Four answer choices for the youngest players (spec §3): the correct answer plus distractors
 * from correct ±1, correct ±10 (R ≥ 100), the wrong-operation result and the swapped-digit number.
 * All lie in 0..R and are distinct. Nearby numbers fill in when a small range leaves too few.
 */
export function makeChoices(p: Problem, range: number, rng: Rng): number[] {
  const correct = answerOf(p);
  const ok = (n: number | null): n is number => n !== null && Number.isInteger(n) && n >= 0 && n <= range && n !== correct;
  const candidates = [wrongOperationResult(p), swappedDigits(correct), correct + 1, correct - 1];
  if (range >= 100) candidates.push(correct + 10, correct - 10);
  const distractors: number[] = [];
  for (const n of shuffle(rng, candidates)) {
    if (distractors.length < CHOICE_COUNT - 1 && ok(n) && !distractors.includes(n)) distractors.push(n);
  }
  for (let d = 2; distractors.length < CHOICE_COUNT - 1 && d <= range; d++) {
    for (const n of [correct + d, correct - d]) {
      if (distractors.length < CHOICE_COUNT - 1 && ok(n) && !distractors.includes(n)) distractors.push(n);
    }
  }
  return shuffle(rng, [correct, ...distractors]);
}
