import { expect, type Page } from '@playwright/test';

export type Lang = 'sl' | 'en';

export interface Setup {
  lang: Lang;
  ops: ('add' | 'sub' | 'mul' | 'div')[];
  range: 10 | 20 | 100 | 1000;
  speed: 'relaxed' | 'normal' | 'fast';
  missing: boolean;
}

/** Solves a problem as shown on screen, e.g. `56 : ? = 7` or `8 × 5 = ?`. */
export function solve(text: string): number {
  const [lhs, c] = text.split(' = ');
  const [a, op, b] = lhs.split(' ');
  const apply: Record<string, (x: number, y: number) => number> = {
    '+': (x, y) => x + y,
    '−': (x, y) => x - y,
    '·': (x, y) => x * y,
    '×': (x, y) => x * y,
    ':': (x, y) => x / y,
    '÷': (x, y) => x / y,
  };
  const inverse: Record<string, string> = { '+': '−', '−': '+', '·': ':', '×': ':', ':': '·', '÷': '·' };
  if (c === '?') return apply[op](+a, +b);
  if (b === '?') return op === '+' || op === '·' || op === '×' ? apply[inverse[op]](+c, +a) : apply[op](+a, +c);
  return apply[inverse[op]](+c, +b);
}

export interface Player extends Partial<Setup> {
  name: string;
  heroName?: string;
  gender?: 'girl' | 'boy';
  look?: 'blue' | 'red' | 'green' | 'purple' | 'teal' | 'gold';
  inputMode?: 'keypad' | 'choices';
}

/** Opens the app on a fresh device (each Playwright test gets empty storage). */
export async function openApp(page: Page): Promise<void> {
  await page.goto('./');
}

async function setChecked(page: Page, selector: string, on: boolean): Promise<void> {
  const box = page.locator(selector);
  if (on) await box.check({ force: true });
  else await box.uncheck({ force: true });
}

/** Fills the player editor (first run, add or edit) and saves it. */
export async function fillPlayer(page: Page, p: Player): Promise<void> {
  const form = page.locator('.settings-form');
  await expect(form).toBeVisible();
  await form.locator('input[name=name]').fill(p.name);
  if (p.heroName !== undefined) await form.locator('input[name=heroName]').fill(p.heroName);
  if (p.gender) await form.locator(`input[name=gender][value=${p.gender}]`).check({ force: true });
  if (p.look) await form.locator(`input[name=look][value=${p.look}]`).check({ force: true });
  if (p.lang) await form.locator(`input[name=lang][value=${p.lang}]`).check({ force: true });
  if (p.inputMode) await form.locator(`input[name=inputMode][value=${p.inputMode}]`).check({ force: true });
  if (p.ops) for (const op of ['add', 'sub', 'mul', 'div'] as const) await setChecked(page, `.settings-form input[name=ops][value=${op}]`, p.ops.includes(op));
  if (p.range) await form.locator(`input[name=range][value="${p.range}"]`).check({ force: true });
  if (p.speed) await form.locator(`input[name=speed][value=${p.speed}]`).check({ force: true });
  if (p.missing !== undefined) await setChecked(page, '.settings-form input[name=missing]', p.missing);
  await form.locator('button[type=submit]').click();
}

/** First start: creates the player, and skips the prologue unless asked to keep it open. */
export async function createFirstPlayer(page: Page, p: Player, { keepPrologue = false } = {}): Promise<void> {
  await openApp(page);
  await fillPlayer(page, p);
  await expect(page.locator('.story')).toBeVisible();
  if (!keepPrologue) {
    await page.locator('[data-action=skip]').click();
    await expect(page.locator('.greeting')).toBeVisible();
  }
}

export async function startPractice(page: Page, s: Setup & Partial<Player>): Promise<void> {
  await createFirstPlayer(page, { name: 'Nika', ...s });
  await page.locator('[data-action=start]').click();
  await expect(page.locator('.problem')).toContainText('?');
}

/** Sets the active player's story stars directly in IndexedDB (to reach later chapters quickly), then reloads. */
export async function seedStars(page: Page, stars: Record<string, number>): Promise<void> {
  await page.evaluate(async (stars) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('varuh-stevil', 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const meta = await new Promise<{ activeProfileId: string }>((resolve) => {
      const r = db.transaction('meta').objectStore('meta').get('meta');
      r.onsuccess = () => resolve(r.result);
    });
    const profile = await new Promise<{ progress: { stars: Record<string, number> } }>((resolve) => {
      const r = db.transaction('profiles').objectStore('profiles').get(meta.activeProfileId);
      r.onsuccess = () => resolve(r.result);
    });
    profile.progress.stars = stars;
    await new Promise<void>((resolve) => {
      const tx = db.transaction('profiles', 'readwrite');
      tx.objectStore('profiles').put(profile);
      tx.oncomplete = () => resolve();
    });
    db.close();
  }, stars);
  await page.reload();
}

/** All five levels of the given chapters finished with the given stars, and their bosses beaten. */
export function chaptersDone(chapters: number[], levelStars = 3): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of chapters) {
    for (let l = 1; l <= 5; l++) out[`c${c}l${l}`] = levelStars;
    out[`c${c}boss`] = 2;
  }
  return out;
}

/** Opens the parents' corner from the current screen: hold for 3 s, then solve the multiplication. */
export async function passGate(page: Page): Promise<void> {
  await page.locator('[data-action=parents]').click();
  const hold = page.locator('[data-action=hold]');
  await hold.hover();
  await page.mouse.down();
  await page.waitForTimeout(3200);
  await page.mouse.up();
  const label = (await page.locator('.gate-label').textContent()) ?? '';
  const [a, b] = (label.match(/\d+/g) ?? []).map(Number);
  await page.locator('#gate-answer').fill(String(a * b));
  await page.locator('.gate-question button[type=submit]').click();
  await expect(page.locator('.parents')).toBeVisible();
}

/** The problem on screen, once one is waiting for an answer (the battle draws the first one after a moment). */
export async function currentProblem(page: Page): Promise<string> {
  await expect(page.locator('.problem')).toContainText('?');
  return (await page.locator('.problem').textContent()) ?? '';
}

/** Answers on the keypad, or taps the matching choice in 4-choice mode. */
export async function answer(page: Page, value: number): Promise<void> {
  if (await page.locator('.choices').count()) {
    const choice = page.locator(`.choices [data-choice="${value}"]`);
    if (await choice.count()) return choice.click();
    // The value is not offered: tap a different (wrong) choice.
    return page.locator('.choices [data-choice]').first().click();
  }
  for (const digit of String(value)) await page.locator(`.keypad [data-key="${digit}"]`).click();
  await page.locator('.keypad [data-key="ok"]').click();
}

export type Screen = 'problem' | 'feedback' | 'result';

/** Waits until the battle settles on a new problem, the mistake card or the result screen. */
export async function waitForNext(page: Page): Promise<Screen> {
  await page.waitForFunction(() => {
    if (document.querySelector('.result')) return true;
    const fb = document.querySelector<HTMLElement>('.feedback');
    if (fb && !fb.hidden) return true;
    const p = document.querySelector('.problem');
    return !!p && !p.classList.contains('correct') && (p.textContent ?? '').includes('?');
  });
  if (await page.locator('.result').count()) return 'result';
  if (await page.locator('.feedback').isVisible()) return 'feedback';
  return 'problem';
}

export async function fullHearts(page: Page): Promise<number> {
  return page.locator('.hearts .heart.full').count();
}

/** Answers every problem correctly until the level ends. Returns the problems seen. */
export async function playToEnd(page: Page): Promise<string[]> {
  const seen: string[] = [];
  for (let i = 0; i < 40; i++) {
    const screen = await waitForNext(page);
    if (screen === 'result') return seen;
    if (screen === 'feedback') {
      await page.locator('.feedback [data-action=continue]').click();
      continue;
    }
    const text = await currentProblem(page);
    seen.push(text);
    await answer(page, solve(text));
  }
  throw new Error('Level did not end');
}
