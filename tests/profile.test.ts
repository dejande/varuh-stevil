import { describe, expect, it } from 'vitest';
import { makeGateQuestion } from '../src/core/gate';
import { HERO_LOOKS, createProfile, defaultProfileInput, normalizeInput, resetProgress, sanitizeProfile } from '../src/core/profile';
import { seededRng } from '../src/core/rng';

describe('profiles', () => {
  it('hero name defaults to the name and is cut to 12 characters', () => {
    const { value, errors } = normalizeInput({ ...defaultProfileInput(), name: '  Maximilijana  Novak ', heroName: '' });
    expect(errors).toEqual([]);
    expect(value.name).toBe('Maximilijana Novak');
    expect(value.heroName).toBe('Maximilijana');
    expect(normalizeInput({ ...defaultProfileInput(), name: 'Eva', heroName: 'Zvezdica s planin' }).value.heroName).toBe('Zvezdica s p');
  });

  it('reports a missing name and missing operations', () => {
    const { errors } = normalizeInput({ ...defaultProfileInput(), name: '   ', settings: { ops: [], range: 10, missingNumber: false } });
    expect(errors).toEqual(['nameRequired', 'needOp']);
  });

  it('creates a profile with an id and no progress, and reset keeps the settings', () => {
    const input = normalizeInput({ ...defaultProfileInput('en'), name: 'Eva', speed: 'fast' }).value;
    const a = createProfile(input, 1);
    const b = createProfile(input, 2);
    expect(a.id).not.toBe(b.id);
    expect(a.progress.prologueSeen).toBe(false);
    const reset = resetProgress({ ...a, progress: { prologueSeen: true } });
    expect(reset.progress.prologueSeen).toBe(false);
    expect(reset.speed).toBe('fast');
    expect(reset.lang).toBe('en');
  });

  it('sanitizes stored data: bad fields fall back, unrecognisable entries are dropped', () => {
    expect(sanitizeProfile(null)).toBeNull();
    expect(sanitizeProfile({ id: 'x' })).toBeNull();
    const p = sanitizeProfile({
      id: 'x',
      name: 'Eva',
      gender: 'robot',
      look: 'rainbow',
      lang: 'de',
      speed: 'warp',
      inputMode: 'voice',
      settings: { ops: ['pow'], range: 50, missingNumber: 'yes' },
      progress: { prologueSeen: true },
    });
    expect(p).toMatchObject({
      id: 'x',
      name: 'Eva',
      heroName: 'Eva',
      gender: 'girl',
      look: HERO_LOOKS[0].id,
      lang: 'sl',
      speed: 'normal',
      inputMode: 'keypad',
      settings: { ops: ['add', 'sub'], range: 20, missingNumber: false },
      progress: { prologueSeen: true },
    });
  });

  it('a saved profile survives sanitizing unchanged', () => {
    const p = createProfile(normalizeInput({ ...defaultProfileInput(), name: 'Žan', gender: 'boy', look: 'teal', inputMode: 'choices' }).value);
    expect(sanitizeProfile(structuredClone(p))).toEqual(p);
  });
});

describe('parent gate', () => {
  it('asks a two-digit multiplication', () => {
    for (let seed = 0; seed < 100; seed++) {
      const q = makeGateQuestion(seededRng(seed));
      expect(q.a).toBeGreaterThanOrEqual(10);
      expect(q.a).toBeLessThanOrEqual(99);
      expect(q.b).toBeGreaterThanOrEqual(10);
      expect(q.b).toBeLessThanOrEqual(99);
      expect(q.answer).toBe(q.a * q.b);
    }
  });
});
