import { randInt, type Rng } from './rng';

/** Parent gate (spec §6): hold a button for 3 seconds, then solve a two-digit multiplication. */
export const GATE_HOLD_MS = 3000;

export interface GateQuestion {
  a: number;
  b: number;
  answer: number;
}

export function makeGateQuestion(rng: Rng): GateQuestion {
  const a = randInt(rng, 12, 29);
  const b = randInt(rng, 12, 29);
  return { a, b, answer: a * b };
}
