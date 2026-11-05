import { registerSW } from 'virtual:pwa-register';
import { DEFAULT_PROFILE } from './core/profile';
import { ALL_OPS, ALL_RANGES, type Lang, type Op, type Profile, type Range, type Speed } from './core/types';
import { Battle, type BattleOutcome } from './game/battle';
import { HOME_SCENE_SVG, PROLOGUE_SCENES, sceneSvg } from './homeScene';
import { keepShortWords, storyPanels } from './story/story';
import { translate, type MessageKey, type Values } from './i18n/i18n';
import '@fontsource-variable/baloo-2';
import './style.css';

registerSW({ immediate: true });

const PROLOGUE_SEEN_KEY = 'varuh-stevil.prologueSeen';

const SPEEDS: Speed[] = ['relaxed', 'normal', 'fast'];
const LANGS: Lang[] = ['sl', 'en'];

const app = document.querySelector<HTMLElement>('#app')!;
const profile: Profile = structuredClone(DEFAULT_PROFILE);
let battle: Battle | null = null;
let settingsOpen = false;
let stopStoryKeys: (() => void) | null = null;

/** Per-device convenience flag; the profile store of milestone 2 replaces it. */
function prologueSeen(): boolean {
  try {
    return localStorage.getItem(PROLOGUE_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markPrologueSeen(): void {
  try {
    localStorage.setItem(PROLOGUE_SEEN_KEY, '1');
  } catch {
    // Private mode or blocked storage: the prologue simply shows again next time.
  }
}

function t(key: MessageKey, values: Values = {}): string {
  return translate(profile.lang, key, { gender: profile.gender, hero: profile.heroName, ...values });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function applyLang(): void {
  document.documentElement.lang = profile.lang;
  document.title = t('app.title');
}

function renderHome(): void {
  applyLang();
  const s = profile.settings;
  const chip = (name: string, value: string, checked: boolean, label: string, type: 'radio' | 'checkbox') =>
    `<label class="chip"><input type="${type}" name="${name}" value="${value}" ${checked ? 'checked' : ''}><span>${label}</span></label>`;

  app.innerHTML = `
    <form class="home">
      <fieldset class="lang-switch" aria-label="${t('settings.language')}">
        ${LANGS.map((l) => chip('lang', l, profile.lang === l, t(`lang.${l}` as MessageKey), 'radio')).join('')}
      </fieldset>
      <div class="home-scene">
        ${HOME_SCENE_SVG}
        <h1>${t('app.title')}</h1>
      </div>
      <p class="greeting">${escapeHtml(t('home.greeting'))}</p>
      <p class="subtitle">${t('app.subtitle')}</p>
      <button type="submit" class="btn-primary btn-big btn-start">${t('home.play')}</button>
      <button type="button" class="btn-secondary btn-story" data-action="story">${t('home.story')}</button>
      <p class="error" hidden>${t('settings.needOp')}</p>
      <details class="settings">
        <summary>${t('settings.title')}</summary>
        <fieldset><legend>${t('settings.ops')}</legend>
          ${ALL_OPS.map((op) => chip('ops', op, s.ops.includes(op), t(`op.${op}` as MessageKey), 'checkbox')).join('')}
        </fieldset>
        <fieldset><legend>${t('settings.range')}</legend>
          ${ALL_RANGES.map((r) => chip('range', String(r), s.range === r, t('settings.rangeValue', { max: r }), 'radio')).join('')}
        </fieldset>
        <fieldset><legend>${t('settings.speed')}</legend>
          ${SPEEDS.map((sp) => chip('speed', sp, profile.speed === sp, t(`speed.${sp}` as MessageKey), 'radio')).join('')}
        </fieldset>
        <fieldset><legend>${t('settings.tasks')}</legend>
          ${chip('missing', 'on', s.missingNumber, t('settings.missing'), 'checkbox')}
        </fieldset>
      </details>
    </form>`;

  const form = app.querySelector('form')!;
  const details = form.querySelector('details')!;
  details.open = settingsOpen;
  details.addEventListener('toggle', () => (settingsOpen = details.open));
  form.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.name === 'lang') {
      profile.lang = input.value as Lang;
      renderHome();
      return;
    }
    readSettings(form);
  });
  form.querySelector('[data-action="story"]')!.addEventListener('click', () => renderPrologue());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    readSettings(form);
    if (profile.settings.ops.length === 0) {
      (form.querySelector('.error') as HTMLElement).hidden = false;
      return;
    }
    void startBattle();
  });
}

function readSettings(form: HTMLFormElement): void {
  const data = new FormData(form);
  profile.settings = {
    ops: data.getAll('ops') as Op[],
    range: Number(data.get('range')) as Range,
    missingNumber: data.get('missing') === 'on',
  };
  profile.speed = data.get('speed') as Speed;
  (form.querySelector('.error') as HTMLElement).hidden = profile.settings.ops.length > 0;
}

function renderPrologue(): void {
  applyLang();
  const panels = storyPanels(profile.lang, 'prologue', profile.heroName, profile.gender);
  let index = 0;

  app.innerHTML = `
    <section class="story" aria-roledescription="${t('home.story')}">
      <div class="story-scene"></div>
      <p class="story-text" aria-live="polite"></p>
      <div class="story-dots" aria-hidden="true">${panels.map(() => '<span></span>').join('')}</div>
      <div class="story-actions">
        <button type="button" class="btn-small" data-action="skip">${t('story.skip')}</button>
        <button type="button" class="btn-primary btn-big" data-action="next"></button>
      </div>
    </section>`;
  const scene = app.querySelector<HTMLElement>('.story-scene')!;
  const text = app.querySelector<HTMLElement>('.story-text')!;
  const dots = [...app.querySelectorAll<HTMLElement>('.story-dots span')];
  const next = app.querySelector<HTMLButtonElement>('[data-action="next"]')!;

  const finish = () => {
    stopStoryKeys?.();
    markPrologueSeen();
    renderHome();
  };
  const show = () => {
    scene.innerHTML = sceneSvg(PROLOGUE_SCENES[index] ?? {});
    text.textContent = keepShortWords(panels[index]);
    dots.forEach((d, i) => d.classList.toggle('on', i <= index));
    next.textContent = index === panels.length - 1 ? t('story.start') : t('story.next');
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
  app.querySelector('[data-action="skip"]')!.addEventListener('click', finish);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') advance();
    else if (e.key === 'Escape') finish();
  };
  stopStoryKeys?.();
  window.addEventListener('keydown', onKey);
  stopStoryKeys = () => {
    window.removeEventListener('keydown', onKey);
    stopStoryKeys = null;
  };
  show();
}

async function startBattle(): Promise<void> {
  battle?.destroy();
  battle = new Battle(app, profile, showResult, goHome);
  await battle.start();
}

function goHome(): void {
  battle?.destroy();
  battle = null;
  renderHome();
}

function showResult(outcome: BattleOutcome): void {
  battle?.destroy();
  battle = null;
  const stars = [1, 2, 3]
    .map((i) => `<svg class="star ${i <= outcome.stars ? 'on' : 'off'}" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>`)
    .join('');
  app.innerHTML = `
    <section class="result ${outcome.won ? 'won' : 'lost'}">
      <h2>${outcome.won ? t('result.won') : t('result.lost')}</h2>
      ${outcome.won ? `<p class="stars" aria-label="${t('result.stars', { count: outcome.stars })}">${stars}</p><p>${t('result.stars', { count: outcome.stars })}</p>` : ''}
      <p>${t('result.mistakes', { count: outcome.mistakes })}</p>
      <div class="actions">
        <button class="btn-primary btn-big" data-action="again">${t('result.again')}</button>
        <button class="btn-secondary" data-action="home">${t('result.home')}</button>
      </div>
    </section>`;
  app.querySelector('[data-action="again"]')!.addEventListener('click', () => void startBattle());
  app.querySelector('[data-action="home"]')!.addEventListener('click', goHome);
  (app.querySelector('[data-action="again"]') as HTMLButtonElement).focus();
}

if (prologueSeen()) renderHome();
else renderPrologue();
