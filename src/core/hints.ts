import { expr, opSymbol } from './format';
import type { Lang, Problem } from './types';

export interface Hint {
  /** i18n key under `hint.` */
  key: string;
  values: Record<string, string | number>;
}

const eq = (left: string, right: string) => `${left} = ${right}`;

/** The one strategy line shown after a wrong answer (§5), or null when no strategy fits. */
export function pickHint(p: Problem, lang: Lang): Hint | null {
  if (p.unknown !== 'c') return missingHint(p, lang);
  switch (p.op) {
    case 'add':
      return addHint(p, lang);
    case 'sub':
      return subHint(p, lang);
    case 'mul':
      return mulHint(p, lang);
    case 'div':
      return { key: 'hint.div.turnAround', values: { expr: `${expr(lang, p.a, ['div', p.b])} → ${eq(expr(lang, p.c, ['mul', p.b]), String(p.a))}` } };
  }
}

function missingHint(p: Problem, lang: Lang): Hint {
  const { a, b, c } = p;
  let e: string;
  switch (p.op) {
    case 'add':
      e = p.unknown === 'b' ? eq(expr(lang, c, ['sub', a]), String(b)) : eq(expr(lang, c, ['sub', b]), String(a));
      break;
    case 'sub':
      e = p.unknown === 'b' ? eq(expr(lang, a, ['sub', c]), String(b)) : eq(expr(lang, c, ['add', b]), String(a));
      break;
    case 'mul':
      e = p.unknown === 'b' ? eq(expr(lang, c, ['div', a]), String(b)) : eq(expr(lang, c, ['div', b]), String(a));
      break;
    case 'div':
      e = p.unknown === 'b' ? eq(expr(lang, a, ['div', c]), String(b)) : eq(expr(lang, c, ['mul', b]), String(a));
      break;
  }
  return { key: 'hint.missing.turnAround', values: { expr: e } };
}

function addHint(p: Problem, lang: Lang): Hint | null {
  const { a, b, c } = p;
  const lhs = expr(lang, a, ['add', b]);
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  if (hi - lo === 1 && lo >= 2 && hi < 10) {
    return { key: 'hint.add.doubles', values: { expr: eq(lhs, expr(lang, lo, ['add', lo], ['add', 1])) } };
  }
  if (hi < 10 && lo >= 2 && c > 10) {
    const need = 10 - hi;
    return { key: 'hint.add.make10', values: { expr: eq(lhs, expr(lang, hi, ['add', need], ['add', lo - need])) } };
  }
  if (a >= 10 && b >= 10 && b % 10 !== 0) {
    const tens = b - (b % 10);
    return { key: 'hint.add.tensFirst', values: { expr: eq(lhs, expr(lang, a + tens, ['add', b % 10])) } };
  }
  return null;
}

function subHint(p: Problem, lang: Lang): Hint | null {
  const { a, b, c } = p;
  const lhs = expr(lang, a, ['sub', b]);
  const ones = a % 10;
  if (a > 10 && b < 10 && ones > 0 && b > ones) {
    return { key: 'hint.sub.through10', values: { expr: eq(lhs, expr(lang, a, ['sub', ones], ['sub', b - ones])) } };
  }
  if (b >= 2 && c >= 1 && c <= 10) {
    return { key: 'hint.sub.countUp', values: { expr: lhs, from: b, to: a, diff: c } };
  }
  if (b >= 10 && b % 10 !== 0) {
    const tens = b - (b % 10);
    return { key: 'hint.sub.tensFirst', values: { expr: eq(lhs, expr(lang, a - tens, ['sub', b % 10])) } };
  }
  return null;
}

function mulHint(p: Problem, lang: Lang): Hint | null {
  const { a, b } = p;
  const lhs = expr(lang, a, ['mul', b]);
  if (a === 0 || b === 0) return { key: 'hint.mul.zero', values: { expr: eq(lhs, '0') } };
  if (a === 1 || b === 1) return { key: 'hint.mul.one', values: { expr: eq(lhs, String(a * b)) } };
  if (a === 9 || b === 9) {
    const other = a === 9 ? b : a;
    return { key: 'hint.mul.neighbour', values: { expr: eq(lhs, expr(lang, 10, ['mul', other], ['sub', other])) } };
  }
  if (a === 4 || b === 4) {
    const other = a === 4 ? b : a;
    return { key: 'hint.mul.doubling', values: { expr: eq(lhs, expr(lang, 2, ['mul', other], ['mul', 2])) } };
  }
  if (a === 2 || b === 2) {
    const other = a === 2 ? b : a;
    return { key: 'hint.mul.double', values: { expr: eq(lhs, expr(lang, other, ['add', other])) } };
  }
  if ((a === 5 || b === 5) && Math.max(a, b) <= 10) {
    const other = a === 5 ? b : a;
    return { key: 'hint.mul.five', values: { expr: eq(lhs, expr(lang, 10, ['mul', other], ['div', 2])) } };
  }
  const small = Math.min(a, b);
  const big = Math.max(a, b);
  if (big > 10) {
    if (big % 10 === 0) {
      return { key: 'hint.mul.tens', values: { expr: eq(lhs, expr(lang, small, ['mul', big / 10], ['mul', 10])) } };
    }
    const tens = big - (big % 10);
    const split = `${expr(lang, small, ['mul', tens])} ${opSymbol('add', lang)} ${expr(lang, small, ['mul', big % 10])}`;
    return { key: 'hint.mul.split', values: { expr: eq(lhs, split) } };
  }
  if (a !== b) return { key: 'hint.mul.swap', values: { expr: eq(lhs, expr(lang, b, ['mul', a])) } };
  return null;
}
