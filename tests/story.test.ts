import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM build script without type declarations
import { checkStories, heroPositionErrors, loadStories } from '../scripts/check-i18n.mjs';
import { keepShortWords, storyPanels } from '../src/story/story';

/** The prologue exactly as approved in docs/spec.md §8, with the hero placeholder filled in. */
function specPrologue(lang: 'SL' | 'EN'): string {
  const spec = readFileSync(new URL('../docs/spec.md', import.meta.url), 'utf8');
  const line = spec.split('\n').find((l) => l.startsWith(`- **${lang}:**`) && l.includes('{hero}'));
  if (!line) throw new Error(`Prologue ${lang} not found in spec`);
  return line.replace(`- **${lang}:** `, '').trim();
}

describe('prologue', () => {
  it('story files match the frozen text in the spec, panel by panel', () => {
    const stories = loadStories();
    expect(stories.sl.prologue.join(' ')).toBe(specPrologue('SL'));
    expect(stories.en.prologue.join(' ')).toBe(specPrologue('EN'));
  });

  it('the epilogue matches the spec word for word', () => {
    const spec = readFileSync(new URL('../docs/spec.md', import.meta.url), 'utf8');
    const epilogue = spec.slice(spec.indexOf('### Epilogue'));
    const line = (lang: string) => epilogue.split('\n').find((l) => l.startsWith(`- **${lang}:**`))!.replace(`- **${lang}:** `, '').replace(/ \(This line.*\)$/, '').trim();
    const stories = loadStories();
    expect(stories.sl.epilogue.join(' ')).toBe(line('SL'));
    expect(stories.en.epilogue.join(' ')).toBe(line('EN'));
  });

  it('has 5 chapters with 5 panels each, an outro per boss, and the names', () => {
    const stories = loadStories();
    for (const lang of ['sl', 'en'] as const) {
      const st = stories[lang];
      expect(st.chapterNames).toHaveLength(5);
      expect(st.bossNames).toHaveLength(5);
      for (let c = 1; c <= 5; c++) {
        expect(st[`chapter${c}`]).toHaveLength(5);
        expect(st[`outro${c}`].length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('fills in the hero name and the Slovene gender forms', () => {
    const girl = storyPanels('sl', 'prologue', 'Nika', 'girl');
    expect(girl[3]).toBe('Kozliček Rogec pride k tebi: »Nika, ti si zadnja Varuhinja števil. Pomagaj nam!«');
    const boy = storyPanels('sl', 'prologue', 'Žan', 'boy');
    expect(boy[3]).toContain('»Žan, ti si zadnji Varuh števil.');
    const en = storyPanels('en', 'prologue', 'Eva', 'girl');
    expect(en[3]).toBe('Rogec the little ibex comes to you: "Eva, you are the last Keeper of Numbers. Help us!"');
    expect(en[2]).toContain("can't");
  });

  it('keeps panels short (1–3 sentences)', () => {
    for (const lang of ['sl', 'en'] as const) {
      for (const panel of storyPanels(lang, 'prologue', 'Nika', 'girl')) {
        const sentences = panel.split(/[.!?](?=\s|»|"|$)/).filter((x) => x.trim().length > 1);
        expect(sentences.length).toBeGreaterThanOrEqual(1);
        expect(sentences.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it('the story files pass the build check', () => {
    expect(checkStories(loadStories())).toEqual([]);
  });

  it('the check rejects {hero} where Slovene would decline the name', () => {
    expect(heroPositionErrors('sl', 'x', 'Rogec pomaga {hero}.')).toHaveLength(1);
    expect(heroPositionErrors('sl', 'x', 'Z {hero} gremo v gore.')).toHaveLength(1);
    expect(heroPositionErrors('sl', 'x', '{hero} je prišla v vas.')).toEqual([]);
    expect(heroPositionErrors('sl', 'x', 'Rogec reče: »{hero}, pomagaj nam!«')).toEqual([]);
  });

  it('the check rejects different panel counts and placeholders', () => {
    const errors: string[] = checkStories({
      sl: { a: ['Ena.', 'Dva.'], b: ['{hero}, pridi!'] },
      en: { a: ['One.'], b: ['Come!'] },
    });
    expect(errors.some((e) => e.includes('2 panels in Slovene, 1 in English'))).toBe(true);
    expect(errors.some((e) => e.includes('placeholders differ'))).toBe(true);
  });

  it('keeps one-letter words with the next word', () => {
    expect(keepShortWords('Z njo je prišel Pozabnik in pobral vsa števila.')).toBe('Z\u00a0njo je prišel Pozabnik in pobral vsa števila.');
    expect(keepShortWords('pride k tebi v dolino')).toBe('pride k\u00a0tebi v\u00a0dolino');
    expect(keepShortWords('A Keeper of Numbers')).toBe('A\u00a0Keeper of Numbers');
  });
});
