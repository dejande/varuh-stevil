import { expect, test } from '@playwright/test';
import { answer, createFirstPlayer, currentProblem, fillPlayer, passGate, playToEnd, solve, waitForNext } from './helpers';

test('the parent gate needs a 3-second hold and the right answer', async ({ page }) => {
  await createFirstPlayer(page, { name: 'Nika' });
  await page.locator('[data-action=parents]').click();
  const hold = page.locator('[data-action=hold]');

  // Letting go early does not open it.
  await hold.hover();
  await page.mouse.down();
  await page.waitForTimeout(1000);
  await page.mouse.up();
  await page.waitForTimeout(2500);
  await expect(page.locator('.gate-question')).toBeHidden();

  await page.mouse.down();
  await page.waitForTimeout(3200);
  await page.mouse.up();
  await expect(page.locator('.gate-question')).toBeVisible();
  const label = (await page.locator('.gate-label').textContent()) ?? '';
  const [a, b] = (label.match(/\d+/g) ?? []).map(Number);
  expect(a).toBeGreaterThanOrEqual(10);
  expect(b).toBeGreaterThanOrEqual(10);
  await page.locator('#gate-answer').fill(String(a * b + 1));
  await page.locator('.gate-question button[type=submit]').click();
  await expect(page.locator('.gate .error')).toBeVisible();
  await expect(page.locator('.parents')).toHaveCount(0);

  await page.locator('[data-action=cancel]').click();
  await expect(page.locator('.greeting')).toBeVisible();
});

test('parents add, edit, switch and delete players; everything survives a reload', async ({ page }) => {
  await createFirstPlayer(page, { name: 'Nika', look: 'red' });
  await passGate(page);

  await page.locator('[data-action=add]').click();
  await fillPlayer(page, { name: 'Žan', gender: 'boy', lang: 'en', look: 'green', speed: 'relaxed' });
  await expect(page.locator('.player-list .player-name')).toHaveText(['Nika', 'Žan']);

  // Edit Nika: 0–100 and multiplication only.
  await page.locator('.player-list li').first().locator('[data-action=edit]').click();
  await fillPlayer(page, { name: 'Nika', ops: ['mul'], range: 100 });
  await expect(page.locator('.player-list li').first()).toContainText('· · 0–100');

  await page.locator('[data-action=done]').click();
  await expect(page.locator('.greeting')).toHaveText('Živijo, Nika!');
  await page.locator('[data-action=start]').click();
  await expect(page.locator('.problem')).toContainText('·');

  await page.reload();
  await expect(page.locator('.greeting')).toHaveText('Živijo, Nika!');
  await page.locator('[data-action=switch]').click();
  await expect(page.locator('.player-card')).toHaveText(['Nika', 'Žan']);
  await page.locator('.player-card', { hasText: 'Žan' }).click();
  // Žan has not seen the prologue yet, and it is in English.
  await expect(page.locator('.story-text')).toContainText('In the valley below Triglav');
  await page.locator('[data-action=skip]').click();
  await expect(page.locator('.greeting')).toHaveText('Hi, Žan!');

  await passGate(page);
  page.once('dialog', (d) => void d.accept());
  await page.locator('.player-list li', { hasText: 'Žan' }).locator('[data-action=delete]').click();
  await expect(page.locator('.player-list .player-name')).toHaveText(['Nika']);
  await page.reload();
  await expect(page.locator('.player-card')).toHaveText(['Nika']);
});

test('reset progress shows the prologue again but keeps the settings', async ({ page }) => {
  await createFirstPlayer(page, { name: 'Nika', speed: 'fast' });
  await passGate(page);
  page.once('dialog', (d) => void d.accept());
  await page.locator('[data-action=reset]').click();
  await expect(page.locator('.player-list li')).toContainText('Hitro');
  await page.locator('[data-action=done]').click();
  await page.reload();
  await expect(page.locator('.story')).toBeVisible();
});

test('at most 6 players', async ({ page }) => {
  test.slow();
  await createFirstPlayer(page, { name: 'Igralec 1' });
  await passGate(page);
  for (let i = 2; i <= 6; i++) {
    await page.locator('[data-action=add]').click();
    await fillPlayer(page, { name: `Igralec ${i}` });
  }
  await expect(page.locator('.player-list li')).toHaveCount(6);
  await expect(page.locator('[data-action=add]')).toBeDisabled();
  await expect(page.locator('.parents .note')).toHaveText('Največ 6 igralcev.');
});

test('a long hero name is cut to 12 characters', async ({ page }) => {
  await createFirstPlayer(page, { name: 'Nika', heroName: 'Zvezdica s planin' }, { keepPrologue: true });
  for (let i = 0; i < 3; i++) await page.locator('[data-action=next]').click();
  await expect(page.locator('.story-text')).toContainText('»Zvezdica s p, ti si');
});

test('4-choice mode: one mistake, then a full level', async ({ page }) => {
  await createFirstPlayer(page, { name: 'Eva', inputMode: 'choices', ops: ['add', 'sub'], range: 10, speed: 'relaxed' });
  await page.locator('[data-action=start]').click();
  await expect(page.locator('.choices [data-choice]')).toHaveCount(4);
  await expect(page.locator('.keypad')).toHaveCount(0);

  const p = await currentProblem(page);
  const right = solve(p);
  const options = (await page.locator('.choices [data-choice]').allTextContents()).map(Number);
  expect(options).toContain(right);
  expect(new Set(options).size).toBe(4);
  await page.locator('.choices [data-choice]').filter({ hasNotText: new RegExp(`^${right}$`) }).first().click();
  expect(await waitForNext(page)).toBe('feedback');
  await expect(page.locator('.fb-main')).toContainText(`Pravilni odgovor je ${right}.`);
  await page.locator('.feedback [data-action=continue]').click();

  await playToEnd(page);
  await expect(page.locator('.result h2')).toHaveText('Zmagala si!');
});

test('keypad answers still work for a 4-choice player switching back', async ({ page }) => {
  await createFirstPlayer(page, { name: 'Eva', inputMode: 'choices' });
  await passGate(page);
  await page.locator('[data-action=edit]').click();
  await fillPlayer(page, { name: 'Eva', inputMode: 'keypad', ops: ['add'], range: 10, speed: 'relaxed' });
  await page.locator('[data-action=done]').click();
  await page.locator('[data-action=start]').click();
  await expect(page.locator('.keypad')).toBeVisible();
  await answer(page, solve(await currentProblem(page)));
  expect(await waitForNext(page)).toBe('problem');
});
