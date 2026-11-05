import { expect, test } from '@playwright/test';
import { openApp } from './helpers';

test('the prologue opens on the first visit and is skipped afterwards', async ({ page }) => {
  await openApp(page, { prologueSeen: false });
  const text = page.locator('.story-text');
  await expect(text).toHaveText('V dolini pod Triglavom so ljudje nekoč znali šteti do neskončnosti.');
  await expect(page.locator('.story-dots span.on')).toHaveCount(1);

  for (let i = 0; i < 3; i++) await page.locator('[data-action=next]').click();
  await expect(text).toHaveText('Kozliček Rogec pride k tebi: »Nika, ti si zadnja Varuhinja števil. Pomagaj nam!«');
  await expect(page.locator('[data-action=next]')).toHaveText('Gremo!');
  await page.locator('[data-action=next]').click();
  await expect(page.locator('h1')).toHaveText('Varuh števil');

  await page.reload();
  await expect(page.locator('h1')).toHaveText('Varuh števil');
  await expect(page.locator('.story')).toHaveCount(0);
});

test('the Story button replays the prologue in English, and Skip returns home', async ({ page }) => {
  await openApp(page);
  await page.locator('input[name=lang][value=en]').check({ force: true });
  await page.locator('[data-action=story]').click();
  await expect(page.locator('.story-text')).toHaveText('In the valley below Triglav, people could once count to infinity.');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.story-text')).toContainText('the Forgetter');
  await page.locator('[data-action=skip]').click();
  await expect(page.locator('h1')).toHaveText('Keeper of Numbers');
});
