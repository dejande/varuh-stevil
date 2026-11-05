import { opSymbol } from '../core/format';
import { GATE_HOLD_MS, makeGateQuestion } from '../core/gate';
import {
  HERO_LOOKS,
  MAX_HERO_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PROFILES,
  createProfile,
  defaultProfileInput,
  heroLook,
  normalizeInput,
  resetProgress,
  type ProfileInput,
} from '../core/profile';
import { ALL_INPUT_MODES, ALL_LANGS, ALL_OPS, ALL_RANGES, ALL_SPEEDS, type Gender, type InputMode, type Lang, type Op, type Profile, type Range, type Speed } from '../core/types';
import { avatarSvg } from '../homeScene';
import type { App } from './app';
import { chip, escapeHtml, ICONS } from './dom';

function uiLangSwitch(app: App): string {
  return `<fieldset class="lang-switch" aria-label="${app.tUi('settings.language')}">
    ${ALL_LANGS.map((l) => chip('uiLang', l, app.meta.uiLang === l, app.tUi(`lang.${l}`), 'radio')).join('')}
  </fieldset>`;
}

function bindUiLangSwitch(app: App, rerender: () => void): void {
  app.root.querySelector('.lang-switch')?.addEventListener('change', async (e) => {
    e.stopPropagation();
    await app.saveMeta({ ...app.meta, uiLang: (e.target as HTMLInputElement).value as Lang });
    rerender();
  });
}

/** Parent gate (spec §6): hold for 3 seconds, then solve a two-digit multiplication. */
export function renderGate(app: App, onPass: () => void, onCancel: () => void): void {
  const lang = app.meta.uiLang;
  app.mount(
    `
    <section class="gate">
      <h1>${app.tUi('gate.title')}</h1>
      <div class="gate-hold">
        <p>${app.tUi('gate.hold')}</p>
        <button type="button" class="hold-btn" data-action="hold">
          <span class="hold-fill" aria-hidden="true"></span>
          <span class="hold-label">${ICONS.lock}${app.tUi('gate.holdButton')}</span>
        </button>
      </div>
      <form class="gate-question" hidden>
        <label for="gate-answer" class="gate-label"></label>
        <input id="gate-answer" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="4">
        <p class="error" hidden>${app.tUi('gate.wrong')}</p>
        <button type="submit" class="btn-primary">${app.tUi('gate.check')}</button>
      </form>
      <button type="button" class="btn-small" data-action="cancel">${app.tUi('gate.cancel')}</button>
    </section>`,
    lang,
  );
  const root = app.root;
  const hold = root.querySelector<HTMLButtonElement>('[data-action="hold"]')!;
  const form = root.querySelector<HTMLFormElement>('.gate-question')!;
  const label = root.querySelector<HTMLElement>('.gate-label')!;
  const input = root.querySelector<HTMLInputElement>('#gate-answer')!;
  const error = root.querySelector<HTMLElement>('.error')!;
  let timer: number | undefined;
  let question = makeGateQuestion(Math.random);

  const ask = () => {
    question = makeGateQuestion(Math.random);
    label.textContent = app.tUi('gate.question', { a: question.a, b: question.b });
    input.value = '';
  };
  const start = () => {
    if (timer !== undefined) return;
    hold.classList.add('holding');
    timer = window.setTimeout(() => {
      timer = undefined;
      root.querySelector<HTMLElement>('.gate-hold')!.hidden = true;
      form.hidden = false;
      ask();
      input.focus();
    }, GATE_HOLD_MS);
  };
  const stop = () => {
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
    hold.classList.remove('holding');
  };
  hold.addEventListener('pointerdown', (e) => {
    hold.setPointerCapture?.(e.pointerId);
    start();
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) hold.addEventListener(ev, stop);
  hold.addEventListener('contextmenu', (e) => e.preventDefault());
  hold.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault();
      start();
    }
  });
  hold.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'Enter') stop();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (Number(input.value.trim()) === question.answer && input.value.trim() !== '') return onPass();
    error.hidden = false;
    ask();
    input.focus();
  });
  root.querySelector('[data-action="cancel"]')!.addEventListener('click', onCancel);
  app.onLeave(stop);
}

/** The parents' corner: players with edit, reset progress and delete, and adding a new one. */
export function renderParentArea(app: App, back: () => void): void {
  const full = app.profiles.length >= MAX_PROFILES;
  app.mount(
    `
    <section class="parents">
      <div class="topbar"><span></span>${uiLangSwitch(app)}</div>
      <h1>${app.tUi('parent.title')}</h1>
      <h2>${app.tUi('parent.players')}</h2>
      <ul class="player-list">
        ${app.profiles
          .map(
            (p) => `
          <li data-id="${escapeHtml(p.id)}">
            <span class="avatar small">${avatarSvg(heroLook(p.look))}</span>
            <span class="player-info">
              <span class="player-name">${escapeHtml(p.name)}</span>
              <span class="player-meta">${escapeHtml(summary(app, p))}</span>
            </span>
            <span class="player-actions">
              <button type="button" class="btn-small" data-action="edit">${app.tUi('parent.edit')}</button>
              <button type="button" class="btn-small" data-action="reset">${app.tUi('parent.reset')}</button>
              <button type="button" class="btn-small danger" data-action="delete">${app.tUi('parent.delete')}</button>
            </span>
          </li>`,
          )
          .join('')}
      </ul>
      <button type="button" class="btn-secondary btn-add" data-action="add" ${full ? 'disabled' : ''}>${ICONS.plus}<span>${app.tUi('parent.add')}</span></button>
      ${full ? `<p class="note">${app.tUi('parent.max', { count: MAX_PROFILES })}</p>` : ''}
      ${app.persistent ? '' : `<p class="note warn">${app.tUi('parent.noStorage')}</p>`}
      <button type="button" class="btn-primary btn-big" data-action="done">${app.tUi('parent.done')}</button>
    </section>`,
    app.meta.uiLang,
  );
  const root = app.root;
  const rerender = () => renderParentArea(app, back);
  bindUiLangSwitch(app, rerender);
  root.querySelector('[data-action="done"]')!.addEventListener('click', () => (app.profiles.length === 0 ? app.route() : back()));
  root.querySelector('[data-action="add"]')!.addEventListener('click', () => renderEditor(app, null, { back: rerender }));
  root.querySelectorAll<HTMLLIElement>('.player-list li').forEach((li) => {
    const profile = () => app.profiles.find((p) => p.id === li.dataset.id);
    li.querySelector('[data-action="edit"]')!.addEventListener('click', () => {
      const p = profile();
      if (p) renderEditor(app, p, { back: rerender });
    });
    li.querySelector('[data-action="reset"]')!.addEventListener('click', async () => {
      const p = profile();
      if (p && window.confirm(app.tUi('parent.confirmReset', { name: p.name }))) {
        await app.saveProfile(resetProgress(p));
        rerender();
      }
    });
    li.querySelector('[data-action="delete"]')!.addEventListener('click', async () => {
      const p = profile();
      if (p && window.confirm(app.tUi('parent.confirmDelete', { name: p.name }))) {
        await app.deleteProfile(p.id);
        rerender();
      }
    });
  });
}

function summary(app: App, p: Profile): string {
  const ops = p.settings.ops.map((op) => opSymbol(op, app.meta.uiLang)).join(' ');
  return `${ops} · ${app.tUi('settings.rangeValue', { max: p.settings.range })} · ${app.tUi(`speed.${p.speed}`)}`;
}

interface EditorOptions {
  /** First start on this device: no Cancel, and the new player starts playing right away. */
  firstRun?: boolean;
  back?: () => void;
}

/** Create or edit a player: names, hero, language, answering mode, speed and practice settings. */
export function renderEditor(app: App, existing: Profile | null, options: EditorOptions = {}): void {
  const v: ProfileInput = existing ?? defaultProfileInput(app.meta.uiLang);
  const s = v.settings;
  const t = (key: string, values = {}) => app.tUi(key, values);
  const title = options.firstRun ? t('welcome.title') : existing ? t('editor.titleEdit') : t('editor.titleNew');

  app.mount(
    `
    <section class="editor">
      <div class="topbar"><span></span>${uiLangSwitch(app)}</div>
      <h1>${title}</h1>
      ${options.firstRun ? `<p class="subtitle">${t('welcome.text')}</p>` : ''}
      <form class="settings-form" novalidate>
        <label class="field">
          <span class="field-label">${t('editor.name')}</span>
          <input name="name" type="text" maxlength="${MAX_NAME_LENGTH}" autocomplete="off" value="${escapeHtml(v.name)}">
        </label>
        <label class="field">
          <span class="field-label">${t('editor.heroName')}</span>
          <input name="heroName" type="text" maxlength="${MAX_HERO_NAME_LENGTH}" autocomplete="off" value="${escapeHtml(existing ? v.heroName : '')}">
          <span class="field-hint">${t('editor.heroNameHint')}</span>
        </label>
        <fieldset><legend>${t('editor.gender')}</legend>
          ${(['girl', 'boy'] as Gender[]).map((g) => chip('gender', g, v.gender === g, t(`gender.${g}`), 'radio')).join('')}
        </fieldset>
        <fieldset class="looks"><legend>${t('editor.look')}</legend>
          ${HERO_LOOKS.map(
            (l) => `<label class="chip swatch" title="${t(`look.${l.id}`)}">
              <input type="radio" name="look" value="${l.id}" ${v.look === l.id ? 'checked' : ''} aria-label="${t(`look.${l.id}`)}">
              <span><i style="background:${l.cape}"></i><i style="background:${l.hat}"></i></span>
            </label>`,
          ).join('')}
        </fieldset>
        <fieldset><legend>${t('settings.language')}</legend>
          ${ALL_LANGS.map((l) => chip('lang', l, v.lang === l, t(`lang.${l}`), 'radio')).join('')}
        </fieldset>
        <fieldset><legend>${t('editor.input')}</legend>
          ${ALL_INPUT_MODES.map((m) => chip('inputMode', m, v.inputMode === m, t(`input.${m}`), 'radio')).join('')}
        </fieldset>
        <fieldset><legend>${t('settings.ops')}</legend>
          ${ALL_OPS.map((op) => chip('ops', op, s.ops.includes(op), t(`op.${op}`), 'checkbox')).join('')}
        </fieldset>
        <fieldset><legend>${t('settings.range')}</legend>
          ${ALL_RANGES.map((r) => chip('range', String(r), s.range === r, t('settings.rangeValue', { max: r }), 'radio')).join('')}
        </fieldset>
        <fieldset><legend>${t('settings.speed')}</legend>
          ${ALL_SPEEDS.map((sp) => chip('speed', sp, v.speed === sp, t(`speed.${sp}`), 'radio')).join('')}
        </fieldset>
        <fieldset><legend>${t('settings.tasks')}</legend>
          ${chip('missing', 'on', s.missingNumber, t('settings.missing'), 'checkbox')}
        </fieldset>
        <p class="error" data-error="nameRequired" hidden>${t('editor.nameRequired')}</p>
        <p class="error" data-error="needOp" hidden>${t('settings.needOp')}</p>
        <div class="form-actions">
          ${options.firstRun ? '' : `<button type="button" class="btn-secondary" data-action="cancel">${t('editor.cancel')}</button>`}
          <button type="submit" class="btn-primary btn-big">${t('editor.save')}</button>
        </div>
      </form>
    </section>`,
    app.meta.uiLang,
  );

  const root = app.root;
  const form = root.querySelector<HTMLFormElement>('form')!;
  const read = (): ProfileInput => {
    const d = new FormData(form);
    return {
      name: String(d.get('name') ?? ''),
      heroName: String(d.get('heroName') ?? ''),
      gender: d.get('gender') as Gender,
      look: String(d.get('look')),
      lang: d.get('lang') as Lang,
      inputMode: d.get('inputMode') as InputMode,
      speed: d.get('speed') as Speed,
      settings: { ops: d.getAll('ops') as Op[], range: Number(d.get('range')) as Range, missingNumber: d.get('missing') === 'on' },
    };
  };
  // Keep what was typed when the screen language changes.
  bindUiLangSwitch(app, () => {
    const draft = read();
    renderEditor(app, existing ? { ...existing, ...draft } : null, options);
    if (!existing) fillDraft(app.root, draft);
  });
  root.querySelector('[data-action="cancel"]')?.addEventListener('click', () => options.back?.());
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { value, errors } = normalizeInput(read());
    root.querySelectorAll<HTMLElement>('[data-error]').forEach((el) => (el.hidden = !errors.includes(el.dataset.error as never)));
    if (errors.length > 0) {
      if (errors.includes('nameRequired')) root.querySelector<HTMLInputElement>('input[name="name"]')!.focus();
      return;
    }
    if (existing) {
      await app.saveProfile({ ...existing, ...value });
      return options.back ? options.back() : app.route();
    }
    const profile = createProfile(value);
    await app.saveProfile(profile);
    if (options.firstRun) return app.selectProfile(profile);
    return options.back ? options.back() : app.route();
  });
  root.querySelector<HTMLInputElement>('input[name="name"]')!.focus();
}

/** Restores a new player's unsaved form after the screen language changed. */
function fillDraft(root: HTMLElement, draft: ProfileInput): void {
  const form = root.querySelector('form')!;
  (form.elements.namedItem('name') as HTMLInputElement).value = draft.name;
  (form.elements.namedItem('heroName') as HTMLInputElement).value = draft.heroName;
  const check = (name: string, values: string[]) =>
    form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`).forEach((i) => (i.checked = values.includes(i.value)));
  check('gender', [draft.gender]);
  check('look', [draft.look]);
  check('lang', [draft.lang]);
  check('inputMode', [draft.inputMode]);
  check('speed', [draft.speed]);
  check('ops', draft.settings.ops);
  check('range', [String(draft.settings.range)]);
  check('missing', draft.settings.missingNumber ? ['on'] : []);
}
