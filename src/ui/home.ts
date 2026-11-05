import { heroLook } from '../core/profile';
import { ALL_LANGS, type Lang } from '../core/types';
import { sceneSvg } from '../homeScene';
import type { App } from './app';
import { chip, escapeHtml, ICONS } from './dom';

/** The player's home: the valley with their hero, a greeting and one Start button. */
export function renderHome(app: App): void {
  const p = app.active;
  if (!p) return app.route();
  app.mount(
    `
    <section class="home">
      <div class="topbar">
        <button type="button" class="btn-small" data-action="switch">${ICONS.people}<span>${app.t('home.switch')}</span></button>
        <fieldset class="lang-switch" aria-label="${app.t('settings.language')}">
          ${ALL_LANGS.map((l) => chip('lang', l, p.lang === l, app.t(`lang.${l}`), 'radio')).join('')}
        </fieldset>
      </div>
      <div class="home-scene">
        ${sceneSvg({ look: heroLook(p.look) })}
        <h1>${app.t('app.title')}</h1>
      </div>
      <p class="greeting">${escapeHtml(app.t('home.greeting'))}</p>
      <p class="subtitle">${app.t('app.subtitle')}</p>
      <button type="button" class="btn-primary btn-big btn-start" data-action="start">${app.t('home.play')}</button>
      <div class="home-links">
        <button type="button" class="btn-secondary" data-action="story">${app.t('home.story')}</button>
        <button type="button" class="btn-link" data-action="parents">${ICONS.lock}<span>${app.t('picker.parents')}</span></button>
      </div>
    </section>`,
    p.lang,
  );
  const root = app.root;
  root.querySelector('[data-action="start"]')!.addEventListener('click', () => void app.startBattle());
  root.querySelector('[data-action="story"]')!.addEventListener('click', () => app.showPrologue());
  root.querySelector('[data-action="switch"]')!.addEventListener('click', () => void app.switchPlayer());
  root.querySelector('[data-action="parents"]')!.addEventListener('click', () => app.openParents(() => renderHome(app)));
  root.querySelector('.lang-switch')!.addEventListener('change', async (e) => {
    await app.saveProfile({ ...p, lang: (e.target as HTMLInputElement).value as Lang });
    renderHome(app);
  });
}
