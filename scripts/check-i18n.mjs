// Fails (exit 1) when sl.json and en.json differ in keys, placeholders or ICU syntax,
// or when a plural misses a category the language needs (Slovene has one/two/few/other).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse, TYPE } from '@formatjs/icu-messageformat-parser';

export const LANGS = ['sl', 'en'];
const REQUIRED_PLURAL = {
  sl: ['one', 'two', 'few', 'other'],
  en: ['one', 'other'],
};

function walk(elements, args, plurals) {
  for (const el of elements) {
    if (el.type === TYPE.literal || el.type === TYPE.pound) continue;
    if ('value' in el && typeof el.value === 'string') args.add(el.value);
    if (el.type === TYPE.plural) plurals.push(el);
    if (el.type === TYPE.plural || el.type === TYPE.select) {
      for (const opt of Object.values(el.options)) walk(opt.value, args, plurals);
    }
    if (el.type === TYPE.tag) walk(el.children, args, plurals);
  }
}

function describe(message) {
  const args = new Set();
  const plurals = [];
  walk(parse(message), args, plurals);
  return { args, plurals };
}

/** @param {Record<string, Record<string, string>>} dicts */
export function checkMessages(dicts) {
  const errors = [];
  const allKeys = new Set(LANGS.flatMap((l) => Object.keys(dicts[l])));
  for (const key of [...allKeys].sort()) {
    const info = {};
    for (const lang of LANGS) {
      const msg = dicts[lang][key];
      if (typeof msg !== 'string') {
        errors.push(`${lang}.json: missing key "${key}"`);
        continue;
      }
      try {
        info[lang] = describe(msg);
      } catch (e) {
        errors.push(`${lang}.json: "${key}" is not valid ICU: ${e.message}`);
        continue;
      }
      for (const p of info[lang].plurals) {
        for (const cat of REQUIRED_PLURAL[lang]) {
          if (!(cat in p.options)) errors.push(`${lang}.json: "${key}" plural {${p.value}} lacks "${cat}"`);
        }
      }
    }
    if (info.sl && info.en) {
      const a = [...info.sl.args].sort().join(',');
      const b = [...info.en.args].sort().join(',');
      if (a !== b) errors.push(`"${key}": placeholders differ (sl: ${a || '-'} / en: ${b || '-'})`);
    }
  }
  return errors;
}

export function loadMessages() {
  const dir = new URL('../src/i18n/', import.meta.url);
  return Object.fromEntries(LANGS.map((l) => [l, JSON.parse(readFileSync(new URL(`${l}.json`, dir), 'utf8'))]));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = checkMessages(loadMessages());
  if (errors.length > 0) {
    console.error(`i18n check failed:\n  ${errors.join('\n  ')}`);
    process.exit(1);
  }
  console.log('i18n check passed');
}
