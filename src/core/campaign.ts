import type { ProfileProgress } from './types';

/**
 * The story campaign (spec §2, §8): 5 chapters, each with 5 levels and a boss.
 * Finishing a level unlocks the next; a boss also needs 10 stars from its chapter's levels.
 */
export const CHAPTER_COUNT = 5;
export const LEVELS_PER_CHAPTER = 5;
export const BOSS_STARS_NEEDED = 10;
export const BOSS_HP = 15;

/** A story stage: chapter 1–5, level 1–5, or the chapter's boss. */
export interface Stage {
  chapter: number;
  level: number | 'boss';
}

export function stageId(s: Stage): string {
  return s.level === 'boss' ? `c${s.chapter}boss` : `c${s.chapter}l${s.level}`;
}

export function starsFor(progress: ProfileProgress, s: Stage): number {
  return progress.stars[stageId(s)] ?? 0;
}

export function isFinished(progress: ProfileProgress, s: Stage): boolean {
  return starsFor(progress, s) > 0;
}

/** Stars from the chapter's five normal levels (the boss's own stars do not count toward it). */
export function chapterStars(progress: ProfileProgress, chapter: number): number {
  let sum = 0;
  for (let level = 1; level <= LEVELS_PER_CHAPTER; level++) sum += starsFor(progress, { chapter, level });
  return sum;
}

export function stagesOf(chapter: number): Stage[] {
  return [...Array.from({ length: LEVELS_PER_CHAPTER }, (_, i) => ({ chapter, level: i + 1 })), { chapter, level: 'boss' as const }];
}

export function isUnlocked(progress: ProfileProgress, s: Stage): boolean {
  if (s.level === 'boss') {
    return isFinished(progress, { chapter: s.chapter, level: LEVELS_PER_CHAPTER }) && chapterStars(progress, s.chapter) >= BOSS_STARS_NEEDED;
  }
  if (s.level > 1) return isFinished(progress, { chapter: s.chapter, level: s.level - 1 });
  if (s.chapter === 1) return true;
  return isFinished(progress, { chapter: s.chapter - 1, level: 'boss' });
}

export function isChapterOpen(progress: ProfileProgress, chapter: number): boolean {
  return isUnlocked(progress, { chapter, level: 1 });
}

/** Keeps the best result; a lost level (0 stars) changes nothing. */
export function recordStars(progress: ProfileProgress, s: Stage, stars: number): ProfileProgress {
  if (stars <= 0 || stars <= starsFor(progress, s)) return progress;
  return { ...progress, stars: { ...progress.stars, [stageId(s)]: Math.min(3, stars) } };
}

/** The stage after this one in story order, or null after the last boss. */
export function nextStage(s: Stage): Stage | null {
  if (s.level === 'boss') return s.chapter < CHAPTER_COUNT ? { chapter: s.chapter + 1, level: 1 } : null;
  return s.level < LEVELS_PER_CHAPTER ? { chapter: s.chapter, level: s.level + 1 } : { chapter: s.chapter, level: 'boss' };
}

/** Where the child should continue: the first unlocked stage not yet finished, else the last unlocked one. */
export function currentStage(progress: ProfileProgress): Stage {
  let last: Stage = { chapter: 1, level: 1 };
  for (let chapter = 1; chapter <= CHAPTER_COUNT; chapter++) {
    for (const s of stagesOf(chapter)) {
      if (!isUnlocked(progress, s)) return last;
      if (!isFinished(progress, s)) return s;
      last = s;
    }
  }
  return last;
}

export function totalStars(progress: ProfileProgress): number {
  return Object.values(progress.stars).reduce((a, b) => a + b, 0);
}
