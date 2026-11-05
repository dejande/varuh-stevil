/**
 * Paper-cut banners for the five chapters on the map, the level intros and the boss outros.
 * Same palette and layered-paper look as the battle backgrounds (src/game/art.ts).
 */
const INK = '#1f2d5a';

/** A paper layer: the shape over a darker copy shifted down. */
const p = (d: string, fill: string, depth = 3) =>
  `<path d="${d}" fill="${INK}" opacity="0.16" transform="translate(0 ${depth})"/><path d="${d}" fill="${fill}"/>`;

const alps = (far: string, near: string) =>
  p('M0 92 40 64 80 78 130 46 180 72 230 52 280 70 330 40 400 66V140H0Z', far) +
  p('M150 140 190 84 214 70 236 30 256 62 272 52 300 86 340 140Z', near) +
  p('M226 50 236 30 247 52 240 49 236 56 231 49Z', '#fff', 0);

const BANNERS: string[] = [
  // 1 · Vas pod goro
  `<rect width="400" height="140" fill="#cde8f1"/><circle cx="60" cy="34" r="16" fill="#f7d774"/>
   ${alps('#a9bcd3', '#6e83a6')}
   ${p('M0 108C80 96 160 106 240 98S360 96 400 100V140H0Z', '#8fc07a')}
   ${p('M70 104h22v-14H70Z', '#f4f7fb', 2)}${p('M66 91 81 80 96 91Z', '#7a3b2e', 2)}
   ${p('M110 106h18v-12h-18Z', '#f4f7fb', 2)}${p('M106 95 119 85 132 95Z', '#7a3b2e', 2)}
   <g fill="#8b5a2b"><rect x="300" y="86" width="3" height="20"/><rect x="316" y="86" width="3" height="20"/><rect x="332" y="86" width="3" height="20"/><rect x="300" y="90" width="35" height="2"/><rect x="300" y="96" width="35" height="2"/></g>
   ${p('M296 87 318 77 340 87Z', '#7a3b2e', 2)}
   ${p('M0 124C140 116 260 128 400 120V140H0Z', '#4e9a51')}`,
  // 2 · Jezero
  `<rect width="400" height="140" fill="#cfe9f3"/>${alps('#a9bcd3', '#5f7aa3')}
   <rect y="92" width="400" height="48" fill="#5ea2cc"/>
   <g fill="#fff" opacity="0.6"><rect x="40" y="104" width="30" height="2"/><rect x="150" y="116" width="40" height="2"/><rect x="300" y="108" width="26" height="2"/><rect x="250" y="126" width="34" height="2"/></g>
   ${p('M190 100 206 92 250 90 270 98 256 104 200 105Z', '#5e9e4a', 2)}
   ${p('M220 92h12v-10h-12Z', '#f4f7fb', 2)}${p('M218 83 226 76 234 83Z', '#7a3b2e', 2)}
   ${p('M234 92h6v-18h-6Z', '#f4f7fb', 2)}${p('M233 75 237 66 241 75Z', '#7a3b2e', 2)}
   ${p('M0 126C60 120 110 128 150 124V140H0Z', '#6aa85a')}`,
  // 3 · Kraška jama
  `<rect width="400" height="140" fill="#3a3446"/>
   ${p('M0 0H400V22L350 30 300 18 240 34 180 20 120 36 60 22 0 32Z', '#2e2a3a')}
   ${[30, 80, 130, 190, 250, 310, 360].map((x, i) => p(`M${x - 8} 22h16l-8 ${24 + (i % 3) * 14}Z`, '#7d7287', 2)).join('')}
   ${p('M0 100 70 88 150 104 230 90 320 106 400 94V140H0Z', '#564e66')}
   ${[110, 200, 290].map((x, i) => p(`M${x - 10} 104h20l-10 ${-26 - i * 6}Z`, '#8a7f94', 2)).join('')}
   <rect y="112" width="400" height="12" fill="#3a6f9a"/><rect x="60" y="117" width="24" height="2" fill="#bfe3f2"/><rect x="260" y="117" width="30" height="2" fill="#bfe3f2"/>
   ${p('M0 126C120 120 260 130 400 122V140H0Z', '#6b6178')}
   <circle cx="340" cy="60" r="3" fill="#bfe3f2"/><circle cx="70" cy="70" r="2" fill="#bfe3f2"/>`,
  // 4 · Pohorski gozd
  `<rect width="400" height="140" fill="#d8ecdf"/>
   ${[20, 70, 120, 170, 220, 270, 320, 370].map((x) => p(`M${x - 22} 104 ${x} 50 ${x + 22} 104Z`, '#6f9f7a', 2)).join('')}
   ${p('M0 104H400V116H0Z', '#5b8e55', 2)}
   ${[40, 110, 180, 260, 340].map((x) => p(`M${x - 28} 124 ${x} 40 ${x + 28} 124Z`, '#2f6b4f', 2) + p(`M${x - 22} 96 ${x} 30 ${x + 22} 96Z`, '#2f6b4f', 2)).join('')}
   ${p('M0 122C120 116 260 126 400 118V140H0Z', '#4e7d3f')}
   <ellipse cx="150" cy="128" rx="8" ry="4" fill="#d2452e"/><ellipse cx="300" cy="126" rx="7" ry="4" fill="#e0a526"/>`,
  // 5 · Vrh gore
  `<rect width="400" height="140" fill="#dfe5ee"/>
   ${p('M0 100 60 52 110 80 170 20 230 74 280 44 340 82 400 54V140H0Z', '#8a93a6')}
   ${p('M160 34 170 20 181 38 174 35 170 42 165 35Z', '#fff', 0)}
   ${p('M0 112 90 98 190 116 300 96 400 110V140H0Z', '#737d91')}
   <g fill="#b8b3cc" opacity="0.55"><ellipse cx="90" cy="70" rx="120" ry="18"/><ellipse cx="300" cy="96" rx="140" ry="20"/></g>
   ${p('M0 126C140 118 260 130 400 120V140H0Z', '#9aa2b2')}
   <ellipse cx="60" cy="130" rx="30" ry="5" fill="#fff"/><ellipse cx="260" cy="132" rx="40" ry="5" fill="#fff"/>`,
];

export function chapterBanner(chapter: number): string {
  const body = BANNERS[Math.min(5, Math.max(1, chapter)) - 1];
  return `<svg viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;
}
