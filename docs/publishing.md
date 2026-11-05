# Publishing texts

Ready-to-paste texts for GitHub, GitHub Pages, the installed app and the family. They describe what the game does **today** (milestones 1 and 2). Update them when a milestone lands; the "Not yet" lists say what to add.

## GitHub repository

**Name:** `varuh-stevil`

**About / description** (GitHub allows 350 characters):

> Varuh števil / Keeper of Numbers: a math practice battle game for kids aged 6–11, in Slovene and English. Solve sums to chase away the fog imps of Pozabnik, who stole the numbers from the valley below Triglav. Offline PWA, no ads, no accounts, no tracking.

**Website:** `https://dejande.github.io/varuh-stevil/`

**Topics:** `math-game` `kids` `education` `arithmetic` `slovenian` `pwa` `phaser` `typescript` `vite` `offline-first`

**Uncheck in the About panel:** Releases and Packages (until the Android APK exists), Deployments can stay.

## Installed app (PWA manifest)

| Field | Value |
|---|---|
| `name` | Varuh števil |
| `short_name` | Varuh števil |
| `description` | Vadi računanje in preženi Pozabnikovo meglo. Math practice battles in Slovene and English. |
| `lang` | sl |

## Short description (one line)

- **SL:** Igra za vajo računanja: reši račun in preženi meglene škratke, ki so dolini pod Triglavom ukradli števila.
- **EN:** A math practice game: solve the sum and chase away the fog imps who stole the numbers from the valley below Triglav.

## Long description

### Slovenščina

**Varuh števil** je igra za vajo računanja za otroke od 6 do 11 let.

V dolini pod Triglavom so ljudje nekoč znali šteti do neskončnosti. Potem je iz gora prišel Pozabnik s sivo meglo in pobral vsa števila. Kozliček Rogec prosi tebe, zadnjega Varuha ali zadnjo Varuhinjo števil, za pomoč.

Proti junaku drsijo megleni škratki, vsak z računom. Pravilen odgovor poleti iz čarobne palice kot zlata številka in škratka razblini. Ob napaki igra pokaže pravilni odgovor in kratek namig, kako račun izračunati (na primer »Dopolni do 10: 8 + 5 = 8 + 2 + 3«), napačen račun pa se čez nekaj nalog vrne.

- Do 6 igralcev, vsak s svojim junakom, barvami in nastavitvami
- Za najmlajše: odgovarjanje s štirimi ponujenimi odgovori
- Kotiček za starše, zaklenjen z računom, ki ga otroci še ne znajo
- Seštevanje, odštevanje, množenje in deljenje, posamezno ali pomešano
- Obseg do 10, 20, 100 ali 1000
- Naloge z manjkajočim številom: 8 + ? = 13 in ? + 5 = 13
- Tri hitrosti: Sproščeno (brez časovnega pritiska), Normalno, Hitro
- Zapis, kot se ga učijo v šoli: · za množenje in : za deljenje
- Slovenščina in angleščina
- Deluje brez interneta, ko jo enkrat odpreš
- Brez oglasov, nakupov, računov in sledenja; vsi podatki ostanejo na napravi

### English

**Keeper of Numbers** is a math practice game for kids aged 6 to 11.

In the valley below Triglav, people could once count to infinity. Then the Forgetter rolled down from the mountains with a grey fog and took every number. Rogec the little ibex asks you, the last Keeper of Numbers, for help.

Fog imps drift toward the hero, each carrying a sum. A right answer flies from the Keeper's staff as a golden number and dissolves the imp. After a mistake the game shows the right answer and one short strategy hint (for example "Make 10: 8 + 5 = 8 + 2 + 3"), and the sum comes back a few problems later.

- Up to 6 players, each with their own hero, colours and settings
- For the youngest: answer by picking one of four choices
- A parents' corner, locked with a sum the kids can't do yet
- Addition, subtraction, multiplication and division, alone or mixed
- Numbers up to 10, 20, 100 or 1000
- Missing-number problems: 8 + ? = 13 and ? + 5 = 13
- Three speeds: Relaxed (no time pressure), Normal, Fast
- Slovene and English, with the notation each school uses (· and : in Slovene, × and ÷ in English)
- Works offline after the first visit
- No ads, purchases, accounts or tracking; all data stays on the device

## Release notes: v0.2.0 (players)

**SL**

- Do 6 igralcev: vsak ima svoje ime, junaka v zgodbi, barve, jezik, hitrost in računske nastavitve
- Ob prvem zagonu starš ustvari prvega igralca; igra si zapomni, kdo je igral nazadnje
- Kotiček za starše: drži gumb 3 sekunde, nato reši dvomestno množenje. Tam dodajaš, urejaš, ponastaviš ali izbrišeš igralce
- Za najmlajše: odgovarjanje s štirimi ponujenimi odgovori
- Vse se shrani na napravi; uvodna zgodba se vsakemu igralcu pokaže enkrat

Še ne: zgodba s poglavji in šefi, statistika za starše, značke, izvoz igralcev na drugo napravo, zvoki.

**EN**

- Up to 6 players, each with their own name, story hero, colours, language, speed and maths settings
- On first start a parent creates the first player; the game remembers who played last
- Parents' corner: hold the button for 3 seconds, then solve a two-digit multiplication. Add, edit, reset or delete players there
- For the youngest: answer by picking one of four choices
- Everything is saved on the device; each player sees the prologue once

Not yet: the story chapters and bosses, parent stats, badges, moving players to another device, sound.

## Release notes: v0.1.0 (first playable)

**SL**

Prva igralna različica Varuha števil.

- Vadba z vsemi štirimi računskimi operacijami in obsegi do 10, 20, 100 in 1000
- Naloge z manjkajočim številom na prvem ali drugem mestu
- Tri hitrosti pošasti, tri srca, do tri zvezdice na stopnjo
- Po napaki pravilni odgovor, namig in ponovitev računa v isti stopnji
- Uvodna zgodba o Pozabniku in kozličku Rogcu
- Slovenščina in angleščina
- Deluje brez interneta in se da namestiti kot aplikacija

Še ne (ob izidu): profili za vsakega otroka, zgodba s poglavji in šefi, način s ponujenimi odgovori, statistika za starše, zvoki.

**EN**

First playable version of Keeper of Numbers.

- Practice with all four operations and number ranges up to 10, 20, 100 and 1000
- Missing-number problems with the gap in either position
- Three monster speeds, three hearts, up to three stars per level
- After a mistake: the right answer, a strategy hint, and the sum again later in the level
- The prologue: Pozabnik the Forgetter and Rogec the ibex
- Slovene and English
- Works offline and installs as an app

Not yet (at the time): a profile for each child, the story chapters and bosses, multiple-choice answers, parent stats, sound.

## Install guide for the family

### SL: Kako namestiš igro na tablico

**Android (Chrome)**
1. Odpri `https://dejande.github.io/varuh-stevil/` v Chromu.
2. Tapni meni ⋮ in izberi **Namesti aplikacijo** (ali **Dodaj na začetni zaslon**).
3. Igra se odpre z ikone na začetnem zaslonu, tudi brez interneta.

**iPad / iPhone (Safari)**
1. Odpri povezavo v Safariju.
2. Tapni gumb **Deli** in izberi **Dodaj na začetni zaslon**.

**Posodobitve:** igra se posodobi sama, ko je tablica na internetu. Če nova različica ne pride takoj, igro zapri in ponovno odpri.

### EN: Installing on a tablet

**Android (Chrome):** open the link, tap ⋮, then **Install app** (or **Add to Home screen**).
**iPad / iPhone (Safari):** open the link, tap **Share**, then **Add to Home Screen**.
**Updates** arrive on their own when the tablet is online; close and reopen the game if a new version doesn't show up.

## Privacy note

- **SL:** Igra ne pošilja nobenih podatkov. Ne uporablja oglasov, analitike, piškotkov tretjih oseb ali računov. Nastavitve in napredek ostanejo samo na napravi, na kateri se igra.
- **EN:** The game sends no data anywhere. It has no ads, analytics, third-party cookies or accounts. Settings and progress stay on the device it is played on.

## Message to the family (example)

> Naredil sem igro za vajo računanja, **Varuh števil**. Odpri `https://dejande.github.io/varuh-stevil/` na tablici in jo dodaj na začetni zaslon. Deluje tudi brez interneta, nima oglasov in ne zbira podatkov. Povejte, kaj vam je všeč in kaj ne.

## Still to make

- **Social preview image** (1280×640 PNG) for links shared in chats: the home scene with the title. Upload it under Settings → General → Social preview.
- **Screenshots** for the README: home screen, battle, mistake hint, result.
