import {
  BOSS_STARS_NEEDED,
  CHAPTER_COUNT,
  chapterStars,
  currentStage,
  isChapterOpen,
  isUnlocked,
  stageId,
  stagesOf,
  starsFor,
  totalStars,
  type Stage,
} from '../core/campaign';
import { keepShortWords, storyNames, storyPanels, type StoryKey } from '../story/story';
import type { App } from './app';
import { chapterBanner } from './chapterArt';
import { ICONS } from './dom';

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>';
const CROWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18 2 7l5.5 4L12 4l4.5 7L22 7l-1 11z" fill="currentColor"/></svg>';

function miniStars(n: number): string {
  return `<span class="mini-stars" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}">${STAR}</i>`).join('')}</span>`;
}

/** The chapter map: five places, each with five levels and a boss. */
export function renderMap(app: App): void {
  const p = app.active;
  if (!p) return app.route();
  const progress = p.progress;
  const names = storyNames(p.lang);
  const current = currentStage(progress);
  const isCurrent = (s: Stage) => stageId(s) === stageId(current);

  const chapters = Array.from({ length: CHAPTER_COUNT }, (_, i) => i + 1)
    .map((c) => {
      const open = isChapterOpen(progress, c);
      const got = chapterStars(progress, c);
      const bossOpen = isUnlocked(progress, { chapter: c, level: 'boss' });
      const nodes = stagesOf(c)
        .map((s) => {
          const unlocked = isUnlocked(progress, s);
          const stars = starsFor(progress, s);
          const label = s.level === 'boss' ? names.bosses[c - 1] : app.t('level.title', { n: s.level });
          return `<button type="button" class="node ${s.level === 'boss' ? 'boss' : ''} ${isCurrent(s) ? 'current' : ''}" data-stage="${stageId(s)}"
              ${unlocked ? '' : 'disabled'} aria-label="${label}${unlocked ? '' : ` (${app.t('map.locked')})`}">
              <span class="node-face">${unlocked ? (s.level === 'boss' ? CROWN : s.level) : ICONS.lock}</span>
              ${miniStars(stars)}
            </button>`;
        })
        .join('');
      const note = !open
        ? `<p class="chapter-note">${app.t('map.chapterLocked')}</p>`
        : !bossOpen && got < BOSS_STARS_NEEDED
          ? `<p class="chapter-note">${app.t('map.bossNeeds', { count: BOSS_STARS_NEEDED - got })}</p>`
          : '';
      return `
      <section class="chapter ${open ? '' : 'locked'}" data-chapter="${c}">
        <div class="chapter-banner">${chapterBanner(c)}</div>
        <div class="chapter-head">
          <h2>${c} · ${names.chapters[c - 1]}</h2>
          <span class="chapter-stars">${STAR}<span>${got}/15</span></span>
        </div>
        <div class="nodes">${nodes}</div>
        ${note}
      </section>`;
    })
    .join('');

  app.mount(
    `
    <section class="map">
      <div class="topbar">
        <button type="button" class="btn-small" data-action="home">${ICONS.home}<span>${app.t('battle.home')}</span></button>
        <span class="total-stars">${STAR}<span>${app.t('result.stars', { count: totalStars(progress) })}</span></span>
        <button type="button" class="btn-small" data-action="story">${app.t('map.prologue')}</button>
      </div>
      <h1>${app.t('map.title')}</h1>
      ${chapters}
    </section>`,
    p.lang,
  );
  const root = app.root;
  root.querySelector('[data-action="home"]')!.addEventListener('click', () => app.goHome());
  root.querySelector('[data-action="story"]')!.addEventListener('click', () => app.showPrologue(() => renderMap(app)));
  root.querySelectorAll<HTMLButtonElement>('.node:not([disabled])').forEach((btn) =>
    btn.addEventListener('click', () => {
      const [, c, rest] = btn.dataset.stage!.match(/^c(\d+)(.+)$/)!;
      const level = rest === 'boss' ? 'boss' : Number(rest.slice(1));
      renderStageIntro(app, { chapter: Number(c), level });
    }),
  );
  root.querySelector<HTMLElement>(`[data-chapter="${current.chapter}"]`)?.scrollIntoView({ block: 'center' });
}

/** Before a level: the place, the level's story panel, and Start. */
export function renderStageIntro(app: App, stage: Stage): void {
  const p = app.active;
  if (!p) return app.route();
  const names = storyNames(p.lang);
  const boss = stage.level === 'boss';
  const panel = boss ? app.t('boss.tip') : storyPanels(p.lang, `chapter${stage.chapter}` as StoryKey, p.heroName, p.gender)[(stage.level as number) - 1];
  const title = boss ? names.bosses[stage.chapter - 1] : app.t('level.title', { n: stage.level });

  app.mount(
    `
    <section class="stage-intro ${boss ? 'boss' : ''}">
      <div class="story-scene">${chapterBanner(stage.chapter)}</div>
      <p class="stage-place">${stage.chapter} · ${names.chapters[stage.chapter - 1]}</p>
      <h1>${title}</h1>
      <p class="story-text">${keepShortWords(panel)}</p>
      ${starsFor(p.progress, stage) ? `<p class="best">${miniStars(starsFor(p.progress, stage))}</p>` : ''}
      <button type="button" class="btn-primary btn-big" data-action="play">${app.t('home.play')}</button>
      <button type="button" class="btn-small" data-action="map">${app.t('result.map')}</button>
    </section>`,
    p.lang,
  );
  app.root.querySelector('[data-action="play"]')!.addEventListener('click', () => void app.startBattle(stage));
  app.root.querySelector('[data-action="map"]')!.addEventListener('click', () => renderMap(app));
  app.root.querySelector<HTMLButtonElement>('[data-action="play"]')!.focus();
}
