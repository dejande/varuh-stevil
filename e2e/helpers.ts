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

/** Opens the app. By default the prologue counts as seen, so the home screen comes up directly. */
export async function openApp(page: Page, { prologueSeen = true } = {}): Promise<void> {
  if (prologueSeen) await page.addInitScript(() => localStorage.setItem('varuh-stevil.prologueSeen', '1'));
  await page.goto('./');
}

export async function startPractice(page: Page, s: Setup): Promise<void> {
  await openApp(page);
  await page.locator(`input[name=lang][value=${s.lang}]`).check({ force: true });
  await page.locator('details.settings summary').click();
  for (const op of ['add', 'sub', 'mul', 'div'] as const) {
    const box = page.locator(`input[name=ops][value=${op}]`);
    if (s.ops.includes(op)) await box.check({ force: true });
    else await box.uncheck({ force: true });
  }
  await page.locator(`input[name=range][value="${s.range}"]`).check({ force: true });
  await page.locator(`input[name=speed][value=${s.speed}]`).check({ force: true });
  const missing = page.locator('input[name=missing]');
  if (s.missing) await missing.check({ force: true });
  else await missing.uncheck({ force: true });
  await page.locator('form button[type=submit]').click();
  await expect(page.locator('.problem')).toContainText('?');
}

export async function currentProblem(page: Page): Promise<string> {
  return (await page.locator('.problem').textContent()) ?? '';
}

/** Types a number on the on-screen keypad and confirms it. */
export async function answer(page: Page, value: number): Promise<void> {
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
