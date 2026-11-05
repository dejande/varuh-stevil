# Varuh števil / Keeper of Numbers

A math practice battle game for my three kids (ages 6–11). Kids solve arithmetic to defeat monsters sent by Pozabnik / the Forgetter, who stole all the numbers from the valley below Triglav. It runs in Slovene and English, on the web (GitHub Pages, installable PWA) and on Android (sideloaded Capacitor APK, from milestone 5).

Family use only: no accounts, server, ads, purchases or analytics, and no network calls at runtime. All data stays on the device.

- **Spec (source of truth):** [docs/spec.md](docs/spec.md)
- **Status and next steps for whoever works on it next:** [CLAUDE.md](CLAUDE.md)
- **Publishing texts** (repo description, store-style descriptions, release notes, install guide): [docs/publishing.md](docs/publishing.md)
- **Changelog:** [below](#changelog)

## Quick start

Needs Node.js 22.12+ (CI uses Node 24).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest), about 2 s
npm run test:e2e   # build + end-to-end tests in Chrome (Playwright), about 40 s
npm run test:all   # both; run this before every commit
npm run build      # i18n check + type check + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173/varuh-stevil/
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload, base `/` |
| `npm test` | All unit tests in `tests/` |
| `npm run test:e2e` | Builds, serves `dist/` at the Pages path and plays the game in Chrome on a desktop and a phone viewport (`e2e/`) |
| `npm run test:all` | Unit tests, then end-to-end tests |
| `npm run check:i18n` | Fails when `sl.json` and `en.json` differ in keys or placeholders, have invalid ICU syntax, or a Slovene plural lacks `one`/`two`/`few`/`other`. Also checks the story files: same panels in both languages, same placeholders, `{hero}` only at the start of a sentence or quote |
| `npm run build` | `check:i18n`, then `tsc --noEmit`, then `vite build` with base `/varuh-stevil/` |
| `npm run icons` | Regenerates the placeholder PWA icons in `public/` |

## How to play

1. **First start:** a parent creates the first player: name, hero name for the story (up to 12 characters), girl or boy hero (for Slovene word forms), hero colours, language, answering mode (number keypad or 4 answer choices), monster speed, operations, number range and task types (missing number in either position: `8 + ? = 13`, `? + 5 = 13`).
2. **Prologue:** each new player first sees the story in four short panels, with their hero name in it. **Preskoči / Skip** jumps ahead; **Uvod / Prologue** on the map replays it.
3. **Kdo igra? / Who's playing?** With more than one player, the game asks who is playing and remembers the last one. **Zamenjaj igralca / Switch player** on the home screen goes back to the list.
4. **Na pot! / Adventure!** opens the story map: 5 places (village, lake, karst cave, great forest, summit), each with 5 levels and a boss. Each level starts with a short story panel. Finishing a level unlocks the next; a boss needs 10 stars from its chapter's levels, so levels can be replayed for more stars. Beating a boss shows what changed in the valley and opens the next place; after Pozabnik comes the epilogue. **Vadba / Practice** plays a free level with the player's settings.
   In a level, monsters from that place approach the hero one by one with a problem. The bar at the top shows how far into the level you are, one segment per monster. A boss has 15 lives instead: every correct answer hits it once, an answer under the target time twice, and it staggers back.
5. Answer on the keypad (or the keyboard: digits, Backspace, Enter), or tap one of the 4 choices.
   - Correct: the answer flies from the hero's staff as a golden number and dissolves the fog imp.
   - Wrong: the correct answer and one strategy hint appear, the monster steps closer, and the fact comes back 3–5 problems later.
   - If the monster reaches the hero, the hero loses a heart. With 0 of 3 hearts the level ends with an encouraging message.
6. After 10 monsters (plus any retries) the level ends with 1–3 stars.

**Parents' corner** (**Za starše / For parents**, on the player list and the home screen): hold the button for 3 seconds, then solve a two-digit multiplication. Inside: add players (up to 6), edit each player's settings, reset a player's progress (the settings stay), or delete a player.

Everything is stored on the device in IndexedDB. Nothing leaves it. In a browser that blocks storage (some private windows) the game still works and says that players will be forgotten.

Monster speed: **Relaxed** stops at a safe distance and only wrong answers move it (3 wrong answers on one monster cost a heart). **Normal** reaches the hero in 12 s (0–10, 0–20), 15 s (0–100) or 20 s (0–1000). **Fast** takes 70% of that. A wrong answer in Normal/Fast pushes the monster a quarter of the way forward; the next problem again gets the full target time for the distance that is left.

## Testing

Two layers protect what already works:

- **Unit tests** (`tests/`, Vitest) cover the rules: every generated problem for all 120 combinations of operations, ranges and task types (40 seeds each), round quotas, retries, stars, hints, notation, plurals and the i18n check.
- **End-to-end tests** (`e2e/`, Playwright) play the production build in Chrome, on a desktop and a phone viewport: first start and player setup, a full level in Slovene and in English with one mistake (the wrong fact must come back 3–5 problems later), Relaxed hearts, losing all hearts, the Normal-speed timeout, keyboard input, the prologue per player, the parent gate, adding/editing/switching/deleting players across reloads, the 6-player limit, and a full level in 4-choice mode. Each test starts on an empty device.

Run `npm run test:all` before every commit. CI runs both before deploying. Locally the e2e tests use the installed Google Chrome; CI installs Playwright's Chromium.

## Design

"Alpine paper-cut": the valley below Triglav in layered paper shapes, with the palette of Slovene painted beehive panels (ink blue `#1F2D5A`, honey `#F2B035`, meadow `#4E9A51`, berry `#D2452E`, fog `#B8B3CC`). Honey marks the one main action on each screen; selected options are ink blue. Type is Baloo 2, bundled with the app (no font CDN). Colours live in `src/theme.ts` (Phaser) and as custom properties in `src/style.css`. All art is drawn from shapes until the milestone 5 art pass.

## Project layout

```
docs/spec.md              approved spec, source of truth
src/core/                 game rules, no rendering (unit tested)
  campaign.ts             chapters, levels, bosses, stars and unlocks
  choices.ts              the 4 answer choices and their distractors (§3)
  gate.ts                 parent gate question
  profile.ts              player model, hero colours, validation, sanitising stored data
  types.ts                Op, Range, Speed, Problem, Profile
  generator.ts            problem generation (§3 rules, round quotas)
  facts.ts                fact keys, carry/borrow detection, answers
  level.ts                LevelSession: queue, retries, hearts, stars
  hints.ts                strategy hint after a mistake (§5)
  format.ts               SL (· :) and EN (× ÷) notation
  speed.ts                target time per range and speed
  approach.ts             how a monster approaches the hero (speeds, steps, time per problem)
src/i18n/                 sl.json, en.json (ICU MessageFormat), translate()
src/story/                story.sl.json, story.en.json (frozen story text), storyPanels()
src/game/BattleScene.ts   Phaser scene: hero, monster, spell (placeholder shapes)
src/game/battle.ts        wires LevelSession + scene + DOM keypad and feedback
src/storage/store.ts      players and device settings in IndexedDB (memory fallback)
src/game/art.ts           chapter backgrounds, monsters and bosses (placeholder shapes)
src/ui/                   screens in plain DOM: app shell, player picker, home, chapter map,
                          level intro, story panels, parent gate, parents' corner, editor, result
src/main.ts               starts the app
src/homeScene.ts          home and prologue illustrations (inline SVG, sceneSvg())
src/theme.ts              palette and font shared with Phaser
e2e/                      Playwright end-to-end tests and helpers
scripts/check-i18n.mjs    build-time translation check
scripts/make-icons.mjs    placeholder icon generator
tests/                    Vitest unit tests
.github/workflows/        GitHub Pages deploy
```

## Rules the code guarantees (tested)

- Every number shown, including the result, is within 0..R; no negative results.
- ÷ is always exact with divisor ≥ 1. × and ÷ use factors 0–10 up to R = 100; at R = 1000 one factor is 2–10.
- 0 and 1 as operands: at most 10% of a round. Missing-number problems: at most 30%, never with 0/1 (so the answer is unique).
- At 0–20 at least 40% of + and − cross 10; at 0–100 and 0–1000 at least 40% need a carry or borrow.
- The same fact never appears twice in a row, also after a retry is inserted.
- Slovene plurals use the dual (1 zvezdica, 2 zvezdici, 3 zvezdice, 5 zvezdic); verb forms follow the hero's gender.

## Story text

The story is frozen (spec §8): it lives in `src/story/story.sl.json` and `story.en.json` and changes only when Dejan edits it on purpose. Each entry is a list of short panels (1–3 sentences). `{hero}` is the hero name and may stand only at the start of a sentence or a quote, because Slovene names decline; anywhere else the build fails. Slovene gender forms use `{gender, select, girl {…} other {…}}`. A unit test checks that the prologue still matches `docs/spec.md` word for word.

## Translations

Strings live in `src/i18n/sl.json` and `src/i18n/en.json` as ICU MessageFormat. Add every key to both files; `npm run build` fails otherwise. Slovene plurals need `one`, `two`, `few` and `other`. Use `{gender, select, girl {…} other {…}}` where Slovene verb or noun forms depend on the hero.

## Deployment

`.github/workflows/deploy.yml` runs tests, builds and deploys `dist/` to GitHub Pages on every push to `main`. The production `base` is `/varuh-stevil/` (set in `vite.config.ts`), and the PWA service worker scope matches it.

- **Repository:** `git@github.com:dejande/varuh-stevil.git`
- **Site:** https://dejande.github.io/varuh-stevil/
- **One-time setup:** in the repo settings, under **Pages**, set the source to **GitHub Actions**. If the repo is renamed, change `REPO_BASE` in `vite.config.ts`.

## Changelog

Newest first. Every change to the repo adds a line here.

### 2026-11-05: Bigger battlefield

- On wide screens and tablets held sideways the battle uses the full screen width; the keypad sits in a narrower column on the right, and the picture gets the rest (about 55% wider than before).
- The battlefield is taller (more sky above the scene), so it fills more of the screen on every device.
- The problem stays on one line in the side column, up to `999 + 999 = ?`.

### 2026-11-05: Milestone 3, the story

- Chapter map with 5 places, 25 levels and 5 bosses; best stars per level saved per player; finishing a level unlocks the next, a boss needs 10 stars from its chapter, beating it opens the next place.
- Each place has its own battlefield and monsters: fog imps in the village, water sprites at the lake, dripstone golems in the cave, wood goblins in the forest, fog crows on the summit. Bosses: Velikan Kozolec, Jezerski zmaj, Senčni netopir, Stari Hrast, Pozabnik (15 lives; a quick answer hits twice; they stagger back when hit and start over after reaching the hero). Ribica floats beside the hero from chapter 4.
- Story text: a panel before every level, an outro after every boss, the epilogue at the end. Dejan approved the level panels and outros on 2026-11-05 (`docs/story/level-panels-draft.md`); all story text is now frozen.
- Home: **Na pot!** opens the map, **Vadba** plays practice; the prologue replays from the map.
- Results in the story offer Next, Play again and Map.
- Tests: campaign rules and boss fights (unit), the map, unlocking, the boss star requirement, a full boss fight with its outro and the epilogue (end-to-end).

### 2026-11-05: Milestone 3 started: level panels draft, design directions

- `docs/story/level-panels-draft.md`: the 25 level panels (5 chapters × 5 levels, SL + EN), waiting for Dejan's approval before they are frozen.
- `docs/design/directions.html`: three alternative visual directions (watercolour storybook, folk-painted beehive panels, clay toy world) next to the current look. Decision: the game keeps the current Alpine paper-cut look.

### 2026-11-05: Milestone 2, players and parents' corner

- Up to 6 players, each with a name, a hero name for the story (12 characters at most), girl or boy hero, hero colours, language, answering mode, monster speed, operations, range and task types.
- First start asks a parent to create the first player; with several players the game asks "Kdo igra? / Who's playing?" and remembers the last one.
- Parent gate: hold for 3 seconds, then solve a two-digit multiplication. The parents' corner adds, edits, resets and deletes players. Practice settings moved there from the home screen.
- 4-choice answering for the youngest players, with distractors from §3 (±1, ±10 from 0–100, wrong operation, swapped digits), all within the range.
- Everything is saved on the device in IndexedDB; the prologue is remembered per player. The built-in "Nika" profile is gone.
- The hero on the home screen, in the story and in battle wears the player's colours.
- UI code split into `src/ui/`; storage in `src/storage/`.
- Tests: unit tests for choices, players, the gate and storage (IndexedDB via fake-indexeddb); end-to-end tests for setup, the gate, the parents' corner, persistence and 4-choice mode.

### 2026-11-05: On GitHub

- Pushed to `github.com/dejande/varuh-stevil`; the site goes to https://dejande.github.io/varuh-stevil/.
- The repo is public, so the children's names were taken out of the docs, tests and the built-in profile (now "Nika"), including the earlier history.

### 2026-11-05: Publishing texts

- `docs/publishing.md`: GitHub description and topics, short and long descriptions (SL/EN), v0.1.0 release notes, install guide for tablets, privacy note, a message for the family.
- The installed app's description now says what the game is, in both languages.

### 2026-11-05: Rogec's horns

- Fix: Rogec's horns floated beside his head in the battle and were shifted in the home and story pictures. They now grow from the top of his head and curve back.

### 2026-11-05: Prologue, fair time after a mistake

- Prologue from the approved spec text, in four illustrated panels (the counting valley, Pozabnik's fog taking the numbers, the puzzled shepherd and miller, Rogec asking for help). Shows on the first visit; **Zgodba / Story** replays it; **Preskoči / Skip** leaves it.
- Story files `story.sl.json` / `story.en.json`; the build check now covers them, including the `{hero}` position rule.
- One-letter words (z, v, s, k…) stay on the same line as the next word in story text.
- Fix: after a wrong answer in Normal/Fast the monster kept its old speed, so the next problem had only a few seconds left. Each new problem now gets the full target time for the remaining distance. Approach rules moved to `src/core/approach.ts` with unit tests; an end-to-end test replays the bug.

### 2026-11-05: Design pass, progress bar, end-to-end tests

- New look, "Alpine paper-cut": paper-cut Triglav valley, hayrack, fog imps for monsters, the Keeper with Rogec, Baloo 2 type, palette from painted beehive panels.
- Home screen leads with the scene, the greeting and one Start button; practice settings fold away below it; language switch at the top right.
- Correct answers fly from the staff as a golden number; hearts and stars are drawn shapes.
- Battle header shows a segmented progress bar (one segment per monster, retries included) next to "Pošast 3 od 10".
- The missing-number label shows both positions (`8 + ? = 13` or `? + 5 = 13`); the generator already produced both.
- Hints for ×2 ("times 2 is a double") and ×5 ("half of times 10"); swap now works in both directions.
- Playwright end-to-end tests (desktop and phone) and `npm run test:all`; CI runs them before deploying.
- Fix: `vite preview` now serves at `/varuh-stevil/` like the Pages build.

### 2026-11-05: Milestone 1, battle core

- Repo created; spec copied to `docs/spec.md` as the source of truth.
- Vite + TypeScript + Phaser 3, set up as a PWA (offline after first load, placeholder icons).
- Problem generator for + − × ÷, ranges 0–10/20/100/1000, missing-number problems, with all §3 rules.
- Practice mode with one hard-coded profile and an in-memory settings form on the home screen.
- Battle: monster approach with Relaxed/Normal/Fast speeds, 3 hearts, stars, number keypad and keyboard input.
- After a mistake: correct answer plus one strategy hint (make 10, doubles, tens first, through 10, count up, neighbour fact, doubling, ×2, ×5, split, swap, turn it around).
- Wrong facts come back 3–5 problems later in the same level.
- `sl.json` and `en.json` with ICU plurals and gender select; the build fails on missing keys or placeholder mismatches.
- Unit tests for generation rules, level rules, hints, notation and plurals.
- GitHub Actions workflow for GitHub Pages (not pushed yet).
