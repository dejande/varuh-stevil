import Phaser from 'phaser';

export const WIDTH = 800;
export const HEIGHT = 360;
const GROUND_Y = 290;
const HERO_X = 130;
const MONSTER_START_X = 740;
const MONSTER_HIT_X = 215;
/** Relaxed: the monster stops here (0 = start, 1 = at the hero); each wrong answer moves it one step on. */
const RELAXED_STOP = 0.55;
const RELAXED_STEP = 0.15;
/** Timed speeds: a wrong answer pushes the monster this far forward. */
const TIMED_STEP = 0.25;
const WALK_IN_SECONDS = 2.5;

const MONSTER_COLOURS = [0x8e9aaf, 0x9b8ec4, 0x7fa7a0, 0xa58fa0];

export interface MonsterConfig {
  /** Seconds to reach the hero, or null for Relaxed. */
  seconds: number | null;
}

/** Placeholder-art battle: hero on the left, one monster walking in from the right. */
export class BattleScene extends Phaser.Scene {
  onReachHero: () => void = () => {};
  readonly ready: Promise<void>;
  private resolveReady!: () => void;

  private monster?: Phaser.GameObjects.Container;
  private progress = 0;
  private limit = 1;
  private speedPerSec = 0;
  private relaxed = false;
  private paused = false;
  private colourIndex = 0;

  constructor() {
    super('battle');
    this.ready = new Promise((r) => (this.resolveReady = r));
  }

  create(): void {
    this.drawBackground();
    this.drawHero();
    this.resolveReady();
  }

  spawnMonster(cfg: MonsterConfig): void {
    this.monster?.destroy();
    this.relaxed = cfg.seconds === null;
    this.progress = 0;
    if (this.relaxed) {
      this.limit = RELAXED_STOP;
      this.speedPerSec = RELAXED_STOP / WALK_IN_SECONDS;
    } else {
      this.limit = 1;
      this.speedPerSec = 1 / (cfg.seconds as number);
    }
    this.monster = this.makeMonster(MONSTER_COLOURS[this.colourIndex++ % MONSTER_COLOURS.length]);
    this.monster.setAlpha(0);
    this.tweens.add({ targets: this.monster, alpha: 1, duration: 250 });
    this.placeMonster();
    this.paused = false;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  /** Wrong answer: the monster steps closer. Returns true when that step reaches the hero. */
  stepCloser(): boolean {
    if (!this.monster) return false;
    if (this.relaxed) {
      // Relaxed counts wrong answers, not time: each one moves the stop point a step on, 3 reach the hero.
      this.limit = Math.min(1, this.limit + RELAXED_STEP);
      this.progress = this.limit;
    } else {
      this.progress = Math.min(1, this.progress + TIMED_STEP);
    }
    this.tweens.add({ targets: this.monster, x: this.xFor(this.progress), duration: 300, ease: 'Quad.easeOut' });
    this.cameras.main.shake(150, 0.004);
    return this.progress >= 0.999;
  }

  /** Correct answer: a spell flies from the hero and the monster disappears. */
  defeatMonster(): Promise<void> {
    const target = this.monster;
    if (!target) return Promise.resolve();
    this.monster = undefined;
    const spell = this.add.star(HERO_X + 30, GROUND_Y - 70, 5, 8, 18, 0xffd84d).setStrokeStyle(2, 0xffffff);
    return new Promise((resolve) => {
      this.tweens.add({
        targets: spell,
        x: target.x,
        y: target.y - 40,
        angle: 360,
        duration: 350,
        onComplete: () => {
          spell.destroy();
          this.burst(target.x, target.y - 40, 0xffd84d);
          this.tweens.add({
            targets: target,
            scale: 0,
            alpha: 0,
            duration: 300,
            onComplete: () => {
              target.destroy();
              resolve();
            },
          });
        },
      });
    });
  }

  /** The monster reached the hero: the hero flashes and the monster runs off. */
  hitHero(): Promise<void> {
    const target = this.monster;
    this.monster = undefined;
    this.cameras.main.flash(250, 255, 120, 120);
    if (!target) return Promise.resolve();
    return new Promise((resolve) => {
      this.tweens.add({
        targets: target,
        x: WIDTH + 80,
        alpha: 0,
        duration: 600,
        ease: 'Quad.easeIn',
        onComplete: () => {
          target.destroy();
          resolve();
        },
      });
    });
  }

  update(_time: number, delta: number): void {
    if (!this.monster || this.paused) return;
    if (this.progress < this.limit) {
      this.progress = Math.min(this.limit, this.progress + (this.speedPerSec * delta) / 1000);
      this.placeMonster();
      if (this.progress >= 1) {
        this.paused = true;
        this.onReachHero();
      }
    }
  }

  private xFor(progress: number): number {
    return MONSTER_START_X + (MONSTER_HIT_X - MONSTER_START_X) * progress;
  }

  private placeMonster(): void {
    if (!this.monster) return;
    this.monster.x = this.xFor(this.progress);
    this.monster.y = GROUND_Y + Math.sin(this.time.now / 120) * 2;
  }

  private drawBackground(): void {
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x9fc9e8);
    this.add.triangle(180, GROUND_Y, 0, 0, 220, -210, 440, 0, 0x7d8ea3).setOrigin(0.5, 1);
    this.add.triangle(520, GROUND_Y, 0, 0, 260, -250, 520, 0, 0x6c7d93).setOrigin(0.5, 1);
    this.add.triangle(560, GROUND_Y - 190, 0, 0, 60, -60, 120, 0, 0xf4f7fb).setOrigin(0.5, 1);
    this.add.rectangle(WIDTH / 2, GROUND_Y + 35, WIDTH, 70, 0x6fae5b);
    for (let i = 0; i < 3; i++) {
      this.add.ellipse(250 + i * 220, 70 + (i % 2) * 25, 140, 34, 0xffffff, 0.55);
    }
  }

  private drawHero(): void {
    const hero = this.add.container(HERO_X, GROUND_Y);
    hero.add(this.add.triangle(0, -30, -26, 30, 0, -40, 26, 30, 0x3b6fd1));
    hero.add(this.add.circle(0, -78, 18, 0xf6d2b0));
    hero.add(this.add.triangle(0, -100, -22, 8, 0, -38, 22, 8, 0x27408b));
    hero.add(this.add.star(0, -136, 5, 4, 8, 0xffd84d));
    hero.add(this.add.rectangle(30, -45, 4, 70, 0x8b5a2b));
    hero.add(this.add.circle(30, -82, 6, 0xffd84d));
    this.tweens.add({ targets: hero, y: GROUND_Y - 4, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });

    const rogec = this.add.container(HERO_X - 75, GROUND_Y);
    rogec.add(this.add.ellipse(0, -18, 40, 26, 0xd9c3a1));
    rogec.add(this.add.circle(18, -34, 10, 0xd9c3a1));
    rogec.add(this.add.triangle(16, -48, -4, 6, 2, -10, 6, 6, 0x7a5c3e));
    rogec.add(this.add.triangle(24, -48, -4, 6, 2, -10, 6, 6, 0x7a5c3e));
    rogec.add(this.add.circle(22, -36, 2, 0x222222));
  }

  private makeMonster(colour: number): Phaser.GameObjects.Container {
    const m = this.add.container(MONSTER_START_X, GROUND_Y);
    m.add(this.add.ellipse(0, -38, 82, 76, colour, 0.95));
    m.add(this.add.ellipse(-26, -20, 30, 22, colour, 0.8));
    m.add(this.add.ellipse(26, -18, 34, 24, colour, 0.8));
    m.add(this.add.circle(-14, -48, 10, 0xffffff));
    m.add(this.add.circle(14, -48, 10, 0xffffff));
    m.add(this.add.circle(-16, -46, 4, 0x222222));
    m.add(this.add.circle(12, -46, 4, 0x222222));
    m.add(this.add.arc(0, -28, 10, 20, 160, false, 0x553344));
    return m;
  }

  private burst(x: number, y: number, colour: number): void {
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      const dot = this.add.circle(x, y, 5, colour);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * 60,
        y: y + Math.sin(angle) * 60,
        alpha: 0,
        duration: 450,
        onComplete: () => dot.destroy(),
      });
    }
  }
}
