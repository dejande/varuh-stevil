import type { BattleOutcome } from '../game/battle';
import type { App } from './app';

const STAR = '<path d="m12 2 3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/>';

export function renderResult(app: App, outcome: BattleOutcome): void {
  const stars = [1, 2, 3].map((i) => `<svg class="star ${i <= outcome.stars ? 'on' : 'off'}" viewBox="0 0 24 24" aria-hidden="true">${STAR}</svg>`).join('');
  app.mount(
    `
    <section class="result ${outcome.won ? 'won' : 'lost'}">
      <h2>${outcome.won ? app.t('result.won') : app.t('result.lost')}</h2>
      ${outcome.won ? `<p class="stars" aria-label="${app.t('result.stars', { count: outcome.stars })}">${stars}</p><p>${app.t('result.stars', { count: outcome.stars })}</p>` : ''}
      <p>${app.t('result.mistakes', { count: outcome.mistakes })}</p>
      <div class="actions">
        <button class="btn-primary btn-big" data-action="again">${app.t('result.again')}</button>
        <button class="btn-secondary" data-action="home">${app.t('result.home')}</button>
      </div>
    </section>`,
    app.lang,
  );
  app.root.querySelector('[data-action="again"]')!.addEventListener('click', () => void app.startBattle());
  app.root.querySelector('[data-action="home"]')!.addEventListener('click', () => app.goHome());
  app.root.querySelector<HTMLButtonElement>('[data-action="again"]')!.focus();
}
