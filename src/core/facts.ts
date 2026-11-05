import type { Op, Problem } from './types';

/** Language-neutral id of the underlying fact, e.g. `7×8`, `13−5`. */
export function factKey(p: Pick<Problem, 'op' | 'a' | 'b'>): string {
  const sym = { add: '+', sub: '−', mul: '×', div: '÷' }[p.op];
  return `${p.a}${sym}${p.b}`;
}

export function compute(op: Op, a: number, b: number): number {
  switch (op) {
    case 'add':
      return a + b;
    case 'sub':
      return a - b;
    case 'mul':
      return a * b;
    case 'div':
      return a / b;
  }
}

export function answerOf(p: Problem): number {
  return p[p.unknown];
}

function digits(n: number): number[] {
  return String(n).split('').reverse().map(Number);
}

/**
 * True when written column arithmetic needs a carry (+) or a borrow (−).
 * At 0–20 this is exactly "crossing 10".
 */
export function needsRegrouping(op: Op, a: number, b: number): boolean {
  const da = digits(a);
  const db = digits(b);
  const len = Math.max(da.length, db.length);
  if (op === 'add') {
    for (let i = 0; i < len; i++) if ((da[i] ?? 0) + (db[i] ?? 0) >= 10) return true;
    return false;
  }
  if (op === 'sub') {
    for (let i = 0; i < len; i++) if ((da[i] ?? 0) < (db[i] ?? 0)) return true;
    return false;
  }
  return false;
}

export function hasSmallOperand(p: Pick<Problem, 'a' | 'b'>): boolean {
  return p.a <= 1 || p.b <= 1;
}
