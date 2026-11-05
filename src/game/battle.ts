import Phaser from 'phaser';
import { formatProblem } from '../core/format';
import { pickHint } from '../core/hints';
import { LevelSession, type AnswerResult } from '../core/level';
import { targetSeconds } from '../core/speed';
import type { Profile } from '../core/types';
import { translate, type MessageKey, type Values } from '../i18n/i18n';
import { BattleScene, HEIGHT, WIDTH } from './BattleScene';

export interface BattleOutcome {
  won: boolean;
  stars: number;
  mistakes: number;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'erase', '0', 'ok'] as const;

/** One Practice level: wires the level rules to the Phaser scene and the DOM keypad. */
export class Battle {
  private readonly session: LevelSession;
  private readonly scene = new BattleScene();
  private game?: Phaser.Game;
  private input = '';
  private busy = true;
  private feedbackOpen = false;
  private monsterGone = false;
  private readonly maxDigits: number;
  private readonly el: {
    root: HTMLElement;
    stage: HTMLElement;
    progress: HTMLElement;
    hearts: HTMLElement;
    problem: HTMLElement;
    keypad: HTMLElement;
    feedback: HTMLElement;
  };
  private readonly onKey = (e: KeyboardEvent) => this.handleKey(e);

  constructor(
    host: HTMLElement,
    private readonly profile: Profile,
    private readonly onDone: (outcome: BattleOutcome) => void,
    private readonly onHome: () => void,
  ) {
    this.session = new LevelSession(profile.settings, Math.random);
    this.maxDigits = String(profile.settings.range).length;
    this.el = this.render(host);
  }

  async start(): Promise<void> {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: this.el.stage,
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: '#9fc9e8',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      audio: { noAudio: true },
      scene: this.scene,
    });
    this.scene.onReachHero = () => void this.handleTimeout();
    // Dev-only handle so a browser session can step frames when requestAnimationFrame is throttled.
    if (import.meta.env.DEV) (window as unknown as { __game?: Phaser.Game }).__game = this.game;
    await this.scene.ready;
    window.addEventListener('keydown', this.onKey);
    this.nextMonster();
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKey);
    this.game?.destroy(true);
    this.game = undefined;
    if (import.meta.env.DEV) delete (window as unknown as { __game?: Phaser.Game }).__game;
  }

  private t(key: MessageKey | string, values: Values = {}): string {
    return translate(this.profile.lang, key, { gender: this.profile.gender, hero: this.profile.heroName, ...values });
  }

  private render(host: HTMLElement) {
    host.innerHTML = `
      <section class="battle">
        <header class="hud">
          <button class="btn-small" data-action="home">⌂ ${this.t('battle.home')}</button>
          <span class="progress"></span>
          <span class="hearts" role="img"></span>
        </header>
        <div class="stage"></div>
        <div class="problem" aria-live="polite"></div>
        <div class="feedback" hidden></div>
        <div class="keypad" role="group" aria-label="${this.t('battle.answerLabel')}">
          ${KEYS.map((k) => {
            const label = k === 'erase' ? '⌫' : k === 'ok' ? '✓' : k;
            const aria = k === 'erase' ? this.t('battle.erase') : k === 'ok' ? this.t('battle.ok') : k;
            return `<button class="key key-${k}" data-key="${k}" aria-label="${aria}">${label}</button>`;
          }).join('')}
        </div>
      </section>`;
    const q = (s: string) => host.querySelector(s) as HTMLElement;
    const el = {
      root: q('.battle'),
      stage: q('.stage'),
      progress: q('.progress'),
      hearts: q('.hearts'),
      problem: q('.problem'),
      keypad: q('.keypad'),
      feedback: q('.feedback'),
    };
    el.keypad.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('button');
      if (btn?.dataset.key) this.press(btn.dataset.key);
    });
    q('[data-action="home"]').addEventListener('click', () => this.onHome());
    return el;
  }

  private handleKey(e: KeyboardEvent): void {
    if (this.feedbackOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.continueAfterFeedback();
      }
      return;
    }
    if (/^[0-9]$/.test(e.key)) this.press(e.key);
    else if (e.key === 'Backspace') this.press('erase');
    else if (e.key === 'Enter') this.press('ok');
  }

  private press(key: string): void {
    if (this.busy || this.feedbackOpen) return;
    if (key === 'erase') this.input = this.input.slice(0, -1);
    else if (key === 'ok') return void this.submit();
    else if (this.input.length < this.maxDigits) this.input = this.input === '0' ? key : this.input + key;
    this.updateProblem();
  }

  private updateHud(): void {
    const s = this.session;
    this.el.progress.textContent = this.t('battle.progress', { done: Math.min(s.defeated + 1, s.defeated + s.remaining), total: s.defeated + s.remaining });
    this.el.hearts.textContent = '♥'.repeat(s.hearts) + '♡'.repeat(3 - s.hearts);
    this.el.hearts.setAttribute('aria-label', this.t('battle.hearts', { count: s.hearts }));
  }

  private updateProblem(): void {
    const p = this.session.current;
    this.el.problem.textContent = p ? formatProblem(p, this.profile.lang, this.input) : '';
    this.el.problem.classList.toggle('has-input', this.input.length > 0);
  }

  private nextMonster(): void {
    this.scene.spawnMonster({ seconds: targetSeconds(this.profile.settings.range, this.profile.speed) });
    this.monsterGone = false;
    this.nextProblem();
  }

  private nextProblem(): void {
    this.input = '';
    this.updateHud();
    this.updateProblem();
    this.busy = false;
  }

  private async submit(): Promise<void> {
    if (this.input === '' || this.session.state !== 'playing') return;
    this.busy = true;
    const result = this.session.answer(Number(this.input));
    if (result.correct) {
      this.el.problem.classList.add('correct');
      this.updateHud();
      await this.scene.defeatMonster();
      this.el.problem.classList.remove('correct');
      if (this.session.isWon()) return this.finish();
      this.nextMonster();
      return;
    }
    this.scene.setPaused(true);
    if (this.scene.stepCloser()) {
      this.session.loseHeart();
      this.updateHud();
      await this.scene.hitHero();
      this.monsterGone = true;
    }
    this.showFeedback(result, 'feedback.wrong');
  }

  private async handleTimeout(): Promise<void> {
    if (this.busy || this.feedbackOpen || this.session.state !== 'playing') {
      this.scene.setPaused(true);
      return;
    }
    this.busy = true;
    const result = this.session.timeout();
    this.session.loseHeart();
    this.updateHud();
    await this.scene.hitHero();
    this.monsterGone = true;
    this.showFeedback(result, 'feedback.timeout');
  }

  private showFeedback(result: AnswerResult, key: 'feedback.wrong' | 'feedback.timeout'): void {
    const lang = this.profile.lang;
    const hint = pickHint(result.problem, lang);
    const fb = this.el.feedback;
    fb.innerHTML = `
      <p class="fb-answer">${formatProblem(result.problem, lang, String(result.expected))}</p>
      <p class="fb-main">${this.t(key, { answer: result.expected })}</p>
      ${hint ? `<p class="fb-hint">💡 ${this.t(hint.key, hint.values)}</p>` : ''}
      <button class="btn-primary" data-action="continue">${this.t('feedback.continue')} →</button>`;
    fb.querySelector('[data-action="continue"]')!.addEventListener('click', () => this.continueAfterFeedback());
    fb.hidden = false;
    this.el.keypad.hidden = true;
    this.el.problem.hidden = true;
    this.feedbackOpen = true;
    this.updateHud();
    (fb.querySelector('button') as HTMLButtonElement).focus();
  }

  private continueAfterFeedback(): void {
    if (!this.feedbackOpen) return;
    this.feedbackOpen = false;
    this.el.feedback.hidden = true;
    this.el.keypad.hidden = false;
    this.el.problem.hidden = false;
    if (this.session.state !== 'playing') return this.finish();
    if (this.monsterGone) {
      this.nextMonster();
    } else {
      this.scene.setPaused(false);
      this.nextProblem();
    }
  }

  private finish(): void {
    const s = this.session;
    this.onDone({ won: s.state === 'won', stars: s.stars, mistakes: s.mistakes });
  }
}
