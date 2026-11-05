import type { Range, Speed } from './types';

const NORMAL_SECONDS: Record<Range, number> = { 10: 12, 20: 12, 100: 15, 1000: 20 };
export const FAST_FACTOR = 0.7;

/** Seconds the monster needs to reach the hero, or null for Relaxed (time never costs a heart). */
export function targetSeconds(range: Range, speed: Speed): number | null {
  if (speed === 'relaxed') return null;
  const base = NORMAL_SECONDS[range];
  return speed === 'fast' ? base * FAST_FACTOR : base;
}
