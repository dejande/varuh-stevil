import { IntlMessageFormat } from 'intl-messageformat';
import type { Lang } from '../core/types';
import en from './en.json';
import sl from './sl.json';

export type MessageKey = keyof typeof en;
export type Values = Record<string, string | number>;

const DICTS: Record<Lang, Record<string, string>> = { sl, en };
const cache = new Map<string, IntlMessageFormat>();

export function hasKey(key: string): boolean {
  return key in DICTS.sl && key in DICTS.en;
}

/** Formats an ICU message. Unknown keys return the key itself so a gap is visible, never a crash. */
export function translate(lang: Lang, key: MessageKey | string, values: Values = {}): string {
  const source = DICTS[lang][key];
  if (source === undefined) return key;
  const id = `${lang}:${key}`;
  let fmt = cache.get(id);
  if (!fmt) {
    fmt = new IntlMessageFormat(source, lang);
    cache.set(id, fmt);
  }
  return String(fmt.format(values));
}
