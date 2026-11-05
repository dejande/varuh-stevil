import { answerOf, factKey } from './facts';
import { fillerPlan, generateDistinct, generateRound } from './generator';
import { randInt, type Rng } from './rng';
import type { PracticeSettings, Problem } from './types';

export const PROBLEMS_PER_LEVEL = 10;
export const HEARTS_PER_LEVEL = 3;
/** A wrong fact comes back this many problems later (§4 Retry). */
export const RETRY_MIN = 3;
export const RETRY_MAX = 5;

export type LevelState = 'playing' | 'won' | 'lost';

export interface AnswerResult {
  correct: boolean;
  problem: Problem;
  expected: number;
}

/** Battle rules of one level, independent of rendering. */
export class LevelSession {
  readonly queue: Problem[];
  hearts = HEARTS_PER_LEVEL;
  mistakes = 0;
  defeated = 0;
  state: LevelState = 'playing';

  constructor(
    private readonly settings: PracticeSettings,
    private readonly rng: Rng,
    count = PROBLEMS_PER_LEVEL,
  ) {
    this.queue = generateRound(settings, rng, count);
  }

  get current(): Problem | null {
    return this.queue[0] ?? null;
  }

  isWon(): boolean {
    return this.state === 'won';
  }

  get remaining(): number {
    return this.queue.length;
  }

  answer(value: number): AnswerResult {
    const problem = this.requireCurrent();
    const expected = answerOf(problem);
    const correct = value === expected;
    this.queue.shift();
    if (correct) {
      this.defeated++;
    } else {
      this.mistakes++;
      this.scheduleRetry(problem);
    }
    this.updateState();
    return { correct, problem, expected };
  }

  /** The monster reached the hero before an answer: counts as a mistake. */
  timeout(): AnswerResult {
    const problem = this.requireCurrent();
    this.queue.shift();
    this.mistakes++;
    this.scheduleRetry(problem);
    this.updateState();
    return { correct: false, problem, expected: answerOf(problem) };
  }

  loseHeart(): void {
    if (this.hearts > 0) this.hearts--;
    this.updateState();
  }

  /** 3 = all hearts and at most 1 mistake · 2 = at most 3 mistakes · 1 = finished · 0 = lost. */
  get stars(): number {
    if (this.state !== 'won') return 0;
    if (this.hearts === HEARTS_PER_LEVEL && this.mistakes <= 1) return 3;
    if (this.mistakes <= 3) return 2;
    return 1;
  }

  private requireCurrent(): Problem {
    const p = this.current;
    if (!p || this.state !== 'playing') throw new Error('No active problem');
    return p;
  }

  private updateState(): void {
    if (this.hearts <= 0) this.state = 'lost';
    else if (this.queue.length === 0) this.state = 'won';
  }

  /**
   * Puts the fact back 3–5 problems later. Short queues are padded with fresh problems first.
   * When every slot would sit next to a copy already waiting, that copy serves as the retry.
   */
  private scheduleRetry(problem: Problem): void {
    const key = factKey(problem);
    while (this.queue.length < RETRY_MIN - 1) {
      const last = this.queue[this.queue.length - 1];
      const avoid = [key, ...(last ? [factKey(last)] : [])];
      this.queue.push(generateDistinct(this.settings, this.rng, fillerPlan(this.settings, this.rng), avoid));
    }
    const maxOffset = Math.min(RETRY_MAX, this.queue.length + 1);
    const span = maxOffset - RETRY_MIN + 1;
    const first = randInt(this.rng, 0, span - 1);
    for (let i = 0; i < span; i++) {
      const offset = RETRY_MIN + ((first + i) % span);
      const index = offset - 1;
      const before = this.queue[index - 1];
      const after = this.queue[index];
      if (factKey(before) !== key && (!after || factKey(after) !== key)) {
        this.queue.splice(index, 0, problem);
        return;
      }
    }
  }
}
