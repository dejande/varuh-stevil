export type Op = 'add' | 'sub' | 'mul' | 'div';
export type Range = 10 | 20 | 100 | 1000;
export type Speed = 'relaxed' | 'normal' | 'fast';
export type Lang = 'sl' | 'en';
export type Gender = 'girl' | 'boy';

export const ALL_OPS: readonly Op[] = ['add', 'sub', 'mul', 'div'];
export const ALL_RANGES: readonly Range[] = [10, 20, 100, 1000];

/** Which of the three numbers in `a op b = c` the child has to find. */
export type Unknown = 'a' | 'b' | 'c';

export interface Problem {
  op: Op;
  a: number;
  b: number;
  c: number;
  unknown: Unknown;
}

export interface PracticeSettings {
  ops: Op[];
  range: Range;
  missingNumber: boolean;
}

export type InputMode = 'keypad' | 'choices';
export const ALL_SPEEDS: readonly Speed[] = ['relaxed', 'normal', 'fast'];
export const ALL_LANGS: readonly Lang[] = ['sl', 'en'];
export const ALL_INPUT_MODES: readonly InputMode[] = ['keypad', 'choices'];

export interface ProfileProgress {
  prologueSeen: boolean;
}

export interface Profile {
  id: string;
  /** The child's name as the parent types it; shown on the player picker. */
  name: string;
  /** Shown in the story; defaults to the name, at most 12 characters. */
  heroName: string;
  gender: Gender;
  /** Hero colour preset, see HERO_LOOKS. */
  look: string;
  lang: Lang;
  inputMode: InputMode;
  speed: Speed;
  settings: PracticeSettings;
  progress: ProfileProgress;
  createdAt: number;
}
