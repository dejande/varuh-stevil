import { compute, factKey, needsRegrouping } from './facts';
import { pick, randInt, shuffle, type Rng } from './rng';
import type { Op, PracticeSettings, Problem, Range, Unknown } from './types';

/** Share of a round that may use 0 or 1 as an operand. */
export const SMALL_OPERAND_SHARE = 0.1;
/** Upper bound for missing-number problems in a round. */
export const MISSING_SHARE = 0.3;
/** Lower bound for + and − problems that cross 10 / need a carry or borrow (R ≥ 20). */
export const REGROUP_SHARE = 0.4;

export interface SlotPlan {
  op: Op;
  /** May 0 or 1 appear as an operand. */
  allowSmall: boolean;
  /** Must the fact cross 10 / need a carry or borrow. Only meaningful for + and −. */
  regroup: boolean;
  unknown: Unknown;
}

const MAX_TRIES = 10_000;

function sample<T>(make: () => T | null): T {
  for (let i = 0; i < MAX_TRIES; i++) {
    const v = make();
    if (v !== null) return v;
  }
  throw new Error('Problem generator could not satisfy its constraints');
}

/** Factor pair for × and ÷ following §3: both 0–10 up to R = 100, one factor 2–10 at R = 1000. */
function factorPair(rng: Rng, range: Range, lo: number): [number, number] | null {
  if (range <= 100) {
    const x = randInt(rng, lo, 10);
    const maxY = x === 0 ? 10 : Math.min(10, Math.floor(range / x));
    if (maxY < lo) return null;
    return [x, randInt(rng, lo, maxY)];
  }
  const f = randInt(rng, 2, 10);
  const other = randInt(rng, lo, Math.floor(range / f));
  return rng() < 0.5 ? [f, other] : [other, f];
}

export function generateFact(op: Op, range: Range, rng: Rng, allowSmall: boolean, regroup: boolean): Problem {
  const lo = allowSmall ? 0 : 2;
  const wantRegroup = regroup && (op === 'add' || op === 'sub') && range >= 20;
  const ok = (a: number, b: number) => !wantRegroup || needsRegrouping(op, a, b);

  return sample<Problem>(() => {
    let a: number;
    let b: number;
    switch (op) {
      case 'add': {
        const c = randInt(rng, 2 * lo, range);
        a = randInt(rng, lo, c - lo);
        b = c - a;
        break;
      }
      case 'sub': {
        a = randInt(rng, lo, range);
        b = randInt(rng, lo, a);
        break;
      }
      case 'mul': {
        const pair = factorPair(rng, range, lo);
        if (!pair) return null;
        [a, b] = pair;
        break;
      }
      case 'div': {
        // ÷ uses the same factor limits as ×: divisor and quotient are the factors.
        const pair = factorPair(rng, range, lo);
        if (!pair) return null;
        const [divisor, quotient] = pair;
        if (divisor < 1) return null;
        a = divisor * quotient;
        b = divisor;
        break;
      }
    }
    if (a > range || b > range) return null;
    if (!allowSmall && (a <= 1 || b <= 1)) return null;
    if (!ok(a, b)) return null;
    const c = compute(op, a, b);
    if (c < 0 || c > range || !Number.isInteger(c)) return null;
    return { op, a, b, c, unknown: 'c' };
  });
}

export function generateProblem(settings: PracticeSettings, rng: Rng, plan: SlotPlan): Problem {
  // A missing factor next to a 0 (0 · ? = 0) has no single answer, so missing-number problems never use 0 or 1.
  const allowSmall = plan.unknown === 'c' && plan.allowSmall;
  const fact = generateFact(plan.op, settings.range, rng, allowSmall, plan.regroup);
  return { ...fact, unknown: plan.unknown };
}

export function planRound(settings: PracticeSettings, rng: Rng, count: number): SlotPlan[] {
  if (settings.ops.length === 0) throw new Error('At least one operation must be enabled');
  const slots: SlotPlan[] = Array.from({ length: count }, () => ({
    op: pick(rng, settings.ops),
    allowSmall: false,
    regroup: false,
    unknown: 'c' as Unknown,
  }));
  const order = shuffle(
    rng,
    slots.map((_, i) => i),
  );

  const missingCount = settings.missingNumber ? Math.floor(count * MISSING_SHARE) : 0;
  order.slice(0, missingCount).forEach((i) => (slots[i].unknown = rng() < 0.5 ? 'a' : 'b'));

  const smallCount = Math.floor(count * SMALL_OPERAND_SHARE);
  order.slice(missingCount, missingCount + smallCount).forEach((i) => (slots[i].allowSmall = true));

  if (settings.range >= 20) {
    const addSub = shuffle(
      rng,
      slots.filter((s) => s.op === 'add' || s.op === 'sub'),
    );
    addSub.slice(0, Math.ceil(addSub.length * REGROUP_SHARE)).forEach((s) => (s.regroup = true));
  }
  return slots;
}

/** Generates a problem whose fact differs from `avoidKey`. */
export function generateDistinct(settings: PracticeSettings, rng: Rng, plan: SlotPlan, avoidKeys: readonly string[]): Problem {
  return sample(() => {
    const p = generateProblem(settings, rng, plan);
    return avoidKeys.includes(factKey(p)) ? null : p;
  });
}

export function generateRound(settings: PracticeSettings, rng: Rng, count: number, previousKey?: string): Problem[] {
  const out: Problem[] = [];
  let prev = previousKey;
  for (const plan of planRound(settings, rng, count)) {
    const p = generateDistinct(settings, rng, plan, prev ? [prev] : []);
    out.push(p);
    prev = factKey(p);
  }
  return out;
}

/** A filler problem that keeps every round-level share intact (no 0/1, plain task, regrouping where it applies). */
export function fillerPlan(settings: PracticeSettings, rng: Rng): SlotPlan {
  const op = pick(rng, settings.ops);
  return { op, allowSmall: false, regroup: settings.range >= 20 && (op === 'add' || op === 'sub'), unknown: 'c' };
}
