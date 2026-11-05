# Varuh števil: working notes for Claude

Math practice battle game for Dejan's three kids (ages 6–11). Original game in the MathHero genre: own name, story and art, never a copy of the reference app.

## Sources of truth

- **Spec:** `docs/spec.md`. Read the relevant section before changing behaviour. The original draft outside this repo is no longer maintained.
- **Changelog:** the `## Changelog` section in `README.md`. Every change adds a line there, newest first, in the same commit.
- **This file:** where we are and what's next. Update "Status" and "Next" when a milestone or task finishes.

## Status (2026-11-05)

Milestone 1 (battle core) is done and committed locally:
- Practice mode, one hard-coded profile (`src/core/profile.ts`), in-memory settings form on the home screen
- All four operations and ranges, missing-number problems, SL `·` `:` / EN `×` `÷`
- Monster approach with Relaxed/Normal/Fast, 3 hearts, stars, keypad plus keyboard
- Answer plus strategy hint after a mistake, retry 3–5 problems later
- `sl.json`/`en.json` with ICU plurals, build-time i18n check
- GitHub Pages workflow (no remote yet; Dejan has not approved creating one or pushing)

Placeholder art is simple Phaser shapes. Dejan finds the graphics and colours ugly (2026-11-05); a design rewrite is the next task.

## Next

1. **Visual design pass** on the placeholder look (colours, typography, battle scene shapes) before milestone 2.
2. **Create the GitHub repo and push**, only after Dejan says so. Then set Pages to "GitHub Actions".
3. **Milestone 2:** profiles (up to 6), parent gate, settings per child, the multiple-choice input mode (distractor rules in spec §3), IndexedDB storage.
4. **Milestone 3:** chapter map, 30 levels, bosses, frozen story text, stars and unlocks. Draft the per-level panel text (5 × 5, SL + EN) first; Dejan approves it before it is frozen.
5. **Milestone 4:** adaptive layer (weak facts, speed ±20%), parent stats, badges, export/import.
6. **Milestone 5:** Android APK via Capacitor on GitHub Releases, art and sound pass.

Open from spec §11, not yet done: the end-to-end test that plays one level in each language. Playwright was not added in milestone 1.

## Commands

```bash
npm run dev     # http://localhost:5173
npm test
npm run build   # check:i18n + tsc + vite build
```

`npm install` from a Claude sandbox needs `registry.npmjs.org` in `allowed_domains`.

## Architecture and conventions

- `src/core/` is pure TypeScript with no Phaser or DOM. All game rules live there and are unit tested. Keep it that way: new rules go to `core/` with a test.
- Phaser (`src/game/BattleScene.ts`) only renders the battle. `src/game/battle.ts` connects `LevelSession`, the scene and the DOM keypad/feedback.
- Menus, settings and results are plain DOM/CSS (`src/main.ts`, `src/style.css`), as the spec requires.
- Every user-facing string goes through `translate()` with keys in both `sl.json` and `en.json`. Slovene plurals need `one/two/few/other`; gendered Slovene forms use `{gender, select, girl {…} other {…}}`.
- Math notation comes from `src/core/format.ts` (`opSymbol`, `formatProblem`, `expr`); never hard-code `×` or `÷` in UI strings.
- The generator's round quotas (10% 0/1, 30% missing, 40% regrouping) are planned per round in `planRound`. Filler problems added by retries use `fillerPlan`, so the quotas still hold.
- Missing-number problems never use 0/1 operands, so the answer is always unique.
- Production `base` is `/varuh-stevil/` (`vite.config.ts`). Capacitor will need a relative base in milestone 5.
- No runtime network calls, no analytics, no external fonts or CDNs.

## Testing in the Claude browser pane

Phaser runs on `requestAnimationFrame`, which stops while the browser pane is hidden or the window is out of view, so the battle seems frozen. In dev builds the running game is exposed as `window.__game`. Step frames by hand:

```js
const pump = async (ms) => { let t = performance.now(); for (let i = 0; i < ms / 50; i++) { t += 50; window.__game.step(t, 50); await new Promise(r => setTimeout(r, 0)); } };
```

Keyboard input works through `window.dispatchEvent(new KeyboardEvent('keydown', { key: '7' }))`. A hot reload drops you back on the home screen.

## Git

Commit only on request. Never push or create the remote without Dejan's explicit OK. Stage only files you changed.
