import { describe, expect, it } from 'vitest';
import { MonsterApproach, RELAXED_STOP, TIMED_STEP } from '../src/core/approach';

function run(a: MonsterApproach, seconds: number, dt = 0.05): boolean {
  for (let t = 0; t < seconds; t += dt) if (a.tick(dt)) return true;
  return false;
}

describe('MonsterApproach', () => {
  it('Normal reaches the hero after the target time, not before', () => {
    const a = new MonsterApproach(12);
    expect(run(a, 11.8)).toBe(false);
    expect(run(a, 0.4)).toBe(true);
  });

  it('a new problem after a mistake gets the full target time again', () => {
    // The bug Dejan hit: wrong answer late in the approach, the next problem had only seconds left.
    const a = new MonsterApproach(12);
    run(a, 6);
    expect(a.stepCloser()).toBe(false);
    expect(a.progress).toBeCloseTo(0.5 + TIMED_STEP, 1);
    a.newProblem();
    expect(a.secondsLeft()).toBeCloseTo(12, 5);
    expect(run(a, 11.8)).toBe(false);
    expect(run(a, 0.4)).toBe(true);
  });

  it('a wrong answer can still push the monster all the way', () => {
    const a = new MonsterApproach(12);
    run(a, 10);
    expect(a.stepCloser()).toBe(true);
  });

  it('Relaxed waits at a safe distance however long the child thinks', () => {
    const a = new MonsterApproach(null);
    expect(run(a, 600)).toBe(false);
    expect(a.progress).toBeCloseTo(RELAXED_STOP);
    expect(a.secondsLeft()).toBeNull();
  });

  it('Relaxed: the third wrong answer on one monster reaches the hero', () => {
    const a = new MonsterApproach(null);
    run(a, 5);
    expect(a.stepCloser()).toBe(false);
    a.newProblem();
    expect(run(a, 60)).toBe(false);
    expect(a.stepCloser()).toBe(false);
    expect(a.stepCloser()).toBe(true);
  });

  it('a wrong answer during the walk-in still counts in Relaxed', () => {
    const a = new MonsterApproach(null);
    a.stepCloser();
    a.stepCloser();
    expect(a.stepCloser()).toBe(true);
  });
});
