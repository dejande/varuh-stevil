import { describe, expect, it } from 'vitest';
import {
  BOSS_HP,
  BOSS_STARS_NEEDED,
  CHAPTER_COUNT,
  chapterStars,
  currentStage,
  isChapterOpen,
  isUnlocked,
  nextStage,
  recordStars,
  stageId,
  stagesOf,
  totalStars,
  type Stage,
} from '../src/core/campaign';
import { answerOf } from '../src/core/facts';
import { LevelSession } from '../src/core/level';
import { emptyProgress } from '../src/core/profile';
import { seededRng } from '../src/core/rng';
import type { PracticeSettings, ProfileProgress } from '../src/core/types';

const finish = (p: ProfileProgress, s: Stage, stars = 3) => recordStars(p, s, stars);

describe('campaign', () => {
  it('has 5 chapters of 5 levels and a boss (30 stages)', () => {
    const all = Array.from({ length: CHAPTER_COUNT }, (_, i) => stagesOf(i + 1)).flat();
    expect(all).toHaveLength(30);
    expect(new Set(all.map(stageId)).size).toBe(30);
    expect(stageId({ chapter: 2, level: 'boss' })).toBe('c2boss');
  });

  it('starts with only the first level open', () => {
    const p = emptyProgress();
    expect(isUnlocked(p, { chapter: 1, level: 1 })).toBe(true);
    expect(isUnlocked(p, { chapter: 1, level: 2 })).toBe(false);
    expect(isChapterOpen(p, 2)).toBe(false);
    expect(currentStage(p)).toEqual({ chapter: 1, level: 1 });
  });

  it('finishing a level with any stars unlocks the next', () => {
    const p = finish(emptyProgress(), { chapter: 1, level: 1 }, 1);
    expect(isUnlocked(p, { chapter: 1, level: 2 })).toBe(true);
    expect(currentStage(p)).toEqual({ chapter: 1, level: 2 });
  });

  it('the boss needs level 5 finished and 10 stars from the chapter', () => {
    let p = emptyProgress();
    for (let level = 1; level <= 5; level++) p = finish(p, { chapter: 1, level }, 1);
    expect(chapterStars(p, 1)).toBe(5);
    expect(isUnlocked(p, { chapter: 1, level: 'boss' })).toBe(false);
    // Replaying levels for more stars opens the boss.
    p = finish(p, { chapter: 1, level: 1 }, 3);
    p = finish(p, { chapter: 1, level: 2 }, 3);
    p = finish(p, { chapter: 1, level: 3 }, 2);
    expect(chapterStars(p, 1)).toBe(BOSS_STARS_NEEDED);
    expect(isUnlocked(p, { chapter: 1, level: 'boss' })).toBe(true);
    expect(currentStage(p)).toEqual({ chapter: 1, level: 'boss' });
  });

  it('beating the boss opens the next chapter', () => {
    let p = emptyProgress();
    for (let level = 1; level <= 5; level++) p = finish(p, { chapter: 1, level });
    p = finish(p, { chapter: 1, level: 'boss' }, 1);
    expect(isChapterOpen(p, 2)).toBe(true);
    expect(currentStage(p)).toEqual({ chapter: 2, level: 1 });
  });

  it('keeps the best stars; a lost level changes nothing', () => {
    let p = finish(emptyProgress(), { chapter: 1, level: 1 }, 3);
    p = finish(p, { chapter: 1, level: 1 }, 1);
    p = finish(p, { chapter: 1, level: 2 }, 0);
    expect(p.stars).toEqual({ c1l1: 3 });
    expect(totalStars(p)).toBe(3);
  });

  it('walks the story in order and ends after the last boss', () => {
    expect(nextStage({ chapter: 1, level: 4 })).toEqual({ chapter: 1, level: 5 });
    expect(nextStage({ chapter: 1, level: 5 })).toEqual({ chapter: 1, level: 'boss' });
    expect(nextStage({ chapter: 1, level: 'boss' })).toEqual({ chapter: 2, level: 1 });
    expect(nextStage({ chapter: 5, level: 'boss' })).toBeNull();
  });
});

describe('boss fight', () => {
  const settings: PracticeSettings = { ops: ['add', 'sub'], range: 20, missingNumber: false };

  it('has 15 HP; a correct answer does 1 damage, a fast one 2', () => {
    const s = new LevelSession(settings, seededRng(1), { bossHp: BOSS_HP });
    expect(s.isBoss).toBe(true);
    expect(s.answer(answerOf(s.current!)).damage).toBe(1);
    expect(s.answer(answerOf(s.current!), { fast: true }).damage).toBe(2);
    expect(s.bossHp).toBe(BOSS_HP - 3);
    expect(s.answer(-1, { fast: true }).damage).toBe(0);
  });

  it('never runs out of problems and is won when the boss has no HP left', () => {
    const s = new LevelSession(settings, seededRng(2), { bossHp: BOSS_HP });
    let answers = 0;
    while (s.state === 'playing') {
      if (answers % 4 === 3) s.answer(-1);
      else s.answer(answerOf(s.current!));
      answers++;
      expect(s.remaining).toBeGreaterThan(0);
    }
    expect(s.state).toBe('won');
    expect(s.bossHp).toBe(0);
    expect(s.defeated).toBe(BOSS_HP);
  });

  it('eight fast answers beat it', () => {
    const s = new LevelSession(settings, seededRng(3), { bossHp: BOSS_HP });
    for (let i = 0; i < 8; i++) s.answer(answerOf(s.current!), { fast: true });
    expect(s.state).toBe('won');
    expect(s.stars).toBe(3);
  });

  it('normal levels still end after their problems', () => {
    const s = new LevelSession(settings, seededRng(4));
    expect(s.isBoss).toBe(false);
    while (s.state === 'playing') s.answer(answerOf(s.current!), { fast: true });
    expect(s.defeated).toBe(10);
  });
});
