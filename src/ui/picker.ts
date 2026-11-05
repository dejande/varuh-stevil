import { heroLook } from '../core/profile';
import { ALL_LANGS, type Lang } from '../core/types';
import { avatarSvg } from '../homeScene';
import type { App } from './app';
import { chip, escapeHtml, ICONS } from './dom';

/** "Who's playing?": one big card per player. */
export function renderPicker(app: App): void {
  const lang = app.meta.uiLang;
  app.mount(
    `
    <section class="picker">
      <div class="topbar">
        <button type="button" class="btn-small" data-action="parents">${ICONS.lock}<span>${app.tUi('picker.parents')}</span></button>
        <fieldset class="lang-switch" aria-label="${app.tUi('settings.language')}">
          ${ALL_LANGS.map((l) => chip('uiLang', l, lang === l, app.tUi(`lang.${l}`), 'radio')).join('')}
        </fieldset>
      </div>
      <h1>${app.tUi('picker.title')}</h1>
      <div class="players">
        ${app.profiles
          .map(
            (p) => `
          <button type="button" class="player-card" data-id="${escapeHtml(p.id)}">
            <span class="avatar">${avatarSvg(heroLook(p.look))}</span>
            <span class="player-name">${escapeHtml(p.name)}</span>
          </button>`,
          )
          .join('')}
      </div>
    </section>`,
    lang,
  );
  const root = app.root;
  root.querySelectorAll<HTMLButtonElement>('.player-card').forEach((btn) =>
    btn.addEventListener('click', () => {
      const p = app.profiles.find((x) => x.id === btn.dataset.id);
      if (p) void app.selectProfile(p);
    }),
  );
  root.querySelector('[data-action="parents"]')!.addEventListener('click', () => app.openParents(() => renderPicker(app)));
  root.querySelector('.lang-switch')!.addEventListener('change', async (e) => {
    await app.saveMeta({ ...app.meta, uiLang: (e.target as HTMLInputElement).value as Lang });
    renderPicker(app);
  });
}
