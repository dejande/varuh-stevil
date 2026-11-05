import { expect, test } from '@playwright/test';
import { chaptersDone, createFirstPlayer, playToEnd, seedStars } from './helpers';

const relaxed = { ops: ['add' as const], range: 10 as const, speed: 'relaxed' as const, missing: false };

test('a new player starts the story at level 1; finishing it opens level 2', async ({ page }) => {
  await createFirstPlayer(page, { name: 'Nika', ...relaxed });
  await page.locator('[data-action=map]').click();
  await expect(page.locator('.map h1')).toHaveText('Zemljevid');
  await expect(page.locator('.node:not([disabled])')).toHaveCount(1);
  await expect(page.locator('[data-chapter="2"] .chapter-note')).toHaveText('Odpre se, ko premagaš šefa prejšnjega kraja.');

  await page.locator('[data-stage=c1l1]').click();
  await expect(page.locator('.stage-intro h1')).toHaveText('Stopnja 1');
  await expect(page.locator('.stage-intro .story-text')).toContainText('Megla se vleče med hišami');
  await page.locator('[data-action=play]').click();
  await playToEnd(page);
  await expect(page.locator('.result h2')).toHaveText('Zmagala si!');

  await page.locator('[data-action=next]').click();
  await expect(page.locator('.stage-intro h1')).toHaveText('Stopnja 2');
  await expect(page.locator('.stage-intro .story-text')).toContainText('koliko jajc');
  await page.locator('[data-action=map]').click();
  await expect(page.locator('.node:not([disabled])')).toHaveCount(2);
  await expect(page.locator('[data-stage=c1l1] .mini-stars i.on')).toHaveCount(3);

  // Progress survives a reload.
  await page.reload();
  await page.locator('[data-action=map]').click();
  await expect(page.locator('.node:not([disabled])')).toHaveCount(2);
});

test('the boss needs 10 stars from its chapter', async ({ page }) => {
  await createFirstPlayer(page, { name: 'Nika', ...relaxed });
  await seedStars(page, { c1l1: 1, c1l2: 1, c1l3: 1, c1l4: 1, c1l5: 1 });
  await page.locator('[data-action=map]').click();
  await expect(page.locator('[data-stage=c1boss]')).toBeDisabled();
  await expect(page.locator('[data-chapter="1"] .chapter-note')).toHaveText('Za šefa zberi še 5 zvezdic.');

  await seedStars(page, { c1l1: 3, c1l2: 3, c1l3: 2, c1l4: 1, c1l5: 1 });
  await page.locator('[data-action=map]').click();
  await expect(page.locator('[data-stage=c1boss]')).toBeEnabled();
  await expect(page.locator('[data-chapter="1"] .chapter-note')).toHaveCount(0);
});

test('beating the Hayrack Giant tells what happened and opens the lake', async ({ page }) => {
  test.slow();
  await createFirstPlayer(page, { name: 'Nika', ...relaxed });
  await seedStars(page, { c1l1: 3, c1l2: 3, c1l3: 3, c1l4: 3, c1l5: 3 });
  await page.locator('[data-action=map]').click();
  await page.locator('[data-stage=c1boss]').click();
  await expect(page.locator('.stage-intro h1')).toHaveText('Velikan Kozolec');
  await page.locator('[data-action=play]').click();
  await expect(page.locator('.progress')).toHaveText('Velikan Kozolec 15/15');
  await expect(page.locator('.track.boss-hp')).toBeVisible();

  const seen = await playToEnd(page);
  // A boss takes 15 damage: 8 to 15 correct answers depending on speed.
  expect(seen.length).toBeGreaterThanOrEqual(8);
  expect(seen.length).toBeLessThanOrEqual(15);
  await expect(page.locator('.result h2')).toHaveText('Zmagala si!');

  await page.locator('[data-action=next]').click();
  await expect(page.locator('.story-text')).toContainText('»Spet vem, koliko snopov imam!«');
  await page.locator('[data-action=next]').click();
  await expect(page.locator('.stage-intro .stage-place')).toHaveText('2 · Jezero');
  await page.locator('[data-action=map]').click();
  await expect(page.locator('[data-stage=c2l1]')).toBeEnabled();
  await expect(page.locator('[data-stage=c1boss] .mini-stars i.on').first()).toBeVisible();
});

test('beating Pozabnik ends with the epilogue', async ({ page }) => {
  test.slow();
  await createFirstPlayer(page, { name: 'Eva', lang: 'en', ...relaxed });
  const stars = chaptersDone([1, 2, 3, 4]);
  for (let l = 1; l <= 5; l++) stars[`c5l${l}`] = 2;
  await seedStars(page, stars);
  await page.locator('[data-action=map]').click();
  await page.locator('[data-stage=c5boss]').click();
  await expect(page.locator('.stage-intro h1')).toHaveText('The Forgetter');
  await page.locator('[data-action=play]').click();
  await playToEnd(page);
  await page.locator('[data-action=next]').click();
  await expect(page.locator('.story-text')).toContainText('The fog lifts.');
  await page.locator('[data-action=next]').click();
  await expect(page.locator('.story-text')).toContainText('You count him in');
  await page.locator('[data-action=next]').click();
  await expect(page.locator('.story-text')).toContainText('The numbers are back in the valley.');
  await page.locator('[data-action=next]').click();
  await expect(page.locator('.story-text')).toContainText('A Keeper of Numbers never stops practising.');
  await page.locator('[data-action=next]').click();
  await expect(page.locator('.map h1')).toHaveText('Map');
  await expect(page.locator('.total-stars')).toContainText('stars');
});

test('Practice still works from the home screen', async ({ page }) => {
  await createFirstPlayer(page, { name: 'Nika', ...relaxed });
  await page.locator('[data-action=start]').click();
  await expect(page.locator('.progress')).toHaveText('Pošast 1 od 10');
  await playToEnd(page);
  await expect(page.locator('[data-action=home]')).toBeVisible();
  await expect(page.locator('[data-action=next]')).toHaveCount(0);
});
