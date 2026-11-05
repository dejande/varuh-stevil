/**
 * How a monster approaches the hero (spec §2). Progress runs from 0 (start) to 1 (at the hero).
 *
 * Relaxed: the monster walks to a safe stop point and waits; only wrong answers move it on,
 * and the third wrong answer on one monster reaches the hero.
 * Normal / Fast: the monster walks the whole way in the target time. A wrong answer pushes it
 * forward, and the next problem again gets the full target time for the distance that is left.
 */
export const RELAXED_STOP = 0.55;
export const RELAXED_STEP = 0.15;
export const TIMED_STEP = 0.25;
export const WALK_IN_SECONDS = 2.5;
/** A boss hit by a correct answer is pushed back this far. */
export const BOSS_KNOCKBACK = 0.2;

export class MonsterApproach {
  progress = 0;
  limit: number;
  private speedPerSec: number;

  /** @param seconds target time per problem, or null for Relaxed */
  constructor(readonly seconds: number | null) {
    this.limit = seconds === null ? RELAXED_STOP : 1;
    this.speedPerSec = seconds === null ? RELAXED_STOP / WALK_IN_SECONDS : 1 / seconds;
  }

  get relaxed(): boolean {
    return this.seconds === null;
  }

  get reached(): boolean {
    return this.progress >= 0.999;
  }

  /** Advances by `dt` seconds. Returns true when this step reaches the hero. */
  tick(dt: number): boolean {
    if (this.reached || this.progress >= this.limit) return false;
    this.progress = Math.min(this.limit, this.progress + this.speedPerSec * dt);
    return this.reached;
  }

  /** Wrong answer. Returns true when the step reaches the hero. */
  stepCloser(): boolean {
    if (this.relaxed) {
      this.limit = Math.min(1, this.limit + RELAXED_STEP);
      this.progress = this.limit;
    } else {
      this.progress = Math.min(1, this.progress + TIMED_STEP);
    }
    return this.reached;
  }

  /** The same monster gets a new problem: timed speeds give the full target time for the rest of the way. */
  newProblem(): void {
    if (this.seconds === null || this.reached) return;
    this.speedPerSec = (1 - this.progress) / this.seconds;
  }

  /** A boss took a hit: it staggers back (Relaxed: its stop point moves back too, never behind the start). */
  knockBack(amount = BOSS_KNOCKBACK): void {
    this.progress = Math.max(0, this.progress - amount);
    if (this.relaxed) this.limit = Math.max(RELAXED_STOP, this.limit - amount);
  }

  /** A boss that reached the hero goes back to where it started and approaches again. */
  restart(): void {
    const fresh = new MonsterApproach(this.seconds);
    this.progress = fresh.progress;
    this.limit = fresh.limit;
    this.newProblem();
  }

  /** Seconds until the monster reaches the hero at the current speed, or null when it is waiting (Relaxed). */
  secondsLeft(): number | null {
    if (this.relaxed || this.speedPerSec <= 0) return null;
    return (1 - this.progress) / this.speedPerSec;
  }
}
