# Math Game Spec: Varuh števil / Keeper of Numbers

Title confirmed 2026-11-05. Story plot (§8) approved and frozen 2026-11-05; per-level panel text still needs approval. Status: spec v1 approved, from the interview on 2026-11-05. This copy in the repo is the source of truth.

## 1. Goal

An engaging math practice game for my three kids (ages 6–11). Kids solve arithmetic to win monster battles inside a fixed story. It runs on the web and on Android from one codebase, in Slovene and English.

**Reference:** [MathHero: Math Games for Kids](https://apps.apple.com/us/app/-/id1534886813) by Speedymind. Kids fight monsters by solving mental math, earn levels and outfits, and a parent can set topics, task types and monster speed. Rated 4.6–4.7. Players praise the engagement and the lack of ads. Complaints:
- Waiting timers limit how long kids can play.
- Wrong answers come without an explanation of the strategy.
- It gets repetitive over time.

We borrow the genre, not the game. Name, hero, monsters, story and art are all our own. We also fix the complaints above: no waiting timers, a strategy hint after every mistake, and story chapters for variety.

**Family use only.** Web on GitHub Pages plus a sideloaded Android APK. No store listing, accounts, server, ads, purchases or analytics.

## 2. Core loop

1. Pick a profile, then the **Story** (chapter map) or **Practice** (free play with current settings).
2. In a level, monsters approach the hero one at a time. Each monster shows a problem.
3. A correct answer makes the hero cast a spell, and the monster is defeated.
4. A wrong answer shows the correct answer plus a short strategy hint, and the monster steps closer. The fact comes back later in the same level.
5. If a monster reaches the hero, the hero loses a heart (3 hearts per level). With 0 hearts the level ends, and the child gets an encouraging message and a retry.
6. At the end of a level the child gets 1–3 stars, and the next level unlocks.

### Battle parameters

| Item | Value |
|---|---|
| Problems per normal level | 10 |
| Boss level | 1 boss with 15 HP. Each correct answer does 1 damage, and a fast answer (under the target time) does 2 |
| Hearts | 3 |
| Stars | 3 = all hearts and at most 1 mistake · 2 = finished with at most 3 mistakes · 1 = finished |
| Level unlock | Finishing a level (any star count) unlocks the next one. A chapter's boss needs 10 stars from that chapter |

### Monster speed (per profile)

| Setting | Behaviour |
|---|---|
| Sproščeno / Relaxed | The monster walks up and stops at a safe distance. Time never costs a heart; only wrong answers move it closer |
| Normalno / Normal | Target time per problem: 12 s at 0–10/0–20, 15 s at 0–100, 20 s at 0–1000 |
| Hitro / Fast | 70% of the Normal times |

The adaptive layer adjusts speed by up to ±20% inside the chosen setting (see §4).

## 3. Problem settings (per profile)

- **Operations** (any combination, at least one): + − × ÷
- **Range**: 0–10, 0–20, 0–100, 0–1000
- **Task types**: plain `a op b = ?` (always on), missing number `a op ? = c` / `? op b = c` (toggle). When more than one operation is enabled, they are mixed in the same round.
- **Input**: number keypad (default), or 4 answer choices for the youngest players

### Generation rules (range R is the upper bound for every number shown, including the result)

| Op | Rule |
|---|---|
| + | a, b ≥ 0, a + b ≤ R |
| − | 0 ≤ b ≤ a ≤ R (no negative results) |
| × | a × b ≤ R. For R ≤ 100 both factors are 0–10. For R = 1000, one factor is 2–10 and the other is chosen so the product stays ≤ 1000 |
| ÷ | a = b × q, a ≤ R, b ≥ 1, exact result only (no remainders, never ÷ 0). Same factor limits as × |

Further rules:
- 0 and 1 as operands appear in at most 10% of problems.
- The same problem never appears twice in a row.
- At 0–20, + and − cross 10 in at least 40% of problems. At 0–100 and 0–1000, at least 40% need a carry or borrow. That's where the learning happens.
- Missing-number problems make up at most 30% of a round when that task type is on.
- Multiple-choice distractors: correct ±1, correct ±10 (for R ≥ 100), the result of the wrong operation, and the swapped-digit number. All are within 0..R and all are distinct.
- Notation follows the profile's language. **SL uses `·` for times and `:` for divide**, as taught in Slovene schools. **EN uses `×` and `÷`.**

### Range and the story

The story does not change the range: any range works in any chapter. The parent sets the range per child, which lets an 11-year-old at 0–1000 and a 6-year-old at 0–10 play the same story.

## 4. Adaptive layer

The game keeps statistics **per profile, per fact** (for example `7×8`, `13−5`). For each fact it stores:
- attempts and correct answers
- the last 5 answer times
- when it was last seen

Behaviour:
- **Weak facts**: accuracy under 70%, or a time slower than target. About 30% of the problems in a round come from the weak list, as long as they fit the current settings.
- **Retry**: a fact answered wrong comes back 3–5 problems later in the same level.
- **Speed**: rolling accuracy over the last 20 answers. Above 90% with fast answers, the monster gets 10% faster. Below 70%, it gets 10% slower. The total change is capped at ±20%.
- **Suggestion**: the range and operations never change on their own. When a child stays above 90% for 3 sessions, the parent stats show a suggestion such as "ready for 0–100".

## 5. Mistakes and hints

After a wrong answer, show the correct answer and **one** short strategy line, then continue. Hint templates exist in SL and EN for each operation:

| Op | Example strategies |
|---|---|
| + | Make 10: 8 + 5 = 8 + 2 + 3. Doubles: 6 + 7 = 6 + 6 + 1. Tens first: 47 + 25 = 67 + 5 |
| − | Count up: 13 − 8 → from 8 up to 13 is 5. Through 10: 15 − 7 = 15 − 5 − 2 |
| × | Neighbour fact: 9 × 7 = 10 × 7 − 7. Doubling: 4 × 6 = 2 × 6 × 2. Swap: 3 × 8 = 8 × 3 |
| ÷ | Turn it around: 56 : 8 → what × 8 = 56? |

The game picks a hint that fits the problem. When none fits, it shows the answer only.

## 6. Profiles and parent area

- Up to 6 local profiles. Each has a name, a hero name (defaults to the profile name, max 12 characters, shown in the story), a hero gender (girl/boy, needed for Slovene verb forms), a hero look (chosen from preset heroes and colours), a language, an input mode, a speed, operations, a range, task types and story progress.
- **Parent gate**: hold a button for 3 seconds, then solve a two-digit multiplication.
- **Parent area**:
  - edit each child's settings
  - stats: accuracy per operation, the 10 weakest facts, minutes played per day over the last 14 days, stars per chapter
  - range suggestions (see §4)
  - export and import of all profiles as a JSON file, to move them between devices
  - reset a profile

## 7. Languages

- Slovene and English. The default is set per profile and can be switched in settings.
- **Everything** is translated: UI, story, hints, badges and parent area.
- Strings live in `sl.json` and `en.json`, and the story in `story.sl.json` and `story.en.json`.
- Use ICU plural rules, because Slovene has the dual: 1 zvezdica, 2 zvezdici, 3 zvezdice, 5 zvezdic.
- The UI must handle Slovene text being about 20% longer.
- A build-time check fails when a key is missing in either language.

## 8. Frozen story

**Frozen** means the story text lives in the repo as fixed content files. The game never generates, varies or shuffles it. A change happens only when Dejan edits the files on purpose. Text only, short panels (1–3 sentences each), so a 6-year-old can read them with help.

**Hero:** the child's own hero, a young **Varuh / Varuhinja števil / Keeper of Numbers**, called by the hero name from the profile.

**Hero name and gender in the text:**
- Story files use the placeholder `{hero}`. Only the plot is frozen; the name is filled in at runtime.
- Slovene names decline (Nika, Niko, Niki), so the story only uses `{hero}` in the nominative or as a direct address ("{hero}, pomagaj nam!"). Every other mention says "ti" or "Varuh/Varuhinja". A content check fails when `{hero}` appears in any other position.
- Slovene past tense and nouns depend on gender (prišel/prišla, Varuh/Varuhinja). Story strings that need it use ICU `select` on the hero gender. English needs no variants. **Companion:** Rogec, a small ibex kid.
**Villain:** **Pozabnik / the Forgetter**, a fog wizard who steals numbers so that people forget how to count.

### Prologue
- **SL:** V dolini pod Triglavom so ljudje nekoč znali šteti do neskončnosti. Nekega jutra se je iz gora spustila siva megla. Z njo je prišel Pozabnik in pobral vsa števila. Mlinar ne ve več, koliko vreč moke ima, in pastir ne ve, koliko ovac pase. Kozliček Rogec pride k tebi: »{hero}, ti si {gender, select, girl {zadnja Varuhinja} other {zadnji Varuh}} števil. Pomagaj nam!«
- **EN:** In the valley below Triglav, people could once count to infinity. One morning a grey fog rolled down from the mountains. With it came the Forgetter, and he took every number. The miller no longer knows how many sacks of flour he has, and the shepherd can't count his sheep. Rogec the little ibex comes to you: "{hero}, you are the last Keeper of Numbers. Help us!"

### Chapters

Each chapter has 5 levels and a boss. Every boss is a creature the fog has enchanted. Beating it lifts the spell, and it becomes a friend.

| # | Place | Monsters | Boss | After the boss (SL / EN) |
|---|---|---|---|---|
| 1 | Vas pod goro / The village | Megleni škratki / fog imps | Velikan Kozolec / the Hayrack Giant | »Spet vem, koliko snopov imam!« / "I know how many sheaves I have again!" The village counts again. |
| 2 | Jezero / The lake | Vodni duhci / water sprites | Jezerski zmaj / the Lake Dragon | The dragon's scales shine again, and it lends the hero a boat across the lake. |
| 3 | Kraška jama / The karst cave | Kapniški golemi / dripstone golems | Senčni netopir / the Shadow Bat | The light returns to the cave. A small olm, **Ribica**, joins the team and lights the way. |
| 4 | Pohorski gozd / The great forest | Lesni škratje / wood goblins | Stari Hrast / the Old Oak | The Old Oak remembers the forest's way and shows the path to the mountain. |
| 5 | Vrh gore / The summit | Meglene vrane / fog crows | **Pozabnik** | The fog lifts. Pozabnik admits he was lonely, because no one ever counted him among their friends. The hero counts him in, and he gives the numbers back. |

### Epilogue
- **SL:** Števila so se vrnila v dolino. Ljudje spet štejejo, merijo in delijo kruh na enake kose. Rogec se nasmehne: »Varuh števil ne neha nikoli vaditi.« (This line unlocks Practice and replaying levels for more stars.)
- **EN:** The numbers are back in the valley. People count, measure and share bread into equal pieces again. Rogec smiles: "A Keeper of Numbers never stops practising."

Per-level text: each level gets one panel of 1–2 sentences before it starts, set in the chapter's place. The full panel text (5 × 5 levels, SL + EN) is the first content task in the dev repo. Dejan approves it before it is frozen.

## 9. Badges (v1)

| Badge | Condition |
|---|---|
| Prvi korak / First step | Finish level 1 |
| Brez napake / Flawless | Any level with 0 mistakes |
| Strela / Lightning | 10 correct answers in a row, each under half the target time |
| Mojster seštevanja / Addition master (one each for −, ×, ÷) | 200 correct answers in that operation |
| Lovec na slabe točke / Weak-spot hunter | Turn 5 weak facts into strong ones |
| Zbiralec zvezd / Star collector | 50 stars |
| Osvoboditelj / Liberator | One badge per chapter boss |
| Varuh števil / Keeper of Numbers | Finish the story |

## 10. Art and sound

- **Art**: AI-generated in one consistent style (soft painted storybook look, Slovene alpine setting), curated by hand. Asset list:
  - 4–6 hero variants
  - Rogec and Ribica
  - 5 monster types, 2–3 colour variants each
  - 5 bosses
  - 5 battle backgrounds
  - 5 chapter-map illustrations
  - story panel illustrations, one per chapter intro and outro
- Monsters are cute rather than scary, in line with what parents praise in the reference app.
- **Sound**: short sound effects (correct, wrong, spell, defeat, star) and an optional music loop. Sound and music each have their own toggle.

## 11. Tech

- **One codebase**: TypeScript, Vite, Phaser 3 for the battle scene, plain DOM/CSS for the menus, map and parent area.
- **Web**: an installable PWA that works offline after the first load, hosted on **GitHub Pages**.
  - A GitHub Actions workflow builds and deploys on every push to `main`.
  - Vite `base` is set to the repo path, and the service worker scope matches it.
  - The Pages URL is public even when the repo is private (private repos need a paid plan for Pages). That's acceptable: all child data stays on the device and nothing is sent anywhere.
  - The same workflow attaches the Android APK to a GitHub Release, so the tablets can download it from there.
- **Android**: Capacitor wrapper, sideloaded APK. Portrait and landscape both work, and portrait is preferred on phones.
- **Storage**: local only, in IndexedDB. No network calls at runtime. JSON export and import between devices.
- **Tests**:
  - unit tests for the generation rules (every generated problem respects range, operation, task type and no-remainder)
  - adaptive selection and plural forms
  - one end-to-end test that plays one level in each language

## 12. Out of scope for v1

Coins and shop, daily challenges and streaks, voice narration, sync between devices, accounts, comparison tasks (<, >, =), fractions, time and money, a store release.

## 13. Milestones

1. **Battle core**: Practice mode with one profile, keypad, all operations and ranges, hints, retry of wrong facts. EN and SL strings from the start.
2. **Profiles and settings**: profiles, parent gate, settings, the multiple-choice input mode, local storage.
3. **Story**: chapter map, 30 levels, bosses, the frozen story text, stars and unlocks.
4. **Adaptive layer and parent stats**: weak facts, speed adjustment, stats, badges, export and import.
5. **Release**: GitHub Pages deployment, the Android APK on GitHub Releases, and an art and sound pass. The Pages deploy can be set up already in milestone 1, so every milestone is playable on the tablets.

## 14. Open questions

- **Level panels**: Dejan approves the per-level panel text (written in the dev repo) before it is frozen.
