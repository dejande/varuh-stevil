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

export interface Profile {
  name: string;
  heroName: string;
  gender: Gender;
  lang: Lang;
  speed: Speed;
  settings: PracticeSettings;
}
