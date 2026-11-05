import { ALL_INPUT_MODES, ALL_LANGS, ALL_OPS, ALL_RANGES, ALL_SPEEDS, type Gender, type Lang, type Op, type Profile, type Range } from './types';

export const MAX_PROFILES = 6;
export const MAX_NAME_LENGTH = 20;
export const MAX_HERO_NAME_LENGTH = 12;

export interface HeroLook {
  id: string;
  cape: string;
  hat: string;
}

/** Preset hero colours (spec §6 "hero look"); real hero art arrives with the milestone 5 art pass. */
export const HERO_LOOKS: readonly HeroLook[] = [
  { id: 'blue', cape: '#23408e', hat: '#2f6b4f' },
  { id: 'red', cape: '#b83a2a', hat: '#23408e' },
  { id: 'green', cape: '#2f7d4f', hat: '#6b4a2b' },
  { id: 'purple', cape: '#6a4c9c', hat: '#2f6b4f' },
  { id: 'teal', cape: '#1f7a7a', hat: '#b83a2a' },
  { id: 'gold', cape: '#c98a17', hat: '#23408e' },
];

export function heroLook(id: string): HeroLook {
  return HERO_LOOKS.find((l) => l.id === id) ?? HERO_LOOKS[0];
}

/** What the parent fills in when creating or editing a player. */
export type ProfileInput = Omit<Profile, 'id' | 'progress' | 'createdAt'>;

export function defaultProfileInput(lang: Lang = 'sl'): ProfileInput {
  return {
    name: '',
    heroName: '',
    gender: 'girl',
    look: HERO_LOOKS[0].id,
    lang,
    inputMode: 'keypad',
    speed: 'normal',
    settings: { ops: ['add', 'sub'], range: 20, missingNumber: false },
  };
}

function clean(s: unknown, max: number): string {
  return typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export type ProfileError = 'nameRequired' | 'needOp';

/** Checks and normalises the editor input. The hero name falls back to the name, cut to 12 characters. */
export function normalizeInput(input: ProfileInput): { value: ProfileInput; errors: ProfileError[] } {
  const name = clean(input.name, MAX_NAME_LENGTH);
  const heroName = clean(input.heroName, MAX_HERO_NAME_LENGTH) || name.slice(0, MAX_HERO_NAME_LENGTH).trim();
  const ops = ALL_OPS.filter((op) => input.settings.ops.includes(op));
  const errors: ProfileError[] = [];
  if (!name) errors.push('nameRequired');
  if (ops.length === 0) errors.push('needOp');
  return {
    value: { ...input, name, heroName, settings: { ...input.settings, ops } },
    errors,
  };
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createProfile(input: ProfileInput, now = Date.now()): Profile {
  return { ...input, id: newId(), progress: { prologueSeen: false }, createdAt: now };
}

/** Story progress and (later) statistics go back to the start; settings stay. */
export function resetProgress(p: Profile): Profile {
  return { ...p, progress: { prologueSeen: false } };
}

const pickOne = <T>(value: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);

/**
 * Turns whatever was stored (older versions, hand-edited exports) into a valid profile,
 * or null when it is not recognisable as one.
 */
export function sanitizeProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = clean(r.name, MAX_NAME_LENGTH);
  if (typeof r.id !== 'string' || !r.id || !name) return null;
  const d = defaultProfileInput();
  const s = (r.settings && typeof r.settings === 'object' ? r.settings : {}) as Record<string, unknown>;
  const ops = Array.isArray(s.ops) ? ALL_OPS.filter((op) => (s.ops as unknown[]).includes(op)) : [];
  const progress = (r.progress && typeof r.progress === 'object' ? r.progress : {}) as Record<string, unknown>;
  return {
    id: r.id,
    name,
    heroName: clean(r.heroName, MAX_HERO_NAME_LENGTH) || name.slice(0, MAX_HERO_NAME_LENGTH).trim(),
    gender: pickOne<Gender>(r.gender, ['girl', 'boy'], d.gender),
    look: pickOne(r.look, HERO_LOOKS.map((l) => l.id), d.look),
    lang: pickOne(r.lang, ALL_LANGS, d.lang),
    inputMode: pickOne(r.inputMode, ALL_INPUT_MODES, d.inputMode),
    speed: pickOne(r.speed, ALL_SPEEDS, d.speed),
    settings: {
      ops: ops.length > 0 ? (ops as Op[]) : d.settings.ops,
      range: pickOne<Range>(s.range, ALL_RANGES, d.settings.range),
      missingNumber: typeof s.missingNumber === 'boolean' ? s.missingNumber : d.settings.missingNumber,
    },
    progress: { prologueSeen: progress.prologueSeen === true },
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : 0,
  };
}
