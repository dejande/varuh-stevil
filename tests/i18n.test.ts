import { describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM build script without type declarations
import { checkMessages, loadMessages } from '../scripts/check-i18n.mjs';
import { translate } from '../src/i18n/i18n';

describe('i18n', () => {
  it('sl.json and en.json pass the build check', () => {
    expect(checkMessages(loadMessages())).toEqual([]);
  });

  it('the check catches a missing key, a placeholder mismatch and a missing Slovene dual', () => {
    const errors: string[] = checkMessages({
      sl: { a: 'x', b: '{n}', c: '{count, plural, one {#} other {#}}' },
      en: { b: '{m}', c: '{count, plural, one {#} other {#}}' },
    });
    expect(errors.some((e) => e.includes('en.json: missing key "a"'))).toBe(true);
    expect(errors.some((e) => e.includes('"b": placeholders differ'))).toBe(true);
    expect(errors.some((e) => e.includes('lacks "two"'))).toBe(true);
  });

  it('uses the Slovene dual and few forms', () => {
    const stars = (n: number) => translate('sl', 'result.stars', { count: n });
    expect(stars(1)).toBe('1 zvezdica');
    expect(stars(2)).toBe('2 zvezdici');
    expect(stars(3)).toBe('3 zvezdice');
    expect(stars(4)).toBe('4 zvezdice');
    expect(stars(5)).toBe('5 zvezdic');
    expect(stars(101)).toBe('101 zvezdica');
    expect(stars(102)).toBe('102 zvezdici');
  });

  it('uses English plurals', () => {
    expect(translate('en', 'result.stars', { count: 1 })).toBe('1 star');
    expect(translate('en', 'result.stars', { count: 3 })).toBe('3 stars');
  });

  it('selects Slovene verb forms by hero gender', () => {
    expect(translate('sl', 'result.won', { gender: 'girl' })).toBe('Zmagala si!');
    expect(translate('sl', 'result.won', { gender: 'boy' })).toBe('Zmagal si!');
  });
});
