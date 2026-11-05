# Varuh števil / Keeper of Numbers

A math practice battle game for my three kids (ages 6–11). Kids solve arithmetic to defeat monsters sent by Pozabnik / the Forgetter, who stole all the numbers from the valley below Triglav. It runs in Slovene and English, on the web (GitHub Pages, installable PWA) and on Android (sideloaded Capacitor APK, from milestone 5).

Family use only: no accounts, server, ads, purchases or analytics, and no network calls at runtime. All data stays on the device.

- **Spec (source of truth):** [docs/spec.md](docs/spec.md)
- **Status and next steps for whoever works on it next:** [CLAUDE.md](CLAUDE.md)
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

## How to play (milestone 1)

0. On the first visit the **prologue** tells the story in four short panels (Pozabnik's fog took the numbers, Rogec asks the hero for help). **Preskoči / Skip** jumps to the home screen; **Zgodba / Story** on the home screen replays it.
1. On the home screen pick the language (top right). **Nastavitve vadbe / Practice settings** below the Start button opens the operations, number range, monster speed and task types (plain, or missing number in either position: `8 + ? = 13`, `? + 5 = 13`). Settings are in memory only for now; profiles and storage come in milestone 2.
2. Press **Začni / Start**. A fog imp drifts toward the hero with a problem. The bar at the top shows how far into the level you are, one segment per monster.
3. Type the answer on the keypad (or the keyboard: digits, Backspace, Enter) and confirm with ✓.
   - Correct: the answer flies from the hero's staff as a golden number and dissolves the fog imp.
   - Wrong: the correct answer and one strategy hint appear, the monster steps closer, and the fact comes back 3–5 problems later.
   - If the monster reaches the hero, the hero loses a heart. With 0 of 3 hearts the level ends with an encouraging message.
4. After 10 monsters (plus any retries) the level ends with 1–3 stars.

Monster speed: **Relaxed** stops at a safe distance and only wrong answers move it (3 wrong answers on one monster cost a heart). **Normal** reaches the hero in 12 s (0–10, 0–20), 15 s (0–100) or 20 s (0–1000). **Fast** takes 70% of that. A wrong answer in Normal/Fast pushes the monster a quarter of the way forward; the next problem again gets the full target time for the distance that is left.

## Testing

Two layers protect what already works:

- **Unit tests** (`tests/`, Vitest) cover the rules: every generated problem for all 120 combinations of operations, ranges and task types (40 seeds each), round quotas, retries, stars, hints, notation, plurals and the i18n check.
- **End-to-end tests** (`e2e/`, Playwright) play the production build in Chrome, on a desktop and a phone viewport: language switch, a full level in Slovene and in English with one mistake (the wrong fact must come back 3–5 problems later), Relaxed hearts, losing all hearts, the Normal-speed timeout, and keyboard input.

Run `npm run test:all` before every commit. CI runs both before deploying. Locally the e2e tests use the installed Google Chrome; CI installs Playwright's Chromium.

## Design

"Alpine paper-cut": the valley below Triglav in layered paper shapes, with the palette of Slovene painted beehive panels (ink blue `#1F2D5A`, honey `#F2B035`, meadow `#4E9A51`, berry `#D2452E`, fog `#B8B3CC`). Honey marks the one main action on each screen; selected options are ink blue. Type is Baloo 2, bundled with the app (no font CDN). Colours live in `src/theme.ts` (Phaser) and as custom properties in `src/style.css`. All art is drawn from shapes until the milestone 5 art pass.

## Project layout

```
docs/spec.md              approved spec, source of truth
src/core/                 game rules, no rendering (unit tested)
  types.ts                Op, Range, Speed, Problem, Profile
  generator.ts            problem generation (§3 rules, round quotas)
  facts.ts                fact keys, carry/borrow detection, answers
  level.ts                LevelSession: queue, retries, hearts, stars
  hints.ts                strategy hint after a mistake (§5)
  format.ts               SL (· :) and EN (× ÷) notation
  speed.ts                target time per range and speed
  profile.ts              the one hard-coded profile of milestone 1
  approach.ts             how a monster approaches the hero (speeds, steps, time per problem)
src/i18n/                 sl.json, en.json (ICU MessageFormat), translate()
src/story/                story.sl.json, story.en.json (frozen story text), storyPanels()
src/game/BattleScene.ts   Phaser scene: hero, monster, spell (placeholder shapes)
src/game/battle.ts        wires LevelSession + scene + DOM keypad and feedback
src/main.ts               home, battle and result screens (plain DOM)
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

The GitHub repository is not created yet. To publish:

1. Create the repo `varuh-stevil` on GitHub (a public repo, or a private one on a paid plan) and push `main`.
2. In the repo settings, under **Pages**, set the source to **GitHub Actions**.
3. The site appears at `https://<user>.github.io/varuh-stevil/`. If the repo gets a different name, change `REPO_BASE` in `vite.config.ts`.

## Changelog

Newest first. Every change to the repo adds a line here.

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
