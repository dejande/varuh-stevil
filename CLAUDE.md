# Varuh števil: working notes for Claude

Math practice battle game for Dejan's three kids (ages 6–11). Original game in the MathHero genre: own name, story and art, never a copy of the reference app.

## Public repo: privacy

The repo and the site are public. Never write the children's real names, ages beyond "6–11", photos, or paths from Dejan's machine into any file, test, commit message or story text. Use neutral example names (Nika, Eva, Žan). The built-in milestone 1 profile is "Nika"; real names belong only in profiles stored on the device (milestone 2).

## Sources of truth

- **Spec:** `docs/spec.md`. Read the relevant section before changing behaviour. The original draft outside this repo is no longer maintained.
- **Changelog:** the `## Changelog` section in `README.md`. Every change adds a line there, newest first, in the same commit.
- **This file:** where we are and what's next. Update "Status" and "Next" when a milestone or task finishes.

## Status (2026-11-05)

Milestone 2 (players, parent gate, settings per player, 4-choice input, IndexedDB storage) is done and deployed. Milestone 1 (battle core) before it:
- Practice mode (since milestone 2 with the active player's settings)
- All four operations and ranges, missing-number problems, SL `·` `:` / EN `×` `÷`
- Monster approach with Relaxed/Normal/Fast, 3 hearts, stars, keypad plus keyboard
- Answer plus strategy hint after a mistake, retry 3–5 problems later
- `sl.json`/`en.json` with ICU plurals, build-time i18n check
- GitHub Pages workflow; repo on GitHub (dejande/varuh-stevil)

Design pass done the same day ("Alpine paper-cut", see README "Design"): Dejan found the first placeholder look ugly. Art is still drawn from shapes; real illustrations come in milestone 5. Keep the rules: honey only for the one main action per screen, selected options in ink, no text glyphs for icons.

The prologue (spec §8, approved text) is in: shown once per new player, replayable with the Story button. "Seen" lives in `profile.progress.prologueSeen`.

Milestone 2 structure: `src/ui/app.ts` is the shell (state, storage, navigation); each screen is a `render…(app)` function in `src/ui/`. `app.t()` translates for the active player (language, hero, gender); `app.tUi()` for device screens (picker, parents' corner) in `meta.uiLang`. Stored data always goes through `sanitizeProfile` on load, so new fields need a default there. Chapter intros/outros and the 25 level panels come in milestone 3; the level panels need Dejan's approval before they are frozen.

Monster approach rules live in `src/core/approach.ts`. After a mistake the same monster stays closer (that is the consequence), but the next problem gets the full target time for the remaining distance (bug Dejan reported 2026-11-05).

Battle header has a segmented level progress bar. Story levels don't exist yet, so there is no level/stage number; add "Poglavje 1 · Stopnja 3"-style numbering in milestone 3.

## Next

1. **GitHub:** repo `git@github.com:dejande/varuh-stevil.git`, site https://dejande.github.io/varuh-stevil/. Pushing needs SSH keys, which the Claude sandbox can't read: push from the Terminal panel. Push only when Dejan asks.
2. **Milestone 3 (built 2026-11-05, not pushed):** chapter map, 25 levels + 5 bosses, stars and unlocks, story panels, outros, epilogue.
   - The game already uses the **draft** level panels and boss outros (`src/story/story.*.json`, mirrored in `docs/story/level-panels-draft.md`). **Do not push milestone 3 until Dejan approves that text** (and answers the open points at the bottom of the draft). Then mark the draft approved; from then on the story files change only on his request.
   - Rules: `src/core/campaign.ts`; boss fights are `LevelSession` with `bossHp`; art per chapter in `src/game/art.ts`; screens in `src/ui/map.ts` and `src/ui/story.ts`.
   - Deliberate spec deviation: Practice and replaying levels are open from the start (the spec's epilogue note says they unlock at the end). Replays are needed anyway, because a boss needs 10 stars.
   - Visual direction decided 2026-11-05: **keep the current "Alpine paper-cut" look.** The alternatives (watercolour, folk-painted panels, clay) stay in `docs/design/directions.html` for reference; don't restyle unless Dejan asks again. Build the chapter map in the current look.
3. **Milestone 4:** adaptive layer (weak facts, speed ±20%), parent stats, badges, export/import.
4. **Milestone 5:** Android APK via Capacitor on GitHub Releases, art and sound pass.

## Tests: run before every commit

Dejan's rule (2026-11-05): don't break what already works. Run `npm run test:all` (unit + end-to-end) before every commit, and add a test with every new feature: rules in `tests/`, user-visible flows in `e2e/`.

- From a Claude sandbox, Chrome cannot start (`Operation not permitted`), so run the e2e suite in the Terminal panel (`run_in_terminal`), not Bash. Unit tests run fine in Bash.
- The e2e server runs on `127.0.0.1:4317` with `reuseExistingServer: false`, because a stale `vite preview` keeps serving an old asset list.
- E2E helpers (`e2e/helpers.ts`) create the first player through the editor (`createFirstPlayer`, `fillPlayer`), pass the parent gate (`passGate`) and solve problems from the screen text. Every test starts on an empty device. `currentProblem` waits for a problem on screen; read problems only through it. Keep class names `.problem`, `.feedback`, `.result`, `.keypad [data-key]`, `.hearts .heart.full`, `.progress` stable, or update the helpers in the same change.

## Commands

```bash
npm run dev     # http://localhost:5173
npm test           # unit tests
npm run test:e2e   # build + Playwright (run in the Terminal panel)
npm run test:all   # both
npm run build      # check:i18n + tsc + vite build
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

Commit only on request. Push only when Dejan asks (remote `origin` = github.com:dejande/varuh-stevil). Stage only files you changed.
