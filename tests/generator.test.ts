import { describe, expect, it } from 'vitest';
import { compute, factKey, hasSmallOperand, needsRegrouping } from '../src/core/facts';
import { MISSING_SHARE, REGROUP_SHARE, SMALL_OPERAND_SHARE, generateRound } from '../src/core/generator';
import { seededRng } from '../src/core/rng';
import { ALL_OPS, ALL_RANGES, type Op, type PracticeSettings, type Problem, type Range } from '../src/core/types';

const ROUND = 10;
const SEEDS = 40;

function opSubsets(): Op[][] {
  const out: Op[][] = [];
  for (let mask = 1; mask < 1 << ALL_OPS.length; mask++) out.push(ALL_OPS.filter((_, i) => mask & (1 << i)));
  return out;
}

const allSettings: PracticeSettings[] = opSubsets().flatMap((ops) =>
  ALL_RANGES.flatMap((range) => [false, true].map((missingNumber) => ({ ops, range, missingNumber }))),
);

function rounds(settings: PracticeSettings): Problem[][] {
  return Array.from({ length: SEEDS }, (_, seed) => generateRound(settings, seededRng(seed * 7919 + 1), ROUND));
}

/** Every number shown, including the result, lies in 0..R and the fact is arithmetically true. */
function assertValidProblem(p: Problem, s: PracticeSettings) {
  expect(s.ops).toContain(p.op);
  for (const n of [p.a, p.b, p.c]) {
    expect(Number.isInteger(n)).toBe(true);
    expect(n).toBeGreaterThanOrEqual(0);
    expect(n).toBeLessThanOrEqual(s.range);
  }
  expect(compute(p.op, p.a, p.b)).toBe(p.c);
  if (!s.missingNumber) expect(p.unknown).toBe('c');
  if (p.op === 'sub') expect(p.b).toBeLessThanOrEqual(p.a);
  if (p.op === 'div') {
    expect(p.b).toBeGreaterThanOrEqual(1);
    expect(p.a % p.b).toBe(0);
  }
  if (p.op === 'mul' || p.op === 'div') {
    const [f1, f2] = p.op === 'mul' ? [p.a, p.b] : [p.b, p.c];
    if (s.range <= 100) {
      expect(f1).toBeLessThanOrEqual(10);
      expect(f2).toBeLessThanOrEqual(10);
    } else {
      expect((f1 >= 2 && f1 <= 10) || (f2 >= 2 && f2 <= 10)).toBe(true);
    }
  }
  if (p.unknown !== 'c') {
    // A missing-number problem must have exactly one answer.
    expect(hasSmallOperand(p)).toBe(false);
  }
}

describe('generateRound', () => {
  it.each(allSettings.map((s) => [`${s.ops.join('+')} 0–${s.range}${s.missingNumber ? ' missing' : ''}`, s] as const))(
    '%s respects every rule',
    (_name, s) => {
      for (const round of rounds(s)) {
        expect(round).toHaveLength(ROUND);
        round.forEach((p) => assertValidProblem(p, s));

        for (let i = 1; i < round.length; i++) expect(factKey(round[i])).not.toBe(factKey(round[i - 1]));

        const small = round.filter(hasSmallOperand).length;
        expect(small).toBeLessThanOrEqual(Math.floor(ROUND * SMALL_OPERAND_SHARE));

        const missing = round.filter((p) => p.unknown !== 'c').length;
        expect(missing).toBeLessThanOrEqual(Math.floor(ROUND * MISSING_SHARE));

        if (s.range >= 20) {
          const addSub = round.filter((p) => p.op === 'add' || p.op === 'sub');
          const regroup = addSub.filter((p) => needsRegrouping(p.op, p.a, p.b)).length;
          expect(regroup).toBeGreaterThanOrEqual(Math.ceil(addSub.length * REGROUP_SHARE));
        }
      }
    },
  );

  it('mixes enabled operations within one round', () => {
    const s: PracticeSettings = { ops: [...ALL_OPS], range: 100, missingNumber: false };
    const ops = new Set(rounds(s).flat().map((p) => p.op));
    expect(ops).toEqual(new Set(ALL_OPS));
  });

  it('produces missing-number problems in both positions when enabled', () => {
    const s: PracticeSettings = { ops: [...ALL_OPS], range: 100, missingNumber: true };
    const unknowns = new Set(rounds(s).flat().map((p) => p.unknown));
    expect(unknowns).toEqual(new Set(['a', 'b', 'c']));
  });

  it('uses large factors at 0–1000', () => {
    const s: PracticeSettings = { ops: ['mul'], range: 1000 as Range, missingNumber: false };
    expect(rounds(s).flat().some((p) => Math.max(p.a, p.b) > 10)).toBe(true);
  });

  it('rejects settings without operations', () => {
    expect(() => generateRound({ ops: [], range: 10, missingNumber: false }, seededRng(1), ROUND)).toThrow();
  });
});

describe('needsRegrouping', () => {
  it.each([
    ['add', 8, 5, true],
    ['add', 12, 5, false],
    ['add', 47, 25, true],
    ['add', 340, 250, false],
    ['add', 380, 250, true],
    ['sub', 13, 8, true],
    ['sub', 18, 5, false],
    ['sub', 503, 21, true],
    ['sub', 74, 28, true],
  ] as const)('%s %i %i → %s', (op, a, b, expected) => {
    expect(needsRegrouping(op, a, b)).toBe(expected);
  });
});
