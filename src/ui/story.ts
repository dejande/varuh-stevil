import { heroLook } from '../core/profile';
import { PROLOGUE_SCENES, sceneSvg } from '../homeScene';
import { keepShortWords, storyPanels, type StoryKey } from '../story/story';
import type { App } from './app';
import { chapterBanner } from './chapterArt';

interface PanelOptions {
  /** One illustration per panel (the last one repeats when there are fewer). */
  scenes: string[];
  onDone: () => void;
  /** Label of the button on the last panel. */
  finishLabel?: string;
}

/** Story panels one at a time, with Skip. Used for the prologue, the boss outros and the epilogue. */
export function renderPanels(app: App, key: StoryKey, options: PanelOptions): void {
  const p = app.active;
  if (!p) return app.route();
  const panels = storyPanels(p.lang, key, p.heroName, p.gender);
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
  root.querySelector<HTMLElement>('.story-dots')!.hidden = panels.length < 2;

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    options.onDone();
  };
  const show = () => {
    scene.innerHTML = options.scenes[Math.min(index, options.scenes.length - 1)];
    text.textContent = keepShortWords(panels[index]);
    dots.forEach((d, i) => d.classList.toggle('on', i <= index));
    next.textContent = index === panels.length - 1 ? (options.finishLabel ?? app.t('story.start')) : app.t('story.next');
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

/** The prologue. Finishing or skipping marks it seen for this player. */
export function renderPrologue(app: App): void {
  const p = app.active;
  if (!p) return app.route();
  const look = heroLook(p.look);
  renderPanels(app, 'prologue', {
    scenes: PROLOGUE_SCENES.map((s) => sceneSvg({ look, ...s })),
    onDone: () => void app.prologueDone(),
  });
}

/** After a boss: the chapter's outro; after the last boss also the epilogue. */
export function renderOutro(app: App, chapter: number, onDone: () => void): void {
  const p = app.active;
  if (!p) return app.route();
  renderPanels(app, `outro${chapter}` as StoryKey, { scenes: [chapterBanner(chapter)], onDone, finishLabel: app.t('story.next') });
}

export function renderEpilogue(app: App, onDone: () => void): void {
  const p = app.active;
  if (!p) return app.route();
  const look = heroLook(p.look);
  renderPanels(app, 'epilogue', {
    scenes: [sceneSvg({ look, fog: 'none', numbers: true, imp: false }), sceneSvg({ look, fog: 'none', imp: false })],
    onDone,
    finishLabel: app.t('story.toMap'),
  });
}
