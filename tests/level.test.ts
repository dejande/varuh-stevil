import { describe, expect, it } from 'vitest';
import { answerOf, factKey } from '../src/core/facts';
import { HEARTS_PER_LEVEL, LevelSession, RETRY_MAX, RETRY_MIN } from '../src/core/level';
import { seededRng } from '../src/core/rng';
import { targetSeconds } from '../src/core/speed';
import type { PracticeSettings } from '../src/core/types';

const settings: PracticeSettings = { ops: ['add', 'sub', 'mul', 'div'], range: 20, missingNumber: true };

function assertNoRepeats(s: LevelSession) {
  for (let i = 1; i < s.queue.length; i++) expect(factKey(s.queue[i])).not.toBe(factKey(s.queue[i - 1]));
}

describe('LevelSession', () => {
  it('wins with 3 stars when every answer is right', () => {
    const s = new LevelSession(settings, seededRng(3));
    while (s.state === 'playing') expect(s.answer(answerOf(s.current!)).correct).toBe(true);
    expect(s.state).toBe('won');
    expect(s.defeated).toBe(10);
    expect(s.stars).toBe(3);
  });

  it('brings a wrong fact back 3–5 problems later, never next to itself', () => {
    for (let seed = 0; seed < 300; seed++) {
      const s = new LevelSession(settings, seededRng(seed));
      const steps = seed % 12;
      for (let i = 0; i < steps && s.state === 'playing'; i++) s.answer(answerOf(s.current!));
      if (s.state !== 'playing') continue;
      const wrong = s.current!;
      s.answer(-1);
      const pos = s.queue.findIndex((p) => p === wrong) + 1;
      expect(pos).toBeGreaterThanOrEqual(RETRY_MIN);
      expect(pos).toBeLessThanOrEqual(RETRY_MAX);
      assertNoRepeats(s);
    }
  });

  it('keeps the level going until the wrong fact is answered', () => {
    const s = new LevelSession(settings, seededRng(11));
    while (s.remaining > 1) s.answer(answerOf(s.current!));
    s.answer(-1);
    expect(s.state).toBe('playing');
    expect(s.remaining).toBeGreaterThanOrEqual(RETRY_MIN);
    while (s.state === 'playing') s.answer(answerOf(s.current!));
    expect(s.state).toBe('won');
    expect(s.mistakes).toBe(1);
    expect(s.stars).toBe(3);
  });

  it('scores stars by hearts and mistakes', () => {
    const s = new LevelSession(settings, seededRng(5));
    s.answer(-1);
    s.answer(-1);
    while (s.state === 'playing') s.answer(answerOf(s.current!));
    expect(s.stars).toBe(2);

    const t = new LevelSession(settings, seededRng(6));
    t.timeout();
    t.loseHeart();
    while (t.state === 'playing') t.answer(answerOf(t.current!));
    expect(t.hearts).toBe(HEARTS_PER_LEVEL - 1);
    expect(t.stars).toBe(2);

    const u = new LevelSession(settings, seededRng(7));
    for (let i = 0; i < 4; i++) u.answer(-1);
    while (u.state === 'playing') u.answer(answerOf(u.current!));
    expect(u.stars).toBe(1);
  });

  it('ends the level when all hearts are lost', () => {
    const s = new LevelSession(settings, seededRng(9));
    for (let i = 0; i < HEARTS_PER_LEVEL; i++) s.loseHeart();
    expect(s.state).toBe('lost');
    expect(s.stars).toBe(0);
    expect(() => s.answer(1)).toThrow();
  });
});

describe('targetSeconds', () => {
  it('matches §2', () => {
    expect(targetSeconds(10, 'normal')).toBe(12);
    expect(targetSeconds(20, 'normal')).toBe(12);
    expect(targetSeconds(100, 'normal')).toBe(15);
    expect(targetSeconds(1000, 'normal')).toBe(20);
    expect(targetSeconds(1000, 'fast')).toBeCloseTo(14);
    expect(targetSeconds(10, 'relaxed')).toBeNull();
  });
});
