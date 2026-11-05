import type { BattleOutcome } from '../game/battle';
import type { App } from './app';

const STAR = '<path d="m12 2 3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/>';

export function renderResult(app: App, outcome: BattleOutcome): void {
  const stage = outcome.stage;
  const button = (action: string, label: string, primary = false) =>
    `<button class="${primary ? 'btn-primary btn-big' : 'btn-secondary'}" data-action="${action}">${label}</button>`;
  const actions = stage
    ? outcome.won
      ? button('next', app.t('result.next'), true) + button('again', app.t('result.again')) + button('map', app.t('result.map'))
      : button('again', app.t('result.again'), true) + button('map', app.t('result.map'))
    : button('again', app.t('result.again'), true) + button('home', app.t('result.home'));
  const stars = [1, 2, 3].map((i) => `<svg class="star ${i <= outcome.stars ? 'on' : 'off'}" viewBox="0 0 24 24" aria-hidden="true">${STAR}</svg>`).join('');
  app.mount(
    `
    <section class="result ${outcome.won ? 'won' : 'lost'}">
      <h2>${outcome.won ? app.t('result.won') : app.t('result.lost')}</h2>
      ${outcome.won ? `<p class="stars" aria-label="${app.t('result.stars', { count: outcome.stars })}">${stars}</p><p>${app.t('result.stars', { count: outcome.stars })}</p>` : ''}
      <p>${app.t('result.mistakes', { count: outcome.mistakes })}</p>
      <div class="actions">${actions}</div>
    </section>`,
    app.lang,
  );
  const on = (action: string, fn: () => void) => app.root.querySelector(`[data-action="${action}"]`)?.addEventListener('click', fn);
  on('next', () => app.continueStory(stage!));
  on('again', () => void app.startBattle(stage));
  on('map', () => app.openMap());
  on('home', () => app.goHome());
  app.root.querySelector<HTMLButtonElement>('.actions .btn-primary')!.focus();
}
