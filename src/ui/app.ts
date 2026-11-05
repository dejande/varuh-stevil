import type { Lang, Profile } from '../core/types';
import { Battle, type BattleOutcome } from '../game/battle';
import { translate, type MessageKey, type Values } from '../i18n/i18n';
import { DEFAULT_META, openStore, type Meta, type ProfileStore } from '../storage/store';
import { renderHome } from './home';
import { renderEditor, renderGate, renderParentArea } from './parent';
import { renderPicker } from './picker';
import { renderResult } from './result';
import { renderPrologue } from './story';

/** App shell: state, storage and navigation between screens. Screens live in their own files. */
export class App {
  profiles: Profile[] = [];
  meta: Meta = { ...DEFAULT_META };
  active: Profile | null = null;
  /** False when the browser blocks storage (private windows): the game works but forgets on close. */
  persistent = true;
  private battle: Battle | null = null;
  private cleanups: (() => void)[] = [];

  private constructor(
    readonly root: HTMLElement,
    readonly store: ProfileStore,
  ) {}

  static async start(root: HTMLElement): Promise<App> {
    const { store, persistent } = await openStore();
    const app = new App(root, store);
    app.persistent = persistent;
    const { profiles, meta } = await store.load();
    app.profiles = profiles;
    app.meta = meta;
    app.active = profiles.find((p) => p.id === meta.activeProfileId) ?? null;
    app.route();
    return app;
  }

  /** Language of the active player, or of the device screens when nobody is playing. */
  get lang(): Lang {
    return this.active?.lang ?? this.meta.uiLang;
  }

  /** Translates for the player's screens: language, hero name and gender come from the active player. */
  t(key: MessageKey | string, values: Values = {}): string {
    return translate(this.lang, key, { gender: this.active?.gender ?? 'girl', hero: this.active?.heroName ?? '', ...values });
  }

  /** Translates for the device screens (player picker, parents' corner). */
  tUi(key: MessageKey | string, values: Values = {}): string {
    return translate(this.meta.uiLang, key, { gender: 'girl', hero: '', ...values });
  }

  /** Replaces the screen. Listeners registered with onLeave are removed first. */
  mount(html: string, lang: Lang, titleKey: MessageKey = 'app.title'): void {
    this.leave();
    document.documentElement.lang = lang;
    document.title = translate(lang, titleKey);
    this.root.innerHTML = html;
    window.scrollTo(0, 0);
  }

  onLeave(fn: () => void): void {
    this.cleanups.push(fn);
  }

  private leave(): void {
    this.battle?.destroy();
    this.battle = null;
    for (const fn of this.cleanups.splice(0)) fn();
  }

  /** First screen: set up the first player, continue with the last one, or ask who is playing. */
  route(): void {
    if (this.profiles.length === 0) renderEditor(this, null, { firstRun: true });
    else if (this.active) this.enterProfile(this.active);
    else renderPicker(this);
  }

  async selectProfile(profile: Profile): Promise<void> {
    this.active = profile;
    await this.saveMeta({ ...this.meta, activeProfileId: profile.id });
    this.enterProfile(profile);
  }

  private enterProfile(profile: Profile): void {
    if (profile.progress.prologueSeen) renderHome(this);
    else renderPrologue(this);
  }

  async switchPlayer(): Promise<void> {
    this.active = null;
    await this.saveMeta({ ...this.meta, activeProfileId: null });
    renderPicker(this);
  }

  async saveProfile(profile: Profile): Promise<void> {
    await this.store.saveProfile(profile);
    const i = this.profiles.findIndex((p) => p.id === profile.id);
    if (i >= 0) this.profiles[i] = profile;
    else this.profiles.push(profile);
    if (this.active?.id === profile.id) this.active = profile;
  }

  async deleteProfile(id: string): Promise<void> {
    await this.store.deleteProfile(id);
    this.profiles = this.profiles.filter((p) => p.id !== id);
    if (this.active?.id === id) this.active = null;
    if (this.meta.activeProfileId === id) await this.saveMeta({ ...this.meta, activeProfileId: null });
  }

  async saveMeta(meta: Meta): Promise<void> {
    this.meta = meta;
    await this.store.saveMeta(meta);
  }

  goHome(): void {
    if (this.active) renderHome(this);
    else this.route();
  }

  showPrologue(): void {
    renderPrologue(this);
  }

  async prologueDone(): Promise<void> {
    if (this.active && !this.active.progress.prologueSeen) {
      await this.saveProfile({ ...this.active, progress: { ...this.active.progress, prologueSeen: true } });
    }
    renderHome(this);
  }

  /** Parents' corner, behind the gate. `back` is where Cancel and Done return to. */
  openParents(back: () => void): void {
    renderGate(this, () => renderParentArea(this, back), back);
  }

  async startBattle(): Promise<void> {
    const profile = this.active;
    if (!profile) return this.route();
    this.leave();
    this.battle = new Battle(this.root, profile, (o) => this.showResult(o), () => this.goHome());
    document.documentElement.lang = profile.lang;
    await this.battle.start();
  }

  private showResult(outcome: BattleOutcome): void {
    renderResult(this, outcome);
  }
}
