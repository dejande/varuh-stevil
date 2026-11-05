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
npm test           # unit tests (Vitest)
npm run build      # i18n check + type check + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173/varuh-stevil/
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload, base `/` |
| `npm test` | All unit tests in `tests/` |
| `npm run check:i18n` | Fails when `sl.json` and `en.json` differ in keys or placeholders, have invalid ICU syntax, or a Slovene plural lacks `one`/`two`/`few`/`other` |
| `npm run build` | `check:i18n`, then `tsc --noEmit`, then `vite build` with base `/varuh-stevil/` |
| `npm run icons` | Regenerates the placeholder PWA icons in `public/` |

## How to play (milestone 1)

1. On the home screen pick the language, operations, number range, monster speed and whether missing-number problems are on. These settings are in memory only for now (profiles and storage come in milestone 2).
2. Press **Začni / Start**. A monster walks toward the hero with a problem.
3. Type the answer on the keypad (or the keyboard: digits, Backspace, Enter) and confirm with ✓.
   - Correct: the hero casts a spell and the monster is defeated.
   - Wrong: the correct answer and one strategy hint appear, the monster steps closer, and the fact comes back 3–5 problems later.
   - If the monster reaches the hero, the hero loses a heart. With 0 of 3 hearts the level ends with an encouraging message.
4. After 10 monsters (plus any retries) the level ends with 1–3 stars.

Monster speed: **Relaxed** stops at a safe distance and only wrong answers move it (3 wrong answers on one monster cost a heart). **Normal** reaches the hero in 12 s (0–10, 0–20), 15 s (0–100) or 20 s (0–1000). **Fast** takes 70% of that. A wrong answer in Normal/Fast pushes the monster a quarter of the way forward.

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
src/i18n/                 sl.json, en.json (ICU MessageFormat), translate()
src/game/BattleScene.ts   Phaser scene: hero, monster, spell (placeholder shapes)
src/game/battle.ts        wires LevelSession + scene + DOM keypad and feedback
src/main.ts               home, battle and result screens (plain DOM)
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
