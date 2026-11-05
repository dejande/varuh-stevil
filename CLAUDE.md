# Varuh števil: working notes for Claude

Math practice battle game for Dejan's three kids (ages 6–11). Original game in the MathHero genre: own name, story and art, never a copy of the reference app.

## Public repo: privacy

The repo and the site are public. Never write the children's real names, ages beyond "6–11", photos, or paths from Dejan's machine into any file, test, commit message or story text. Use neutral example names (Nika, Eva, Žan). Real names belong only in player profiles stored on the device.

## Sources of truth

- **Spec:** `docs/spec.md`. Read the relevant section before changing behaviour. The original draft outside this repo is no longer maintained.
- **Changelog:** the `## Changelog` section in `README.md`. Every change adds a line there, newest first, in the same commit.
- **Story text:** `src/story/story.sl.json` and `story.en.json`, approved and frozen; readable copy of the level panels and boss outros in `docs/story/level-panels-draft.md`. Change only when Dejan asks.
- **Publishing texts:** `docs/publishing.md` (repo description, descriptions, release notes, install guide). Update when a milestone lands.
- **This file:** where we are and what's next. Update "Status" and "Next" when a milestone or task finishes.

## Status (2026-11-05, version 0.3.0)

Milestones 1–3 are done and live at https://dejande.github.io/varuh-stevil/ (repo `github.com/dejande/varuh-stevil`, public).

- **Milestone 1, battle core:** all four operations and ranges, missing-number problems in either position, SL `·` `:` / EN `×` `÷`; monster approach with Relaxed/Normal/Fast, 3 hearts, stars; keypad plus keyboard; answer plus strategy hint after a mistake, retry 3–5 problems later; `sl.json`/`en.json` with ICU plurals and a build-time check.
- **Milestone 2, players:** up to 6 players with their own hero name, girl/boy hero, colours, language, answering mode, speed and practice settings; first-run setup; "Kdo igra?" picker; parent gate (hold 3 s + two-digit multiplication); parents' corner (add, edit, reset progress, delete); 4-choice answering; everything in IndexedDB.
- **Milestone 3, story:** prologue once per player (replay from the map); map with 5 places × 5 levels + boss; best stars per level; boss needs 10 stars from its chapter; bosses with 15 lives (a quick answer hits twice); a panel before every level, an outro after every boss, the epilogue. Ribica floats beside the hero from chapter 4.
- **Look:** "Alpine paper-cut" (Baloo 2, beehive-panel palette), shapes only until the milestone 5 art pass. Dejan saw three alternatives (`docs/design/directions.html`: watercolour, folk-painted panels, clay) and chose to **keep the current look**. Rules: honey only for the one main action per screen, selected options in ink, no text glyphs for icons.
- **Battlefield layout:** the Phaser view is 800 × 450 (the 800 × 360 scene plus `SKY_EXTRA` sky above, camera scrolled up). On landscape screens ≥ 700 px wide the battle uses the full width, the problem and keypad sit in a narrow right column (on purpose: stacked, the keypad would not fit on a sideways tablet), and the picture is capped by the screen height. On portrait phones the keypad sits below.
- **Deliberate spec deviation:** Practice and replaying levels are open from the start (the spec's epilogue note says they unlock at the end). Replays are needed anyway, because a boss needs 10 stars.

## Next

1. **Milestone 4:** adaptive layer (weak facts, speed ±20%), parent stats, badges, export/import of players.
2. **Milestone 5:** Android APK via Capacitor on GitHub Releases, real art and sound. Capacitor needs a relative `base`.
3. **Small open items:** social preview image and README screenshots (`docs/publishing.md`, "Still to make").

## Code map

- `src/core/` is pure TypeScript with no Phaser or DOM. All game rules live there and are unit tested; new rules go here with a test.
  - `generator.ts` (problems and round quotas), `level.ts` (`LevelSession`: queue, retries, hearts, stars; boss mode with `bossHp`), `approach.ts` (monster movement, time per problem, boss knock-back), `campaign.ts` (stages, unlocks, stars), `choices.ts` (4 answer choices), `hints.ts`, `format.ts` (notation), `profile.ts` (player model, `sanitizeProfile`), `gate.ts`.
- `src/game/`: `art.ts` draws backgrounds, monsters and bosses per chapter; `BattleScene.ts` renders the battle; `battle.ts` connects `LevelSession`, the scene and the DOM keypad/choices/feedback.
- `src/ui/`: `app.ts` is the shell (state, storage, navigation); each screen is a `render…(app)` function (`picker`, `home`, `map`, `story`, `parent`, `result`). `app.t()` translates for the active player (language, hero, gender), `app.tUi()` for device screens in `meta.uiLang`.
- `src/storage/store.ts`: IndexedDB with a memory fallback. Stored data always goes through `sanitizeProfile` on load, so new fields need a default there.
- Every user-facing string goes through `translate()` with keys in both `sl.json` and `en.json`. Slovene plurals need `one/two/few/other`; gendered Slovene forms use `{gender, select, girl {…} other {…}}`. Story text may use `{hero}` only at the start of a sentence or quote (the build checks it).
- Math notation comes from `format.ts`; never hard-code `×` or `÷` in UI strings.
- Missing-number problems never use 0/1 operands, so the answer is always unique.
- Production and `vite preview` use `base` `/varuh-stevil/`; the dev server uses `/`.
- No runtime network calls, no analytics, no external fonts or CDNs.

## Tests: run before every commit

Dejan's rule: don't break what already works. Run `npm run test:all` (unit + end-to-end) before every commit, and add a test with every new feature: rules in `tests/`, user-visible flows in `e2e/`.

- From the Claude sandbox, Chrome cannot start (`Operation not permitted`), so the e2e suite runs in the Terminal panel (`run_in_terminal`), not Bash. Unit tests and the build run fine in Bash. If the Terminal panel is unavailable, say that the e2e tests did not run locally; CI runs them before every deploy and nothing publishes if one fails.
- The e2e server runs on `127.0.0.1:4317` with `reuseExistingServer: false`, because a stale `vite preview` keeps serving an old asset list.
- E2E helpers (`e2e/helpers.ts`): `createFirstPlayer`/`fillPlayer` set up players, `passGate` opens the parents' corner, `seedStars` writes story progress into IndexedDB, `playToEnd` answers from the screen text. Every test starts on an empty device. Read problems only through `currentProblem` (it waits for one on screen). Keep class names `.problem`, `.feedback`, `.result`, `.keypad [data-key]`, `.choices [data-choice]`, `.hearts .heart.full`, `.progress`, `.node[data-stage]` stable, or update the helpers in the same change.

## Commands

```bash
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run test:e2e   # build + Playwright (run in the Terminal panel)
npm run test:all   # both
npm run build      # check:i18n + tsc + vite build
```

`npm install` from the Claude sandbox needs `registry.npmjs.org` in `allowed_domains`.

## Gotchas learned the hard way

- **Phaser triangles:** `scene.add.triangle` re-centres its points on their bounding box, so shapes with negative offsets end up shifted. Use the `tri()` helper in `art.ts` (draws at exact coordinates).
- **Phaser in the Claude browser pane:** `requestAnimationFrame` stops while the pane is hidden or the window is out of view, so the battle looks frozen. In dev builds the game is `window.__game`; step frames by hand, and don't mix manual stepping with real frames (time jumps cost hearts):

  ```js
  const pump = async (ms) => { let t = performance.now(); for (let i = 0; i < ms / 50; i++) { t += 50; window.__game.step(t, 50); await new Promise(r => setTimeout(r, 0)); } };
  ```

  Keyboard input works through `window.dispatchEvent(new KeyboardEvent('keydown', { key: '7' }))`. A hot reload drops you back on the home screen.
- **Position tweens vs. the approach loop:** `BattleScene.moveTo` sets `moving` so `update()` does not overwrite a step, knock-back or retreat in progress. Don't test `tweens.isTweening(monster)` for this; the fade-in tween would block movement.

## Git and deploy

- Commit only on request. Push only when Dejan asks. Stage only files you changed.
- The Claude Bash sandbox cannot push (SSH to github.com is blocked, `~/.ssh` is unreadable). Push from the Terminal panel when it is available; otherwise Dejan pushes, e.g. `! git push origin main` typed in the chat or `git push` in his own terminal. Check that it arrived with `git ls-remote https://github.com/dejande/varuh-stevil.git refs/heads/main`.
- Every push to `main` runs unit tests, the build and the e2e suite on GitHub Actions, then deploys to Pages (4–8 minutes; installing the test browser can be slow). Watch runs through `https://api.github.com/repos/dejande/varuh-stevil/actions/runs`, then compare the live `assets/index-*.css`/`.js` names with `dist/assets`.
