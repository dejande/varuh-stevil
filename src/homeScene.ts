/**
 * The home screen illustration: the valley below Triglav, the Keeper with Rogec, and a fog imp drifting in.
 * Same paper-cut language and palette as the battle scene (src/game/BattleScene.ts, src/theme.ts).
 * The top third is open sky for the title.
 */
export const HOME_SCENE_SVG = `
<svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9fd3e6"/>
      <stop offset="1" stop-color="#e4f3f6"/>
    </linearGradient>
    <filter id="hs-paper" x="-5%" y="-5%" width="110%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="0" flood-color="#1f2d5a" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="800" height="400" fill="url(#hs-sky)"/>
  <circle cx="712" cy="118" r="26" fill="#f7d774"/>
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
  </g>
  <g fill="#b8b3cc" opacity="0.4">
    <ellipse cx="610" cy="338" rx="90" ry="20"/><ellipse cx="720" cy="326" rx="110" ry="22"/>
  </g>
  <!-- Rogec -->
  <g transform="translate(96 340)">
    <rect x="-14" y="-18" width="5" height="18" fill="#6b4a2b"/><rect x="10" y="-18" width="5" height="18" fill="#6b4a2b"/>
    <ellipse cx="0" cy="-24" rx="23" ry="14" fill="#d8b98c"/>
    <ellipse cx="26" cy="-42" rx="12" ry="10" fill="#d8b98c"/>
    <path d="M18 -50c-6-6-6-14 0-18M25 -51c-5-7-4-14 2-18" fill="none" stroke="#6b4a2b" stroke-width="4" stroke-linecap="round"/>
    <circle cx="31" cy="-44" r="2.5" fill="#1f2d5a"/>
    <ellipse cx="-22" cy="-30" rx="4" ry="3" fill="#fff"/>
  </g>
  <!-- The Keeper -->
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
  </g>
  <!-- A fog imp -->
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
  </g>
</svg>`;
