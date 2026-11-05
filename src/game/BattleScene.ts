import Phaser from 'phaser';
import { MonsterApproach } from '../core/approach';
import type { HeroLook } from '../core/profile';
import { COLORS, FONT_FAMILY } from '../theme';
import { GROUND_Y, SKY_EXTRA, creatureLift, dissolveColour, drawBackground, drawRibica, makeBoss, makeMonster } from './art';

export { VIEW_HEIGHT, WIDTH } from './art';

const HERO_X = 150;
const MONSTER_START_X = 730;
const MONSTER_HIT_X = 235;
const BOSS_START_X = 690;
const BOSS_HIT_X = 260;

export interface MonsterConfig {
  /** Seconds to reach the hero, or null for Relaxed. */
  seconds: number | null;
}

export interface SceneOptions {
  /** Story chapter 1–5 (Practice uses the village). */
  chapter: number;
  boss: boolean;
}

const hex = (css: string) => Number.parseInt(css.replace('#', ''), 16);

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Paper-cut battlefield of a chapter: the Keeper on the left, a monster or the boss approaching from the right. */
export class BattleScene extends Phaser.Scene {
  onReachHero: () => void = () => {};
  readonly ready: Promise<void>;
  private resolveReady!: () => void;

  private monster?: Phaser.GameObjects.Container;
  private orb?: Phaser.GameObjects.Arc;
  private approach = new MonsterApproach(null);
  private paused = false;
  private variant = 0;
  /** True while a step, knock-back or retreat animates the monster's position. */
  private moving = false;

  constructor(
    private readonly look: HeroLook,
    private readonly options: SceneOptions = { chapter: 1, boss: false },
  ) {
    super('battle');
    this.ready = new Promise((r) => (this.resolveReady = r));
  }

  create(): void {
    this.cameras.main.setScroll(0, -SKY_EXTRA);
    drawBackground(this, this.options.chapter);
    this.drawRogec();
    if (this.options.chapter >= 4) drawRibica(this, HERO_X - 56, GROUND_Y - 112);
    this.drawHero();
    this.resolveReady();
  }

  private get startX(): number {
    return this.options.boss ? BOSS_START_X : MONSTER_START_X;
  }

  private get hitX(): number {
    return this.options.boss ? BOSS_HIT_X : MONSTER_HIT_X;
  }

  private get baseY(): number {
    return GROUND_Y - 6 - creatureLift(this.options.chapter, this.options.boss);
  }

  /** A new monster, or the boss (once per boss level). */
  spawnMonster(cfg: MonsterConfig): void {
    this.monster?.destroy();
    this.approach = new MonsterApproach(cfg.seconds);
    this.monster = this.options.boss ? makeBoss(this, this.options.chapter) : makeMonster(this, this.options.chapter, this.variant++);
    this.monster.y = this.baseY;
    this.moving = false;
    this.monster.setAlpha(0).setScale(0.6);
    this.tweens.add({ targets: this.monster, alpha: 1, scale: 1, duration: this.options.boss ? 600 : 350, ease: 'Back.easeOut' });
    if (this.options.boss && !reduceMotion()) this.cameras.main.shake(300, 0.004);
    this.placeMonster();
    this.paused = false;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  /** Wrong answer: the monster steps closer. Returns true when that step reaches the hero. */
  stepCloser(): boolean {
    if (!this.monster) return false;
    const reached = this.approach.stepCloser();
    this.moveTo(this.approach.progress, 300, 'Quad.easeOut');
    if (!reduceMotion()) this.cameras.main.shake(140, 0.003);
    return reached;
  }

  /** The same monster gets a new problem after a mistake: full target time for the rest of the way. */
  newProblem(): void {
    this.approach.newProblem();
  }

  private castSpell(answer: string, target: Phaser.GameObjects.Container): Promise<void> {
    const fromX = HERO_X + 34;
    const fromY = GROUND_Y - 112;
    const spell = this.add
      .text(fromX, fromY, answer, {
        fontFamily: FONT_FAMILY,
        fontSize: '44px',
        fontStyle: '800',
        color: COLORS.honeyCss,
        stroke: COLORS.inkCss,
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setScale(0.5);
    const path = { t: 0 };
    const toX = target.x;
    const toY = target.y - (this.options.boss ? 100 : 48);
    const peak = Math.min(fromY, toY) - 70;
    return new Promise((resolve) => {
      this.tweens.add({
        targets: path,
        t: 1,
        duration: reduceMotion() ? 150 : 480,
        ease: 'Sine.easeIn',
        onUpdate: () => {
          const t = path.t;
          spell.x = fromX + (toX - fromX) * t;
          spell.y = (1 - t) * (1 - t) * fromY + 2 * (1 - t) * t * peak + t * t * toY;
          spell.setScale(0.5 + 0.7 * t);
        },
        onComplete: () => {
          spell.destroy();
          resolve();
        },
      });
    });
  }

  /** Correct answer: the answer flies from the staff as a golden number and dissolves the monster (or the beaten boss). */
  async defeatMonster(answer: string): Promise<void> {
    const target = this.monster;
    if (!target) return;
    this.monster = undefined;
    await this.castSpell(answer, target);
    this.dissolve(target, this.options.boss ? 2.2 : 1);
    await new Promise<void>((resolve) =>
      this.tweens.add({
        targets: target,
        scale: this.options.boss ? 1.2 : 1.35,
        alpha: 0,
        duration: this.options.boss ? 900 : 380,
        onComplete: () => {
          target.destroy();
          resolve();
        },
      }),
    );
  }

  /** Correct answer against a boss that still stands: it flashes, staggers back and keeps coming. */
  async hitBoss(answer: string, damage: number): Promise<void> {
    const target = this.monster;
    if (!target) return;
    await this.castSpell(answer, target);
    this.dissolve(target, 0.6 + damage * 0.3);
    this.approach.knockBack();
    await new Promise<void>((resolve) => {
      this.tweens.add({ targets: target, alpha: 0.35, yoyo: true, repeat: damage, duration: 90 });
      this.moveTo(this.approach.progress, 380, 'Back.easeOut', resolve);
    });
  }

  /** The monster reached the hero: it wraps the hero for a moment and is gone; a boss goes back to its start instead. */
  hitHero(): Promise<void> {
    const target = this.monster;
    if (!reduceMotion()) this.cameras.main.shake(220, 0.006);
    if (!target) return Promise.resolve();
    if (this.options.boss) {
      this.approach.restart();
      return new Promise((resolve) => this.moveTo(0, 700, 'Quad.easeOut', resolve));
    }
    this.monster = undefined;
    return new Promise((resolve) => {
      this.tweens.add({
        targets: target,
        x: HERO_X + 10,
        scale: 1.5,
        alpha: 0,
        duration: 650,
        ease: 'Quad.easeIn',
        onComplete: () => {
          target.destroy();
          resolve();
        },
      });
    });
  }

  update(time: number, delta: number): void {
    if (this.orb) this.orb.setScale(1 + Math.sin(time / 260) * 0.12);
    if (!this.monster) return;
    this.monster.y = this.baseY + Math.sin(time / 300) * 4;
    if (this.paused) return;
    const reached = this.approach.tick(delta / 1000);
    this.placeMonster();
    if (reached) {
      this.paused = true;
      this.onReachHero();
    }
  }

  private xFor(progress: number): number {
    return this.startX + (this.hitX - this.startX) * progress;
  }

  private placeMonster(): void {
    if (this.monster && !this.moving) this.monster.x = this.xFor(this.approach.progress);
  }

  private moveTo(progress: number, duration: number, ease: string, done?: () => void): void {
    if (!this.monster) return done?.();
    this.moving = true;
    this.tweens.add({
      targets: this.monster,
      x: this.xFor(progress),
      duration,
      ease,
      onComplete: () => {
        this.moving = false;
        done?.();
      },
    });
  }

  private drawRogec(): void {
    const x = HERO_X - 82;
    const r = this.add.container(x, GROUND_Y);
    const body = COLORS.ibex;
    r.add(this.add.rectangle(-12, -10, 5, 18, COLORS.ibexDark));
    r.add(this.add.rectangle(12, -10, 5, 18, COLORS.ibexDark));
    r.add(this.add.ellipse(0, -24, 46, 28, body));
    r.add(this.add.ellipse(26, -42, 24, 20, body));
    // Ibex horns: rooted on top of the head, curving back over the neck.
    const horns = this.add.graphics();
    horns.lineStyle(4, COLORS.ibexDark, 1);
    for (const x0 of [20, 27]) {
      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(x0, -50),
        new Phaser.Math.Vector2(x0 + 2, -66),
        new Phaser.Math.Vector2(x0 - 11, -67),
      );
      horns.strokePoints(curve.getPoints(16));
    }
    r.add(horns);
    r.add(this.add.circle(31, -44, 2.5, COLORS.ink));
    r.add(this.add.ellipse(-22, -30, 8, 6, COLORS.snow));
    if (!reduceMotion()) this.tweens.add({ targets: r, y: GROUND_Y - 3, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut', delay: 300 });
  }

  private drawHero(): void {
    const h = this.add.container(HERO_X, GROUND_Y);
    // Cape
    const cape = this.add.graphics();
    cape.fillStyle(COLORS.ink, 0.16);
    cape.fillTriangle(-30, 4, 0, -76, 30, 4);
    cape.fillStyle(hex(this.look.cape), 1);
    cape.fillTriangle(-30, 0, 0, -80, 30, 0);
    cape.fillStyle(COLORS.honey, 1);
    cape.fillRect(-30, -6, 60, 6);
    h.add(cape);
    // Head and hat with edelweiss
    h.add(this.add.circle(0, -92, 17, COLORS.skin));
    h.add(this.add.circle(-6, -92, 2.2, COLORS.ink));
    h.add(this.add.circle(6, -92, 2.2, COLORS.ink));
    h.add(this.add.ellipse(0, -104, 54, 10, hex(this.look.hat)));
    h.add(this.add.ellipse(0, -114, 30, 22, hex(this.look.hat)));
    h.add(this.add.rectangle(0, -108, 30, 4, COLORS.honey));
    h.add(this.add.star(12, -116, 6, 2, 6, COLORS.snow));
    // Staff with a glowing number orb
    h.add(this.add.rectangle(34, -52, 5, 104, COLORS.wood));
    this.orb = this.add.circle(34, -112, 9, COLORS.honey);
    h.add(this.add.circle(34, -112, 16, COLORS.honey, 0.25));
    h.add(this.orb);
    if (!reduceMotion()) this.tweens.add({ targets: h, y: GROUND_Y - 3, yoyo: true, repeat: -1, duration: 1100, ease: 'Sine.easeInOut' });
  }

  /** The creature breaks into puffs that drift away, with a few honey sparks. */
  private dissolve(target: Phaser.GameObjects.Container, size = 1): void {
    const cx = target.x;
    const cy = target.y - 40 * size;
    const colour = dissolveColour(this.options.chapter);
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const isSpark = i % 3 === 0;
      const dot = this.add.circle(cx, cy, (isSpark ? 5 : 11) * Math.sqrt(size), isSpark ? COLORS.honey : colour, isSpark ? 1 : 0.7);
      this.tweens.add({
        targets: dot,
        x: cx + Math.cos(angle) * (isSpark ? 70 : 50) * size,
        y: cy + Math.sin(angle) * (isSpark ? 70 : 40) * size - 20,
        alpha: 0,
        scale: isSpark ? 0.4 : 1.6,
        duration: 520,
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }
}
