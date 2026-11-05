import { IntlMessageFormat } from 'intl-messageformat';
import type { Gender, Lang } from '../core/types';
import en from './story.en.json';
import sl from './story.sl.json';

/**
 * Frozen story text (spec §8). The files change only when Dejan edits them on purpose;
 * the game never generates or shuffles story text. Only {hero} and {gender} are filled in at runtime.
 */
export type StoryKey = keyof typeof en;

const STORIES: Record<Lang, Record<StoryKey, string[]>> = { sl, en };

export function storyPanels(lang: Lang, key: StoryKey, hero: string, gender: Gender): string[] {
  return STORIES[lang][key].map((src) => String(new IntlMessageFormat(src, lang).format({ hero, gender })));
}

/** Joins one-letter words (z, v, s, k, a, o, i) to the next word, so none is left alone at the end of a line. */
export function keepShortWords(text: string): string {
  return text.replace(/(^|[\s»"“„(])([\p{L}])\s+/gu, '$1$2 ');
}
