import { describe, expect, it } from 'vitest';
import { formatProblem } from '../src/core/format';
import type { Problem } from '../src/core/types';

const mul: Problem = { op: 'mul', a: 8, b: 5, c: 40, unknown: 'c' };
const div: Problem = { op: 'div', a: 56, b: 8, c: 7, unknown: 'b' };

describe('formatProblem', () => {
  it('uses · and : in Slovene', () => {
    expect(formatProblem(mul, 'sl')).toBe('8 · 5 = ?');
    expect(formatProblem(div, 'sl')).toBe('56 : ? = 7');
  });
  it('uses × and ÷ in English', () => {
    expect(formatProblem(mul, 'en')).toBe('8 × 5 = ?');
    expect(formatProblem(div, 'en')).toBe('56 ÷ ? = 7');
  });
  it('shows the typed answer in place of the blank', () => {
    expect(formatProblem(mul, 'en', '4')).toBe('8 × 5 = 4');
  });
});
