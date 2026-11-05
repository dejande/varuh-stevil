import Phaser from 'phaser';
import { COLORS } from '../theme';

/**
 * Placeholder art for the five chapters (spec §8), drawn from shapes in the paper-cut style:
 * a background, a regular monster (with colour variants) and a boss per chapter.
 * Real illustrations replace these in milestone 5.
 */
export const WIDTH = 800;
export const HEIGHT = 360;
export const GROUND_Y = 292;

type Scene = Phaser.Scene;
type Box = Phaser.GameObjects.Container;

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function points(flat: number[], dy = 0): Phaser.Math.Vector2[] {
  const out: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < flat.length; i += 2) out.push(new Phaser.Math.Vector2(flat[i], flat[i + 1] + dy));
  return out;
}

/** A paper layer: the shape plus a darker copy a few pixels lower, like cut card on card. */
export function paper(scene: Scene, flat: number[], colour: number, depth = 4, alpha = 1): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  if (depth > 0) {
    g.fillStyle(COLORS.ink, 0.16 * alpha);
    g.fillPoints(points(flat, depth), true);
  }
  g.fillStyle(colour, alpha);
  g.fillPoints(points(flat), true);
  return g;
}

function sky(scene: Scene, top: number, bottom: number): void {
  const g = scene.add.graphics();
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, WIDTH, HEIGHT);
}

function drift(scene: Scene, target: Phaser.GameObjects.GameObject & { x: number }, dx: number, duration: number): void {
  if (!reduceMotion()) scene.tweens.add({ targets: target, x: target.x + dx, yoyo: true, repeat: -1, duration, ease: 'Sine.easeInOut' });
}

function fogBank(scene: Scene, alpha: number, from = 560): void {
  for (let i = 0; i < 5; i++) {
    const fog = scene.add.ellipse(from + i * 70, GROUND_Y - 4 - (i % 2) * 10, 150, 38, COLORS.fog, alpha);
    drift(scene, fog, -18, 2600 + i * 400);
  }
}

function kozolec(scene: Scene, x: number, y: number): void {
  const g = scene.add.graphics();
  g.fillStyle(COLORS.wood, 1);
  for (const dx of [0, 22, 44]) g.fillRect(x + dx, y - 30, 4, 30);
  for (let i = 0; i < 4; i++) g.fillRect(x, y - 27 + i * 7, 48, 2);
  g.fillStyle(COLORS.roof, 1);
  g.fillTriangle(x - 6, y - 30, x + 24, y - 44, x + 54, y - 30);
}

function alps(scene: Scene, far: number, near: number): void {
  paper(scene, [0, 220, 70, 170, 140, 196, 230, 140, 330, 190, 420, 150, 520, 186, 610, 130, 700, 176, 800, 150, 800, 300, 0, 300], far, 3);
  paper(scene, [380, 300, 440, 196, 476, 168, 505, 150, 528, 92, 552, 140, 580, 120, 620, 178, 690, 230, 740, 300], near, 5);
  paper(scene, [505, 150, 528, 92, 552, 140, 540, 134, 530, 146, 518, 136], COLORS.snow, 0);
  paper(scene, [476, 168, 490, 160, 505, 150, 498, 166, 487, 162], COLORS.snow, 0);
  paper(scene, [580, 120, 600, 148, 590, 144, 580, 152, 570, 140], COLORS.snow, 0);
}

function meadow(scene: Scene, colour: number): void {
  paper(scene, [0, GROUND_Y - 6, 200, GROUND_Y - 14, 420, GROUND_Y - 4, 640, GROUND_Y - 12, 800, GROUND_Y - 6, 800, HEIGHT, 0, HEIGHT], colour, 4);
}

/** 1 · The village below the mountain. */
function village(scene: Scene): void {
  sky(scene, COLORS.skyTop, COLORS.skyBottom);
  scene.add.circle(118, 72, 30, COLORS.sun);
  alps(scene, COLORS.ridgeFar, COLORS.mountain);
  paper(scene, [0, 250, 120, 226, 260, 246, 400, 222, 560, 248, 700, 230, 800, 244, 800, 320, 0, 320], COLORS.hill, 4);
  for (const [x, w] of [[300, 30], [350, 24]]) {
    paper(scene, [x, 240, x + w, 240, x + w, 222, x, 222], 0xf4f7fb, 2);
    paper(scene, [x - 5, 223, x + w / 2, 208, x + w + 5, 223], COLORS.roof, 2);
  }
  kozolec(scene, 650, 236);
  meadow(scene, COLORS.meadow);
  for (let i = 0; i < 9; i++) {
    const x = 40 + i * 92 + (i % 3) * 11;
    const y = GROUND_Y + 22 + (i % 2) * 24;
    scene.add.circle(x, y, 3, COLORS.snow);
    scene.add.circle(x, y, 1.4, COLORS.honey);
  }
  fogBank(scene, 0.32);
}

/** 2 · The lake: water up to the shore, an island with a church. */
function lake(scene: Scene): void {
  sky(scene, 0xa8d8ec, 0xe8f5f8);
  scene.add.circle(640, 70, 28, COLORS.sun);
  alps(scene, 0xa9bcd3, 0x5f7aa3);
  const water = scene.add.graphics();
  water.fillGradientStyle(0x7fbfdf, 0x7fbfdf, 0x3d84b8, 0x3d84b8, 1);
  water.fillRect(0, 236, WIDTH, HEIGHT - 236);
  for (let i = 0; i < 14; i++) {
    const r = scene.add.rectangle(30 + ((i * 137) % 760), 248 + ((i * 29) % 60), 26 + (i % 3) * 10, 2.5, 0xffffff, 0.55);
    drift(scene, r, 10, 1800 + (i % 4) * 300);
  }
  // Island with a little church
  paper(scene, [400, 250, 430, 236, 500, 232, 540, 244, 520, 252, 420, 254], 0x5e9e4a, 3);
  paper(scene, [458, 236, 482, 236, 482, 220, 458, 220], 0xf4f7fb, 2);
  paper(scene, [455, 221, 470, 210, 485, 221], COLORS.roof, 2);
  paper(scene, [484, 236, 494, 236, 494, 204, 484, 204], 0xf4f7fb, 2);
  paper(scene, [482, 205, 489, 190, 496, 205], COLORS.roof, 2);
  // The shore the hero stands on, with reeds
  paper(scene, [0, GROUND_Y - 4, 160, GROUND_Y - 12, 300, GROUND_Y + 2, 300, HEIGHT, 0, HEIGHT], 0x6aa85a, 4);
  paper(scene, [300, GROUND_Y + 2, 800, GROUND_Y + 6, 800, HEIGHT, 300, HEIGHT], 0x3d84b8, 0);
  for (const x of [250, 262, 274]) {
    scene.add.rectangle(x, GROUND_Y - 10, 3, 34, 0x4e7d3f);
    scene.add.ellipse(x, GROUND_Y - 28, 6, 14, 0x7a5230);
  }
}

/** 3 · The karst cave: dripstones above and below, an underground river. */
function cave(scene: Scene): void {
  sky(scene, 0x2e2a3a, 0x4a4458);
  paper(scene, [0, 0, 800, 0, 800, 40, 700, 60, 600, 36, 480, 66, 360, 40, 240, 70, 120, 44, 0, 64], 0x3a3446, 4);
  for (let i = 0; i < 12; i++) {
    const x = 30 + i * 66 + (i % 2) * 14;
    const len = 40 + ((i * 37) % 60);
    paper(scene, [x - 12, 40, x + 12, 40, x, 40 + len], 0x7d7287, 3);
    scene.add.circle(x, 40 + len, 3, 0xbfe3f2, 0.9);
  }
  paper(scene, [0, 230, 140, 210, 300, 236, 460, 214, 620, 240, 800, 220, 800, 300, 0, 300], 0x564e66, 3);
  for (const [x, h] of [[330, 46], [420, 70], [560, 52], [690, 80]]) paper(scene, [x - 16, 270, x + 16, 270, x, 270 - h], 0x8a7f94, 3);
  const river = scene.add.graphics();
  river.fillGradientStyle(0x3a6f9a, 0x3a6f9a, 0x2b4f73, 0x2b4f73, 1);
  river.fillRect(0, 266, WIDTH, 24);
  for (let i = 0; i < 6; i++) {
    const glint = scene.add.rectangle(80 + i * 130, 276, 30, 2, 0xbfe3f2, 0.6);
    drift(scene, glint, 14, 2200 + i * 200);
  }
  paper(scene, [0, GROUND_Y - 4, 260, GROUND_Y - 10, 520, GROUND_Y - 2, 800, GROUND_Y - 8, 800, HEIGHT, 0, HEIGHT], 0x6b6178, 4);
  for (const [x, y] of [[120, 120], [520, 140], [700, 110]]) scene.add.star(x, y, 4, 2, 6, 0xbfe3f2, 0.8);
}

function pine(scene: Scene, x: number, base: number, h: number, colour: number): void {
  scene.add.rectangle(x, base - 6, 8, 14, 0x6b4a2b);
  for (let i = 0; i < 3; i++) {
    const w = (h / 2) * (1 - i * 0.22);
    const y = base - 10 - i * (h / 4);
    paper(scene, [x - w, y, x, y - h / 2.2, x + w, y], colour, 2);
  }
}

/** 4 · The great forest: layers of pines, mushrooms. */
function forest(scene: Scene): void {
  sky(scene, 0xbfe0cf, 0xe8f3e6);
  for (let i = 0; i < 10; i++) pine(scene, 20 + i * 86, 250, 150, 0x6f9f7a);
  paper(scene, [0, 250, 800, 240, 800, 300, 0, 300], 0x5b8e55, 3);
  for (let i = 0; i < 8; i++) pine(scene, 60 + i * 104 + (i % 2) * 20, 286, 190, 0x2f6b4f);
  meadow(scene, 0x4e7d3f);
  for (const [x, c] of [[300, COLORS.berry], [460, 0xe0a526], [620, COLORS.berry]] as const) {
    scene.add.rectangle(x, GROUND_Y + 14, 6, 12, 0xf4ead7);
    scene.add.ellipse(x, GROUND_Y + 7, 22, 12, c);
    scene.add.circle(x - 4, GROUND_Y + 5, 2, 0xffffff);
  }
  for (let i = 0; i < 8; i++) {
    const leaf = scene.add.ellipse(80 + i * 95, GROUND_Y + 30 + (i % 2) * 18, 10, 5, 0xc98a17, 0.8);
    leaf.setAngle(i * 37);
  }
}

/** 5 · The summit: bare rock and snow, the thickest fog. */
function summit(scene: Scene): void {
  sky(scene, 0xb7c3d6, 0xe3e8ef);
  paper(scene, [0, 200, 120, 120, 220, 170, 340, 60, 470, 160, 560, 100, 680, 170, 800, 110, 800, 300, 0, 300], 0x8a93a6, 4);
  paper(scene, [320, 82, 340, 60, 362, 86, 350, 80, 340, 92, 330, 80], COLORS.snow, 0);
  paper(scene, [545, 112, 560, 100, 575, 116, 565, 112, 556, 120], COLORS.snow, 0);
  paper(scene, [0, 250, 160, 230, 330, 254, 520, 226, 800, 250, 800, 300, 0, 300], 0x737d91, 3);
  paper(scene, [0, GROUND_Y - 6, 220, GROUND_Y - 16, 460, GROUND_Y - 4, 800, GROUND_Y - 12, 800, HEIGHT, 0, HEIGHT], 0x9aa2b2, 4);
  for (const [x, w] of [[80, 70], [300, 50], [560, 90]]) scene.add.ellipse(x, GROUND_Y + 20, w, 14, COLORS.snow, 0.9);
  for (let i = 0; i < 4; i++) {
    const band = scene.add.ellipse(120 + i * 200, 150 + (i % 2) * 50, 320, 50, COLORS.fog, 0.35);
    drift(scene, band, i % 2 ? 30 : -30, 4000 + i * 600);
  }
  fogBank(scene, 0.45, 420);
}

export function drawBackground(scene: Scene, chapter: number): void {
  [village, lake, cave, forest, summit][Math.min(4, Math.max(0, chapter - 1))](scene);
}

/** Small olm with a glowing tip; she travels with the hero from chapter 4 on. */
export function drawRibica(scene: Scene, x: number, y: number): void {
  const r = scene.add.container(x, y);
  r.add(scene.add.circle(18, -10, 16, 0xfff3b0, 0.35));
  r.add(scene.add.ellipse(0, -6, 40, 12, 0xf6c6c0));
  r.add(scene.add.ellipse(16, -8, 14, 11, 0xf6c6c0));
  for (const dy of [-12, -8, -4]) r.add(scene.add.ellipse(22, -8 + dy / 2, 6, 3, 0xe58a8a));
  r.add(scene.add.circle(19, -10, 1.6, COLORS.ink));
  r.add(tri(scene, -22, -6, 0, 0, 10, -3, 10, 3, 0xf6c6c0));
  if (!reduceMotion()) scene.tweens.add({ targets: r, y: y - 6, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });
}

/* ---------- Creatures ---------- */

/**
 * A triangle whose points are offsets from (x, y), drawn exactly there. Phaser's own triangle shape
 * re-centres its points on their bounding box, which shifts shapes given with negative offsets.
 */
function tri(scene: Scene, x: number, y: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, colour: number, alpha = 1) {
  const g = scene.add.graphics();
  g.fillStyle(colour, alpha);
  g.fillTriangle(x + x1, y + y1, x + x2, y + y2, x + x3, y + y3);
  return g;
}

function face(scene: Scene, m: Box, x: number, y: number, size = 1, angry = false): void {
  m.add(scene.add.ellipse(x - 12 * size, y, 16 * size, 19 * size, 0xffffff));
  m.add(scene.add.ellipse(x + 12 * size, y, 16 * size, 19 * size, 0xffffff));
  m.add(scene.add.circle(x - 14 * size, y + 2 * size, 5 * size, COLORS.ink));
  m.add(scene.add.circle(x + 10 * size, y + 2 * size, 5 * size, COLORS.ink));
  m.add(scene.add.circle(x - 12 * size, y, 1.6 * size, 0xffffff));
  m.add(scene.add.circle(x + 12 * size, y, 1.6 * size, 0xffffff));
  if (angry) {
    m.add(scene.add.rectangle(x - 12 * size, y - 13 * size, 16 * size, 3 * size, COLORS.ink).setAngle(18));
    m.add(scene.add.rectangle(x + 12 * size, y - 13 * size, 16 * size, 3 * size, COLORS.ink).setAngle(-18));
  }
}

const SHADES = [
  [COLORS.fog, 0xa9b7cf, 0xc4b4cf, 0xb3c4c9],
  [0x6fb7e8, 0x5aa6d6, 0x7fc4e0, 0x8ab8f0],
  [0x9b8f86, 0x8d8a99, 0xa49480, 0x8f8478],
  [0x8b5a2b, 0x7a4e2a, 0x9a6634, 0x6f4a2e],
  [0x5a5670, 0x4d4a63, 0x666280, 0x57536e],
];

function fogImp(scene: Scene, m: Box, shade: number): void {
  m.add(scene.add.circle(52, -22, 12, shade, 0.5));
  m.add(scene.add.circle(70, -30, 8, shade, 0.35));
  m.add(scene.add.circle(84, -24, 5, shade, 0.25));
  m.add(scene.add.ellipse(0, -14, 86, 30, COLORS.ink, 0.12));
  for (const [x, y, r] of [[-26, -30, 22], [24, -30, 22], [0, -50, 30], [-12, -24, 22], [14, -22, 22]]) m.add(scene.add.circle(x, y, r, shade));
  m.add(scene.add.circle(-8, -62, 10, 0xffffff, 0.35));
  face(scene, m, 0, -42);
  m.add(scene.add.ellipse(0, -24, 10, 8, COLORS.ink, 0.75));
  m.add(scene.add.circle(-24, -30, 4, COLORS.berry, 0.35));
  m.add(scene.add.circle(24, -30, 4, COLORS.berry, 0.35));
}

function waterSprite(scene: Scene, m: Box, shade: number): void {
  m.add(scene.add.ellipse(0, -4, 70, 16, 0xffffff, 0.5));
  m.add(tri(scene, 0, -60, -24, 18, 0, -28, 24, 18, shade));
  m.add(scene.add.circle(0, -32, 30, shade));
  m.add(scene.add.ellipse(-12, -48, 10, 18, 0xffffff, 0.5));
  face(scene, m, 0, -36);
  m.add(scene.add.arc(0, -22, 8, 20, 160, false, COLORS.ink, 0.8));
  for (const [x, r] of [[-30, 5], [32, 4], [40, 3]]) m.add(scene.add.circle(x, -6, r, shade, 0.7));
}

function golem(scene: Scene, m: Box, shade: number): void {
  m.add(scene.add.ellipse(-18, -6, 26, 14, shade));
  m.add(scene.add.ellipse(18, -6, 26, 14, shade));
  m.add(scene.add.ellipse(0, -30, 72, 46, shade));
  m.add(scene.add.ellipse(0, -62, 52, 38, Phaser.Display.Color.ValueToColor(shade).lighten(10).color));
  for (const [x, h] of [[-16, 20], [0, 28], [16, 18]]) m.add(tri(scene, x, -80, -7, 0, 0, -h, 7, 0, 0xc9bfb3));
  m.add(scene.add.circle(-24, -26, 6, 0x6b8f4a, 0.8));
  m.add(scene.add.circle(20, -18, 4, 0x6b8f4a, 0.8));
  face(scene, m, 0, -62, 0.9);
  m.add(scene.add.rectangle(0, -46, 16, 3, COLORS.ink, 0.7));
}

function woodGoblin(scene: Scene, m: Box, shade: number): void {
  const g = scene.add.graphics();
  g.lineStyle(4, 0x6b4a2b, 1);
  g.lineBetween(-24, -36, -42, -50);
  g.lineBetween(24, -36, 42, -48);
  m.add(g);
  m.add(scene.add.rectangle(0, -32, 50, 62, shade));
  m.add(scene.add.ellipse(0, -63, 50, 14, 0xc89a63));
  m.add(scene.add.ellipse(0, -63, 30, 8, 0xb0844f));
  m.add(scene.add.ellipse(0, -74, 54, 18, 0x5e9e4a));
  m.add(scene.add.rectangle(0, -86, 3, 10, 0x6b4a2b));
  face(scene, m, 0, -38, 0.85);
  m.add(scene.add.circle(0, -26, 4, 0x6b4a2b));
  m.add(scene.add.arc(0, -16, 7, 20, 160, false, COLORS.ink, 0.8));
}

function fogCrow(scene: Scene, m: Box, shade: number): void {
  m.add(scene.add.circle(-10, -2, 14, COLORS.fog, 0.4));
  m.add(scene.add.circle(14, 0, 10, COLORS.fog, 0.35));
  m.add(tri(scene, -34, -40, 0, -10, -22, -18, 0, 10, shade));
  m.add(scene.add.ellipse(0, -40, 58, 40, shade));
  const wing = scene.add.ellipse(-6, -40, 40, 22, Phaser.Display.Color.ValueToColor(shade).darken(12).color);
  wing.setAngle(-20);
  m.add(wing);
  m.add(scene.add.circle(-20, -62, 17, shade));
  m.add(tri(scene, -42, -60, 8, -6, -12, 0, 8, 6, 0xe0a526));
  m.add(scene.add.circle(-24, -66, 6, 0xffffff));
  m.add(scene.add.circle(-26, -65, 3, COLORS.ink));
  if (!reduceMotion()) scene.tweens.add({ targets: wing, angle: 10, yoyo: true, repeat: -1, duration: 260 });
}

const MONSTERS = [fogImp, waterSprite, golem, woodGoblin, fogCrow];

/** Flying creatures hover above the ground. */
export function creatureLift(chapter: number, boss: boolean): number {
  if (chapter === 5 && !boss) return 46;
  if (chapter === 3 && boss) return 40;
  return 0;
}

export function makeMonster(scene: Scene, chapter: number, variant: number): Box {
  const c = Math.min(5, Math.max(1, chapter)) - 1;
  const m = scene.add.container(0, 0);
  MONSTERS[c](scene, m, SHADES[c][variant % SHADES[c].length]);
  return m;
}

/* ---------- Bosses ---------- */

function hayrackGiant(scene: Scene, m: Box): void {
  m.add(scene.add.rectangle(-36, -30, 12, 60, COLORS.wood));
  m.add(scene.add.rectangle(36, -30, 12, 60, COLORS.wood));
  m.add(scene.add.rectangle(-78, -110, 46, 12, COLORS.wood).setAngle(-25));
  m.add(scene.add.rectangle(78, -110, 46, 12, COLORS.wood).setAngle(25));
  m.add(scene.add.rectangle(0, -108, 116, 100, 0xe3c35f));
  for (let i = 0; i < 6; i++) m.add(scene.add.rectangle(-48 + i * 19, -108, 3, 96, 0xc9a63f));
  for (const y of [-140, -76]) m.add(scene.add.rectangle(0, y, 124, 7, COLORS.wood));
  m.add(tri(scene, 0, -178, -76, 22, 0, -24, 76, 22, COLORS.roof));
  face(scene, m, 0, -112, 1.4, true);
  m.add(scene.add.rectangle(0, -86, 30, 6, COLORS.ink, 0.8));
}

function lakeDragon(scene: Scene, m: Box): void {
  m.add(scene.add.ellipse(0, -2, 170, 26, 0x3d84b8, 0.9));
  m.add(scene.add.ellipse(0, -6, 130, 14, 0xffffff, 0.35));
  const neck = [[50, -18, 32], [36, -50, 30], [22, -80, 28], [8, -106, 26], [-6, -126, 24]];
  for (const [x, y, r] of neck) m.add(scene.add.circle(x, y, r, 0x3f9e8f));
  for (const [x, y] of neck) m.add(tri(scene, x + 22, y - 6, 0, -14, 14, 6, -6, 8, 0x2d7a6e));
  for (const [x, y] of neck) m.add(scene.add.circle(x - 8, y + 4, 5, 0x8fd1c3, 0.8));
  m.add(scene.add.ellipse(-30, -146, 76, 50, 0x3f9e8f));
  m.add(scene.add.ellipse(-64, -138, 46, 30, 0x4fb3a3));
  m.add(scene.add.circle(-78, -144, 3, COLORS.ink));
  m.add(tri(scene, -14, -182, -8, 14, 0, -14, 8, 14, 0xe0a526));
  m.add(tri(scene, 6, -176, -8, 14, 2, -12, 8, 14, 0xe0a526));
  face(scene, m, -26, -152, 0.9, true);
}

function shadowBat(scene: Scene, m: Box): void {
  const wing = (dir: number) =>
    scene.add.polygon(0, 0, [0, -110, dir * 120, -150, dir * 110, -100, dir * 90, -112, dir * 74, -80, dir * 52, -96, dir * 30, -70], 0x3b2f5c).setOrigin(0, 0);
  const left = wing(-1);
  const right = wing(1);
  m.add(left);
  m.add(right);
  m.add(scene.add.ellipse(0, -96, 66, 86, 0x4a3b70));
  m.add(tri(scene, -20, -146, -10, 14, 0, -18, 10, 14, 0x4a3b70));
  m.add(tri(scene, 20, -146, -10, 14, 0, -18, 10, 14, 0x4a3b70));
  m.add(scene.add.ellipse(-13, -110, 18, 20, 0xffe066));
  m.add(scene.add.ellipse(13, -110, 18, 20, 0xffe066));
  m.add(scene.add.circle(-13, -108, 5, COLORS.ink));
  m.add(scene.add.circle(13, -108, 5, COLORS.ink));
  m.add(tri(scene, -6, -82, -3, 0, 0, 8, 3, 0, 0xffffff));
  m.add(tri(scene, 6, -82, -3, 0, 0, 8, 3, 0, 0xffffff));
  if (!reduceMotion()) scene.tweens.add({ targets: [left, right], scaleY: 0.8, yoyo: true, repeat: -1, duration: 380 });
}

function oldOak(scene: Scene, m: Box): void {
  for (const [x, w] of [[-44, 30], [44, 30], [0, 26]]) m.add(tri(scene, x, -8, -w / 2, 8, 0, -16, w / 2, 8, 0x6b4a2b));
  m.add(scene.add.rectangle(0, -70, 76, 140, 0x7a5230));
  for (const x of [-22, 6, 24]) m.add(scene.add.rectangle(x, -70, 3, 120, 0x6b4426));
  const g = scene.add.graphics();
  g.lineStyle(10, 0x7a5230, 1);
  g.lineBetween(-36, -100, -86, -132);
  g.lineBetween(36, -96, 84, -128);
  m.add(g);
  for (const [x, y, r, c] of [[0, -196, 64, 0x4e8a3e], [-60, -170, 44, 0x5e9e4a], [60, -170, 44, 0x5e9e4a], [0, -236, 42, 0x5e9e4a]]) m.add(scene.add.circle(x, y, r, c));
  face(scene, m, 0, -96, 1.3, true);
  m.add(scene.add.ellipse(0, -60, 34, 12, 0x3e2a1a));
}

function pozabnik(scene: Scene, m: Box): void {
  for (const [x, r] of [[-60, 26], [50, 30], [0, 22]]) m.add(scene.add.circle(x, -6, r, COLORS.fog, 0.55));
  // Robe from the shoulders down, hood on top of it.
  m.add(tri(scene, 0, -62, -64, 62, 0, -62, 64, 62, 0x6f6a86));
  m.add(scene.add.ellipse(0, -126, 70, 74, 0x59546f));
  m.add(scene.add.ellipse(0, -118, 42, 44, 0x2b2940));
  m.add(scene.add.circle(-9, -122, 4.5, 0xe8e4ff));
  m.add(scene.add.circle(9, -122, 4.5, 0xe8e4ff));
  m.add(scene.add.rectangle(64, -100, 6, 200, 0x4a4560));
  const orb = scene.add.circle(64, -206, 16, COLORS.fog);
  m.add(orb);
  if (!reduceMotion()) scene.tweens.add({ targets: orb, scale: 1.25, alpha: 0.7, yoyo: true, repeat: -1, duration: 900 });
}

const BOSSES = [hayrackGiant, lakeDragon, shadowBat, oldOak, pozabnik];

export function makeBoss(scene: Scene, chapter: number): Box {
  const m = scene.add.container(0, 0);
  BOSSES[Math.min(5, Math.max(1, chapter)) - 1](scene, m);
  return m;
}

/** Colour of the puffs when a creature dissolves. */
export function dissolveColour(chapter: number): number {
  return [COLORS.fog, 0x9fd3f0, 0xc9bfb3, 0x8fc07a, COLORS.fog][Math.min(5, Math.max(1, chapter)) - 1];
}
