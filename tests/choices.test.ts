import { describe, expect, it } from 'vitest';
import { CHOICE_COUNT, makeChoices, swappedDigits, wrongOperationResult } from '../src/core/choices';
import { answerOf } from '../src/core/facts';
import { generateRound } from '../src/core/generator';
import { seededRng } from '../src/core/rng';
import { ALL_OPS, ALL_RANGES, type Problem } from '../src/core/types';

const p = (op: Problem['op'], a: number, b: number, c: number, unknown: Problem['unknown'] = 'c'): Problem => ({ op, a, b, c, unknown });

describe('makeChoices', () => {
  it('gives 4 distinct choices in 0..R, one of them correct, for every kind of problem', () => {
    for (const range of ALL_RANGES) {
      for (let seed = 0; seed < 60; seed++) {
        const rng = seededRng(seed + range);
        for (const prob of generateRound({ ops: [...ALL_OPS], range, missingNumber: true }, rng, 10)) {
          const choices = makeChoices(prob, range, rng);
          expect(choices).toHaveLength(CHOICE_COUNT);
          expect(new Set(choices).size).toBe(CHOICE_COUNT);
          expect(choices).toContain(answerOf(prob));
          for (const n of choices) {
            expect(Number.isInteger(n)).toBe(true);
            expect(n).toBeGreaterThanOrEqual(0);
            expect(n).toBeLessThanOrEqual(range);
          }
        }
      }
    }
  });

  it('uses the spec distractors when they fit', () => {
    // 8 + 5 = 13 at 0–100: wrong operation 3, swapped digits 31, ±1 → 12, 14, ±10 → 23 (and 3)
    const allowed = new Set([3, 31, 12, 14, 23]);
    for (let seed = 0; seed < 20; seed++) {
      const choices = makeChoices(p('add', 8, 5, 13), 100, seededRng(seed));
      for (const n of choices.filter((x) => x !== 13)) {
        expect(allowed.has(n)).toBe(true);
      }
    }
  });

  it('adds ±10 only from 0–100 up', () => {
    for (let seed = 0; seed < 30; seed++) {
      const choices = makeChoices(p('add', 12, 3, 15), 20, seededRng(seed));
      expect(choices).not.toContain(5);
      expect(choices.every((n) => n <= 20)).toBe(true);
    }
  });

  it('shuffles the position of the correct answer', () => {
    const positions = new Set<number>();
    for (let seed = 0; seed < 40; seed++) positions.add(makeChoices(p('mul', 6, 7, 42), 100, seededRng(seed)).indexOf(42));
    expect(positions.size).toBe(CHOICE_COUNT);
  });

  it('fills in nearby numbers when a small range leaves too few distractors', () => {
    const choices = makeChoices(p('add', 0, 0, 0), 10, seededRng(1));
    expect(new Set(choices).size).toBe(4);
    expect(choices).toContain(0);
  });
});

describe('distractor helpers', () => {
  it('wrong operation', () => {
    expect(wrongOperationResult(p('add', 8, 5, 13))).toBe(3);
    expect(wrongOperationResult(p('sub', 13, 5, 8))).toBe(18);
    expect(wrongOperationResult(p('mul', 6, 7, 42))).toBe(13);
    expect(wrongOperationResult(p('add', 8, 5, 13, 'b'))).toBe(21);
    expect(wrongOperationResult(p('div', 56, 8, 7, 'a'))).toBe(7 / 8);
  });
  it('swapped digits', () => {
    expect(swappedDigits(13)).toBe(31);
    expect(swappedDigits(7)).toBeNull();
    expect(swappedDigits(22)).toBeNull();
    expect(swappedDigits(120)).toBe(21);
  });
});
