/**
 * Inline-SVG illustrations of the valley below Triglav for the home screen and the story panels.
 * Same paper-cut language and palette as the battle scene (src/game/BattleScene.ts, src/theme.ts).
 * The top third stays open sky so a title can sit on it.
 */
export interface SceneOptions {
  /** How much of Pozabnik's fog covers the valley. */
  fog: 'none' | 'light' | 'heavy';
  keeper: boolean;
  rogec: boolean;
  imp: boolean;
  /** Golden numbers floating over the valley (the time when everyone could count). */
  numbers: boolean;
  /** Pozabnik on the mountain, pulling the numbers into his fog. */
  pozabnik: boolean;
  /** The shepherd's sheep and the miller's sacks, with question marks. */
  forgotten: boolean;
}

const HOME: SceneOptions = { fog: 'light', keeper: true, rogec: true, imp: true, numbers: false, pozabnik: false, forgotten: false };

const DEFS = `
  <defs>
    <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9fd3e6"/>
      <stop offset="1" stop-color="#e4f3f6"/>
    </linearGradient>
    <linearGradient id="hs-sky-grey" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#aeb6c8"/>
      <stop offset="1" stop-color="#d9dde6"/>
    </linearGradient>
    <filter id="hs-paper" x="-5%" y="-5%" width="110%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="0" flood-color="#1f2d5a" flood-opacity="0.16"/>
    </filter>
  </defs>`;

function landscape(grey: boolean): string {
  return `
  <rect width="800" height="400" fill="url(#${grey ? 'hs-sky-grey' : 'hs-sky'})"/>
  <circle cx="712" cy="118" r="26" fill="#f7d774" opacity="${grey ? 0.35 : 1}"/>
  <g filter="url(#hs-paper)">
    <path d="M0 262 70 222 140 244 230 196 330 236 420 204 520 232 610 190 700 226 800 204V400H0Z" fill="#a9bcd3"/>
    <path d="M330 400 400 262 440 236 470 220 506 150 540 206 566 190 610 244 680 300 760 400Z" fill="#6e83a6"/>
    <path d="M490 182 506 150 524 186 514 180 506 190 497 180Z" fill="#fff"/>
    <path d="M458 228 470 220 480 228 470 232Z" fill="#fff"/>
    <path d="M556 198 566 190 578 206 568 202 560 208Z" fill="#fff"/>
    <path d="M0 300C120 280 220 296 330 282S560 272 640 290 760 286 800 292V400H0Z" fill="#8fc07a"/>
    <path d="M0 336C140 322 300 340 440 330S680 322 800 334V400H0Z" fill="#4e9a51"/>
  </g>
  <g fill="#8b5a2b">
    <rect x="648" y="258" width="4" height="30"/><rect x="670" y="258" width="4" height="30"/><rect x="692" y="258" width="4" height="30"/>
    <rect x="648" y="262" width="48" height="2"/><rect x="648" y="269" width="48" height="2"/><rect x="648" y="276" width="48" height="2"/>
    <path d="M642 259 672 245 702 259Z" fill="#7a3b2e"/>
  </g>
  <g fill="#fff">
    <circle cx="60" cy="362" r="3"/><circle cx="210" cy="378" r="3"/><circle cx="360" cy="360" r="3"/><circle cx="520" cy="380" r="3"/><circle cx="740" cy="366" r="3"/>
  </g>`;
}

const NUMBERS = `
  <g font-family="'Baloo 2 Variable', 'Baloo 2', sans-serif" font-weight="800" fill="#f2b035" stroke="#1f2d5a" stroke-width="3" paint-order="stroke" text-anchor="middle">
    <text x="120" y="150" font-size="44">1</text><text x="210" y="112" font-size="38">2</text>
    <text x="300" y="160" font-size="46">3</text><text x="610" y="160" font-size="40">7</text>
    <text x="400" y="104" font-size="36">5</text><text x="250" y="232" font-size="34">8</text>
    <text x="150" y="250" font-size="56">∞</text>
  </g>
  <g transform="translate(330 300)">
    <rect x="-18" y="-24" width="36" height="24" fill="#f4f7fb"/><path d="M-24 -24 0-44 24-24Z" fill="#7a3b2e"/>
    <rect x="-5" y="-14" width="10" height="14" fill="#8b5a2b"/>
  </g>
  <g transform="translate(400 304)">
    <rect x="-14" y="-20" width="28" height="20" fill="#f4f7fb"/><path d="M-19 -20 0-36 19-20Z" fill="#7a3b2e"/>
  </g>`;

const POZABNIK = `
  <g transform="translate(600 238)">
    <path d="M-34 40 0-60 34 40Z" fill="#6f6a86"/>
    <path d="M-20 -24C-20-58 20-58 20-24L14-6H-14Z" fill="#59546f"/>
    <ellipse cx="0" cy="-26" rx="12" ry="11" fill="#2b2940"/>
    <circle cx="-5" cy="-27" r="2.6" fill="#e8e4ff"/><circle cx="5" cy="-27" r="2.6" fill="#e8e4ff"/>
    <rect x="30" y="-48" width="4" height="88" fill="#4a4560"/>
    <circle cx="32" cy="-52" r="9" fill="#b8b3cc"/>
  </g>
  <g font-family="'Baloo 2 Variable', 'Baloo 2', sans-serif" font-weight="800" fill="#d9dde6" opacity="0.8" text-anchor="middle">
    <text x="320" y="150" font-size="34">4</text><text x="420" y="122" font-size="30">9</text><text x="510" y="168" font-size="26">2</text>
  </g>
  <path d="M300 140C380 100 470 120 560 190" fill="none" stroke="#d9dde6" stroke-width="3" stroke-dasharray="6 10" opacity="0.8"/>`;

const FORGOTTEN = `
  <g transform="translate(250 330)">
    <g fill="#fff"><circle cx="0" cy="-16" r="13"/><circle cx="14" cy="-18" r="12"/><circle cx="-12" cy="-18" r="11"/></g>
    <circle cx="22" cy="-22" r="7" fill="#3a3a48"/>
    <rect x="-8" y="-6" width="3" height="10" fill="#3a3a48"/><rect x="8" y="-6" width="3" height="10" fill="#3a3a48"/>
  </g>
  <g transform="translate(320 344)">
    <g fill="#fff"><circle cx="0" cy="-16" r="12"/><circle cx="13" cy="-17" r="11"/><circle cx="-11" cy="-17" r="10"/></g>
    <circle cx="21" cy="-21" r="6.5" fill="#3a3a48"/>
    <rect x="-7" y="-6" width="3" height="10" fill="#3a3a48"/><rect x="7" y="-6" width="3" height="10" fill="#3a3a48"/>
  </g>
  <g transform="translate(470 330)">
    <path d="M-16 0C-20-24-12-34 0-36 12-34 20-24 16 0Z" fill="#e9d8b4"/><path d="M-6 -36H6L4-42H-4Z" fill="#c9b48a"/>
  </g>
  <g transform="translate(504 336)">
    <path d="M-14 0C-18-20-10-30 0-31 10-30 18-20 14 0Z" fill="#e9d8b4"/><path d="M-5 -31H5L3-36H-3Z" fill="#c9b48a"/>
  </g>
  <g font-family="'Baloo 2 Variable', 'Baloo 2', sans-serif" font-weight="800" fill="#1f2d5a" text-anchor="middle">
    <text x="284" y="282" font-size="40">?</text><text x="488" y="278" font-size="40">?</text>
  </g>`;

function fog(level: SceneOptions['fog']): string {
  if (level === 'none') return '';
  if (level === 'light') {
    return `<g fill="#b8b3cc" opacity="0.4"><ellipse cx="610" cy="338" rx="90" ry="20"/><ellipse cx="720" cy="326" rx="110" ry="22"/></g>`;
  }
  return `<g fill="#c9c4da" opacity="0.6">
    <ellipse cx="560" cy="250" rx="260" ry="60"/><ellipse cx="300" cy="300" rx="320" ry="56"/>
    <ellipse cx="120" cy="250" rx="180" ry="40"/><ellipse cx="700" cy="330" rx="200" ry="50"/>
  </g>`;
}

const ROGEC = `
  <g transform="translate(96 340)">
    <rect x="-14" y="-18" width="5" height="18" fill="#6b4a2b"/><rect x="10" y="-18" width="5" height="18" fill="#6b4a2b"/>
    <ellipse cx="0" cy="-24" rx="23" ry="14" fill="#d8b98c"/>
    <ellipse cx="26" cy="-42" rx="12" ry="10" fill="#d8b98c"/>
    <path d="M20 -50Q22 -66 9 -67M27 -50Q29 -66 16 -67" fill="none" stroke="#6b4a2b" stroke-width="4" stroke-linecap="round"/>
    <circle cx="31" cy="-44" r="2.5" fill="#1f2d5a"/>
    <ellipse cx="-22" cy="-30" rx="4" ry="3" fill="#fff"/>
  </g>`;

const KEEPER = `
  <g transform="translate(180 340)">
    <path d="M-30 0 0-80 30 0Z" fill="#23408e"/>
    <rect x="-30" y="-6" width="60" height="6" fill="#f2b035"/>
    <circle cx="0" cy="-92" r="17" fill="#f4cda5"/>
    <circle cx="-6" cy="-92" r="2.2" fill="#1f2d5a"/><circle cx="6" cy="-92" r="2.2" fill="#1f2d5a"/>
    <ellipse cx="0" cy="-104" rx="27" ry="5" fill="#2f6b4f"/>
    <ellipse cx="0" cy="-114" rx="15" ry="11" fill="#2f6b4f"/>
    <rect x="-15" y="-110" width="30" height="4" fill="#f2b035"/>
    <path d="M12 -122l2 4 4 0-3 3 1 4-4-2-4 2 1-4-3-3 4 0Z" fill="#fff"/>
    <rect x="31" y="-104" width="5" height="104" fill="#8b5a2b"/>
    <circle cx="34" cy="-112" r="16" fill="#f2b035" opacity="0.25"/>
    <circle cx="34" cy="-112" r="9" fill="#f2b035"/>
  </g>`;

const IMP = `
  <g transform="translate(560 330)">
    <circle cx="52" cy="-22" r="12" fill="#b8b3cc" opacity="0.5"/>
    <circle cx="70" cy="-30" r="8" fill="#b8b3cc" opacity="0.35"/>
    <g fill="#b8b3cc">
      <circle cx="-26" cy="-30" r="22"/><circle cx="24" cy="-30" r="22"/><circle cx="0" cy="-50" r="30"/>
      <circle cx="-12" cy="-24" r="22"/><circle cx="14" cy="-22" r="22"/>
    </g>
    <ellipse cx="-12" cy="-42" rx="8" ry="9.5" fill="#fff"/><ellipse cx="12" cy="-42" rx="8" ry="9.5" fill="#fff"/>
    <circle cx="-14" cy="-40" r="5" fill="#1f2d5a"/><circle cx="10" cy="-40" r="5" fill="#1f2d5a"/>
    <ellipse cx="0" cy="-24" rx="5" ry="4" fill="#1f2d5a" opacity="0.75"/>
    <circle cx="-24" cy="-30" r="4" fill="#d2452e" opacity="0.35"/><circle cx="24" cy="-30" r="4" fill="#d2452e" opacity="0.35"/>
  </g>`;

export function sceneSvg(options: Partial<SceneOptions> = {}): string {
  const o = { ...HOME, ...options };
  return `<svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${DEFS}
    ${landscape(o.fog === 'heavy')}
    ${o.numbers ? NUMBERS : ''}
    ${o.forgotten ? FORGOTTEN : ''}
    ${fog(o.fog)}
    ${o.pozabnik ? POZABNIK : ''}
    ${o.rogec ? ROGEC : ''}
    ${o.keeper ? KEEPER : ''}
    ${o.imp ? IMP : ''}
  </svg>`;
}

export const HOME_SCENE_SVG = sceneSvg();

/** One illustration per prologue panel, in panel order. */
export const PROLOGUE_SCENES: Partial<SceneOptions>[] = [
  { fog: 'none', keeper: false, rogec: false, imp: false, numbers: true },
  { fog: 'heavy', keeper: false, rogec: false, imp: false, pozabnik: true },
  { fog: 'light', keeper: false, rogec: false, imp: false, forgotten: true },
  { fog: 'light', keeper: true, rogec: true, imp: false },
];
