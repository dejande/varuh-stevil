import { expect, test } from '@playwright/test';
import { createFirstPlayer } from './helpers';

test('a new player sees the prologue with their hero name, once', async ({ page }) => {
  await createFirstPlayer(page, { name: 'Nika' }, { keepPrologue: true });
  const text = page.locator('.story-text');
  await expect(text).toHaveText('V dolini pod Triglavom so ljudje nekoč znali šteti do neskončnosti.');
  await expect(page.locator('.story-dots span.on')).toHaveCount(1);

  for (let i = 0; i < 3; i++) await page.locator('[data-action=next]').click();
  await expect(text).toHaveText('Kozliček Rogec pride k tebi: »Nika, ti si zadnja Varuhinja števil. Pomagaj nam!«');
  await expect(page.locator('[data-action=next]')).toHaveText('Gremo!');
  await page.locator('[data-action=next]').click();
  await expect(page.locator('.greeting')).toHaveText('Živijo, Nika!');

  await page.reload();
  await expect(page.locator('.greeting')).toHaveText('Živijo, Nika!');
  await expect(page.locator('.story')).toHaveCount(0);
});

test('a boy hero in English, and the map replays the prologue', async ({ page }) => {
  await createFirstPlayer(page, { name: 'Žan', gender: 'boy', lang: 'en' });
  await page.locator('[data-action=map]').click();
  await page.locator('[data-action=story]').click();
  await expect(page.locator('.story-text')).toHaveText('In the valley below Triglav, people could once count to infinity.');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.story-text')).toContainText('the Forgetter');
  await page.locator('[data-action=skip]').click();
  await expect(page.locator('.map h1')).toHaveText('Map');
});

test('Slovene boy hero gets the masculine form', async ({ page }) => {
  await createFirstPlayer(page, { name: 'Žan', gender: 'boy' }, { keepPrologue: true });
  for (let i = 0; i < 3; i++) await page.locator('[data-action=next]').click();
  await expect(page.locator('.story-text')).toContainText('»Žan, ti si zadnji Varuh števil.');
});
