import Phaser from 'phaser';
import { MonsterApproach } from '../core/approach';
import type { HeroLook } from '../core/profile';
import { COLORS, FONT_FAMILY } from '../theme';

export const WIDTH = 800;
export const HEIGHT = 360;
const GROUND_Y = 292;
const HERO_X = 150;
const MONSTER_START_X = 730;
const MONSTER_HIT_X = 235;

/** Chapter 1 fog imps come in a few fog shades. */
const FOG_SHADES = [COLORS.fog, 0xa9b7cf, 0xc4b4cf, 0xb3c4c9];

export interface MonsterConfig {
  /** Seconds to reach the hero, or null for Relaxed. */
  seconds: number | null;
}

const hex = (css: string) => Number.parseInt(css.replace('#', ''), 16);

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Paper-cut alpine battlefield: the Keeper on the left, one fog imp drifting in from the right. */
export class BattleScene extends Phaser.Scene {
  onReachHero: () => void = () => {};
  readonly ready: Promise<void>;
  private resolveReady!: () => void;

  private monster?: Phaser.GameObjects.Container;
  private orb?: Phaser.GameObjects.Arc;
  private approach = new MonsterApproach(null);
  private paused = false;
  private shadeIndex = 0;

  constructor(private readonly look: HeroLook) {
    super('battle');
    this.ready = new Promise((r) => (this.resolveReady = r));
  }

  create(): void {
    this.drawLandscape();
    this.drawRogec();
    this.drawHero();
    this.resolveReady();
  }

  spawnMonster(cfg: MonsterConfig): void {
    this.monster?.destroy();
    this.approach = new MonsterApproach(cfg.seconds);
    this.monster = this.makeFogImp(FOG_SHADES[this.shadeIndex++ % FOG_SHADES.length]);
    this.monster.setAlpha(0).setScale(0.6);
    this.tweens.add({ targets: this.monster, alpha: 1, scale: 1, duration: 350, ease: 'Back.easeOut' });
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
    this.tweens.add({ targets: this.monster, x: this.xFor(this.approach.progress), duration: 300, ease: 'Quad.easeOut' });
    if (!reduceMotion()) this.cameras.main.shake(140, 0.003);
    return reached;
  }

  /** The same monster gets a new problem after a mistake: full target time for the rest of the way. */
  newProblem(): void {
    this.approach.newProblem();
  }

  /** Correct answer: the answer flies from the staff as a golden number and dissolves the fog. */
  defeatMonster(answer: string): Promise<void> {
    const target = this.monster;
    if (!target) return Promise.resolve();
    this.monster = undefined;
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
    const toY = target.y - 48;
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
          this.dissolve(target);
          this.tweens.add({
            targets: target,
            scale: 1.35,
            alpha: 0,
            duration: 380,
            onComplete: () => {
              target.destroy();
              resolve();
            },
          });
        },
      });
    });
  }

  /** The fog imp reached the hero: it wraps the hero in fog for a moment and blows away. */
  hitHero(): Promise<void> {
    const target = this.monster;
    this.monster = undefined;
    if (!reduceMotion()) this.cameras.main.shake(220, 0.006);
    if (!target) return Promise.resolve();
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
    this.monster.y = GROUND_Y - 6 + Math.sin(time / 300) * 4;
    if (this.paused) return;
    const reached = this.approach.tick(delta / 1000);
    this.placeMonster();
    if (reached) {
      this.paused = true;
      this.onReachHero();
    }
  }

  private xFor(progress: number): number {
    return MONSTER_START_X + (MONSTER_HIT_X - MONSTER_START_X) * progress;
  }

  private placeMonster(): void {
    if (this.monster) this.monster.x = this.xFor(this.approach.progress);
  }

  /** A paper layer: the shape plus a darker copy a few pixels lower, like cut card on card. */
  private paper(points: number[], colour: number, depth = 4): void {
    const g = this.add.graphics();
    g.fillStyle(COLORS.ink, 0.16);
    g.fillPoints(this.toPoints(points, depth), true);
    g.fillStyle(colour, 1);
    g.fillPoints(this.toPoints(points, 0), true);
  }

  private toPoints(flat: number[], dy: number): Phaser.Math.Vector2[] {
    const out: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < flat.length; i += 2) out.push(new Phaser.Math.Vector2(flat[i], flat[i + 1] + dy));
    return out;
  }

  private drawLandscape(): void {
    const sky = this.add.graphics();
    sky.fillGradientStyle(COLORS.skyTop, COLORS.skyTop, COLORS.skyBottom, COLORS.skyBottom, 1);
    sky.fillRect(0, 0, WIDTH, HEIGHT);
    this.add.circle(118, 72, 30, COLORS.sun);

    // Far ridge
    this.paper([0, 220, 70, 170, 140, 196, 230, 140, 330, 190, 420, 150, 520, 186, 610, 130, 700, 176, 800, 150, 800, 300, 0, 300], COLORS.ridgeFar, 3);
    // Triglav: three peaks, the middle one highest, with snow
    const triglav = [380, 300, 440, 196, 476, 168, 505, 150, 528, 92, 552, 140, 580, 120, 620, 178, 690, 230, 740, 300];
    this.paper(triglav, COLORS.mountain, 5);
    this.paper([505, 150, 528, 92, 552, 140, 540, 134, 530, 146, 518, 136], COLORS.snow, 0);
    this.paper([476, 168, 490, 160, 505, 150, 498, 166, 487, 162], COLORS.snow, 0);
    this.paper([580, 120, 600, 148, 590, 144, 580, 152, 570, 140], COLORS.snow, 0);
    // Rolling hills and meadow
    this.paper([0, 250, 120, 226, 260, 246, 400, 222, 560, 248, 700, 230, 800, 244, 800, 320, 0, 320], COLORS.hill, 4);
    this.drawKozolec(650, 236);
    this.paper([0, GROUND_Y - 6, 200, GROUND_Y - 14, 420, GROUND_Y - 4, 640, GROUND_Y - 12, 800, GROUND_Y - 6, 800, HEIGHT, 0, HEIGHT], COLORS.meadow, 4);
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 92 + (i % 3) * 11;
      const y = GROUND_Y + 22 + (i % 2) * 24;
      this.add.circle(x, y, 3, COLORS.snow);
      this.add.circle(x, y, 1.4, COLORS.honey);
    }
    // Pozabnik's fog rolling in from the right
    for (let i = 0; i < 5; i++) {
      const fog = this.add.ellipse(560 + i * 70, GROUND_Y - 4 - (i % 2) * 10, 150, 38, COLORS.fog, 0.32);
      if (!reduceMotion()) this.tweens.add({ targets: fog, x: fog.x - 18, yoyo: true, repeat: -1, duration: 2600 + i * 400, ease: 'Sine.easeInOut' });
    }
  }

  /** A small Slovene hayrack on the hill: the village of chapter 1. */
  private drawKozolec(x: number, y: number): void {
    const g = this.add.graphics();
    g.fillStyle(COLORS.wood, 1);
    g.fillRect(x, y - 30, 4, 30);
    g.fillRect(x + 22, y - 30, 4, 30);
    g.fillRect(x + 44, y - 30, 4, 30);
    for (let i = 0; i < 4; i++) g.fillRect(x, y - 27 + i * 7, 48, 2);
    g.fillStyle(COLORS.roof, 1);
    g.fillTriangle(x - 6, y - 30, x + 24, y - 44, x + 54, y - 30);
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

  private makeFogImp(shade: number): Phaser.GameObjects.Container {
    const m = this.add.container(MONSTER_START_X, GROUND_Y - 6);
    // Trailing wisps
    m.add(this.add.circle(52, -22, 12, shade, 0.5));
    m.add(this.add.circle(70, -30, 8, shade, 0.35));
    m.add(this.add.circle(84, -24, 5, shade, 0.25));
    // Cloud body: overlapping puffs with a darker underside
    m.add(this.add.ellipse(0, -14, 86, 30, COLORS.ink, 0.12));
    for (const [x, y, r] of [
      [-26, -30, 22],
      [24, -30, 22],
      [0, -50, 30],
      [-12, -24, 22],
      [14, -22, 22],
    ]) {
      m.add(this.add.circle(x, y, r, shade));
    }
    m.add(this.add.circle(-8, -62, 10, 0xffffff, 0.35));
    // Face
    m.add(this.add.ellipse(-12, -42, 16, 19, 0xffffff));
    m.add(this.add.ellipse(12, -42, 16, 19, 0xffffff));
    m.add(this.add.circle(-14, -40, 5, COLORS.ink));
    m.add(this.add.circle(10, -40, 5, COLORS.ink));
    m.add(this.add.circle(-12, -42, 1.6, 0xffffff));
    m.add(this.add.circle(12, -42, 1.6, 0xffffff));
    m.add(this.add.ellipse(0, -24, 10, 8, COLORS.ink, 0.75));
    m.add(this.add.circle(-24, -30, 4, COLORS.berry, 0.35));
    m.add(this.add.circle(24, -30, 4, COLORS.berry, 0.35));
    return m;
  }

  /** Fog breaks into puffs that drift up, with a few honey sparks. */
  private dissolve(target: Phaser.GameObjects.Container): void {
    const cx = target.x;
    const cy = target.y - 40;
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const isSpark = i % 3 === 0;
      const dot = this.add.circle(cx, cy, isSpark ? 5 : 11, isSpark ? COLORS.honey : COLORS.fog, isSpark ? 1 : 0.7);
      this.tweens.add({
        targets: dot,
        x: cx + Math.cos(angle) * (isSpark ? 70 : 50),
        y: cy + Math.sin(angle) * (isSpark ? 70 : 40) - 20,
        alpha: 0,
        scale: isSpark ? 0.4 : 1.6,
        duration: 520,
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }
}
