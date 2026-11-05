import { heroLook } from '../core/profile';
import { PROLOGUE_SCENES, sceneSvg } from '../homeScene';
import { keepShortWords, storyPanels } from '../story/story';
import type { App } from './app';

/** The prologue, panel by panel. Finishing or skipping marks it seen for this player. */
export function renderPrologue(app: App): void {
  const p = app.active;
  if (!p) return app.route();
  const panels = storyPanels(p.lang, 'prologue', p.heroName, p.gender);
  const look = heroLook(p.look);
  let index = 0;

  app.mount(
    `
    <section class="story" aria-roledescription="${app.t('home.story')}">
      <div class="story-scene"></div>
      <p class="story-text" aria-live="polite"></p>
      <div class="story-dots" aria-hidden="true">${panels.map(() => '<span></span>').join('')}</div>
      <div class="story-actions">
        <button type="button" class="btn-small" data-action="skip">${app.t('story.skip')}</button>
        <button type="button" class="btn-primary btn-big" data-action="next"></button>
      </div>
    </section>`,
    p.lang,
  );
  const root = app.root;
  const scene = root.querySelector<HTMLElement>('.story-scene')!;
  const text = root.querySelector<HTMLElement>('.story-text')!;
  const dots = [...root.querySelectorAll<HTMLElement>('.story-dots span')];
  const next = root.querySelector<HTMLButtonElement>('[data-action="next"]')!;

  const finish = () => void app.prologueDone();
  const show = () => {
    scene.innerHTML = sceneSvg({ look, ...PROLOGUE_SCENES[index] });
    text.textContent = keepShortWords(panels[index]);
    dots.forEach((d, i) => d.classList.toggle('on', i <= index));
    next.textContent = index === panels.length - 1 ? app.t('story.start') : app.t('story.next');
    next.focus();
  };
  const advance = () => {
    if (index < panels.length - 1) {
      index++;
      show();
    } else {
      finish();
    }
  };
  next.addEventListener('click', advance);
  root.querySelector('[data-action="skip"]')!.addEventListener('click', finish);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') advance();
    else if (e.key === 'Escape') finish();
  };
  window.addEventListener('keydown', onKey);
  app.onLeave(() => window.removeEventListener('keydown', onKey));
  show();
}
