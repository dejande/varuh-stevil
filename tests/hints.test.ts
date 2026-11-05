import { describe, expect, it } from 'vitest';
import { generateRound } from '../src/core/generator';
import { pickHint } from '../src/core/hints';
import { seededRng } from '../src/core/rng';
import { ALL_OPS, ALL_RANGES, type Problem } from '../src/core/types';
import { hasKey } from '../src/i18n/i18n';

const p = (op: Problem['op'], a: number, b: number, c: number, unknown: Problem['unknown'] = 'c'): Problem => ({ op, a, b, c, unknown });

describe('pickHint', () => {
  it.each([
    [p('add', 8, 5, 13), 'hint.add.make10', '8 + 5 = 8 + 2 + 3'],
    [p('add', 6, 7, 13), 'hint.add.doubles', '6 + 7 = 6 + 6 + 1'],
    [p('add', 47, 25, 72), 'hint.add.tensFirst', '47 + 25 = 67 + 5'],
    [p('sub', 15, 7, 8), 'hint.sub.through10', '15 − 7 = 15 − 5 − 2'],
    [p('mul', 9, 7, 63), 'hint.mul.neighbour', '9 · 7 = 10 · 7 − 7'],
    [p('mul', 4, 6, 24), 'hint.mul.doubling', '4 · 6 = 2 · 6 · 2'],
    [p('mul', 3, 8, 24), 'hint.mul.swap', '3 · 8 = 8 · 3'],
    [p('mul', 6, 2, 12), 'hint.mul.double', '6 · 2 = 6 + 6'],
    [p('mul', 5, 8, 40), 'hint.mul.five', '5 · 8 = 10 · 8 : 2'],
    [p('mul', 7, 6, 42), 'hint.mul.swap', '7 · 6 = 6 · 7'],
    [p('div', 56, 8, 7), 'hint.div.turnAround', '56 : 8 → 7 · 8 = 56'],
    [p('add', 8, 5, 13, 'b'), 'hint.missing.turnAround', '13 − 8 = 5'],
  ])('%o → %s', (problem, key, e) => {
    const hint = pickHint(problem, 'sl');
    expect(hint?.key).toBe(key);
    expect(hint?.values.expr).toBe(e);
  });

  it('counts up for a small difference', () => {
    expect(pickHint(p('sub', 13, 8, 5), 'en')).toMatchObject({ key: 'hint.sub.through10' });
    expect(pickHint(p('sub', 20, 13, 7), 'en')).toMatchObject({ key: 'hint.sub.countUp', values: { from: 13, to: 20, diff: 7 } });
  });

  it('uses English notation in English', () => {
    expect(pickHint(p('mul', 9, 7, 63), 'en')?.values.expr).toBe('9 × 7 = 10 × 7 − 7');
  });

  it('returns no hint when no strategy fits', () => {
    expect(pickHint(p('add', 2, 4, 6), 'en')).toBeNull();
    expect(pickHint(p('mul', 7, 7, 49), 'en')).toBeNull();
  });

  it('only uses keys that exist in both languages, and every hint equation is true', () => {
    for (const range of ALL_RANGES) {
      for (let seed = 0; seed < 30; seed++) {
        for (const prob of generateRound({ ops: [...ALL_OPS], range, missingNumber: true }, seededRng(seed), 10)) {
          const hint = pickHint(prob, 'en');
          if (!hint) continue;
          expect(hasKey(hint.key)).toBe(true);
          const e = String(hint.values.expr ?? '');
          const tail = e.includes('→') ? e.split('→')[1] : e;
          if (!tail.includes('=')) continue;
          const [l, r] = tail.split('=');
          const js = (s: string) => s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
          expect(Function(`return (${js(l)})`)()).toBe(Function(`return (${js(r)})`)());
        }
      }
    }
  });
});
