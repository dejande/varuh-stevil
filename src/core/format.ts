import type { Lang, Op, Problem } from './types';

const SYMBOLS: Record<Lang, Record<Op, string>> = {
  // Slovene schools write · for times and : for divide.
  sl: { add: '+', sub: '−', mul: '·', div: ':' },
  en: { add: '+', sub: '−', mul: '×', div: '÷' },
};

export function opSymbol(op: Op, lang: Lang): string {
  return SYMBOLS[lang][op];
}

export const BLANK = '?';

/** `8 · 5 = ?`, `8 · ? = 40`, with `answer` shown in place of the blank when given. */
export function formatProblem(p: Problem, lang: Lang, answer?: string): string {
  const show = (k: 'a' | 'b' | 'c') => (p.unknown === k ? (answer && answer.length > 0 ? answer : BLANK) : String(p[k]));
  return `${show('a')} ${opSymbol(p.op, lang)} ${show('b')} = ${show('c')}`;
}

/** Builds an expression like `8 + 2 + 3` from numbers and ops in the profile's notation. */
export function expr(lang: Lang, first: number, ...rest: [Op, number][]): string {
  return rest.reduce((s, [op, n]) => `${s} ${opSymbol(op, lang)} ${n}`, String(first));
}
