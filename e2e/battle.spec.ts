import { expect, test } from '@playwright/test';
import { answer, currentProblem, fullHearts, openApp, playToEnd, solve, startPractice, waitForNext } from './helpers';

test.describe('home screen', () => {
  test('switches language', async ({ page }) => {
    await openApp(page);
    await expect(page.locator('h1')).toHaveText('Varuh števil');
    await expect(page).toHaveTitle('Varuh števil');
    await page.locator('input[name=lang][value=en]').check({ force: true });
    await expect(page.locator('h1')).toHaveText('Keeper of Numbers');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('form button[type=submit]')).toHaveText('Start');
  });

  test('needs at least one operation', async ({ page }) => {
    await openApp(page);
    await page.locator('details.settings summary').click();
    for (const op of ['add', 'sub', 'mul', 'div']) await page.locator(`input[name=ops][value=${op}]`).uncheck({ force: true });
    await page.locator('form button[type=submit]').click();
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.battle')).toHaveCount(0);
  });
});

for (const lang of ['sl', 'en'] as const) {
  const t =
    lang === 'sl'
      ? { mul: '·', div: ':', won: /Zmagala si!/, mistake: '1 napaka', stars: /zvezdic/, wrong: 'Pravilni odgovor je', home: 'Varuh števil' }
      : { mul: '×', div: '÷', won: /You won!/, mistake: '1 mistake', stars: /stars?/, wrong: 'The correct answer is', home: 'Keeper of Numbers' };

  test(`${lang}: plays a full level with one mistake, and the wrong fact comes back`, async ({ page }) => {
    await startPractice(page, { lang, ops: ['mul', 'div'], range: 100, speed: 'relaxed', missing: true });

    const first = await currentProblem(page);
    expect(first.includes(t.mul) || first.includes(t.div)).toBe(true);
    await expect(page.locator('.progress')).toContainText(lang === 'sl' ? 'Pošast 1 od 10' : 'Monster 1 of 10');

    // A wrong answer shows the correct answer and keeps all hearts in Relaxed mode.
    const expected = solve(first);
    await answer(page, expected === 1 ? 2 : 1);
    expect(await waitForNext(page)).toBe('feedback');
    await expect(page.locator('.fb-main')).toContainText(`${t.wrong} ${expected}.`);
    await expect(page.locator('.fb-answer')).toContainText(String(expected));
    expect(await fullHearts(page)).toBe(3);
    await page.locator('.feedback [data-action=continue]').click();

    const seen = await playToEnd(page);
    for (const p of seen) expect(p.includes(t.mul) || p.includes(t.div)).toBe(true);
    // The wrong fact returns 3–5 problems later.
    const back = seen.indexOf(first);
    expect(back).toBeGreaterThanOrEqual(2);
    expect(back).toBeLessThanOrEqual(4);
    expect(seen).toHaveLength(10);

    await expect(page.locator('.result h2')).toHaveText(t.won);
    await expect(page.locator('.result')).toContainText(t.mistake);
    await expect(page.locator('.result')).toContainText(t.stars);
    await expect(page.locator('.result .star.on')).toHaveCount(3);

    await page.locator('[data-action=home]').click();
    await expect(page.locator('h1')).toHaveText(t.home);
  });
}

test('relaxed: three wrong answers on one monster cost a heart', async ({ page }) => {
  await startPractice(page, { lang: 'en', ops: ['add'], range: 10, speed: 'relaxed', missing: false });
  for (let i = 0; i < 3; i++) {
    const p = await currentProblem(page);
    await answer(page, solve(p) === 0 ? 1 : 0);
    expect(await waitForNext(page)).toBe('feedback');
    expect(await fullHearts(page)).toBe(i < 2 ? 3 : 2);
    await page.locator('.feedback [data-action=continue]').click();
    await waitForNext(page);
  }
});

test('losing all hearts ends the level with a retry', async ({ page }) => {
  await startPractice(page, { lang: 'sl', ops: ['sub'], range: 20, speed: 'relaxed', missing: false });
  for (let i = 0; i < 20; i++) {
    const screen = await waitForNext(page);
    if (screen === 'result') break;
    if (screen === 'feedback') {
      await page.locator('.feedback [data-action=continue]').click();
      continue;
    }
    const p = await currentProblem(page);
    await answer(page, solve(p) + 1);
  }
  await expect(page.locator('.result.lost h2')).toContainText('Poskusi znova');
  await page.locator('[data-action=again]').click();
  await expect(page.locator('.problem')).toContainText('?');
  expect(await fullHearts(page)).toBe(3);
});

test('normal speed: a monster that reaches the hero costs a heart and shows the answer', async ({ page }) => {
  test.slow();
  await startPractice(page, { lang: 'en', ops: ['add'], range: 10, speed: 'normal', missing: false });
  const p = await currentProblem(page);
  await expect(page.locator('.feedback')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.fb-main')).toContainText(`The monster reached you. The correct answer is ${solve(p)}.`);
  expect(await fullHearts(page)).toBe(2);
});

test('normal speed: after a mistake the next problem gets the full time again', async ({ page }) => {
  test.slow();
  await startPractice(page, { lang: 'en', ops: ['add'], range: 10, speed: 'normal', missing: false });
  // Let the monster get halfway (12 s target time), then answer wrong.
  await page.waitForTimeout(6000);
  const p = await currentProblem(page);
  await answer(page, solve(p) === 0 ? 1 : 0);
  expect(await waitForNext(page)).toBe('feedback');
  await page.locator('.feedback [data-action=continue]').click();
  expect(await waitForNext(page)).toBe('problem');
  // Before the fix the monster reached the hero about 3 s later.
  await page.waitForTimeout(9000);
  await expect(page.locator('.feedback')).toBeHidden();
  expect(await fullHearts(page)).toBe(3);
});

test('keyboard input works', async ({ page }) => {
  await startPractice(page, { lang: 'en', ops: ['add'], range: 10, speed: 'relaxed', missing: false });
  const p = await currentProblem(page);
  await page.keyboard.type(String(solve(p)));
  await expect(page.locator('.problem')).not.toContainText('?');
  await page.keyboard.press('Enter');
  expect(await waitForNext(page)).toBe('problem');
  await expect(page.locator('.progress')).toContainText('Monster 2 of 10');
});
