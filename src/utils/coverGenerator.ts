/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates an SVG Data URL representing a luxurious school yearbook hardcover
 * for Bina Bangsa School-Pantai Indah Kapuk with rich typography, embossed borders,
 * school seal, and the official color palette (Dark Blue, Yellow, White, and Turquoise).
 */
export function generateCoverSvgDataUrl(
  year: string,
  title: string,
  themeColor: 'darkBlue' | 'turquoise' | 'navyYellow' | 'midnight' | 'whiteGold' | 'royal' = 'darkBlue'
): string {
  const colorMap = {
    darkBlue: {
      bg1: '#071630',
      bg2: '#020b18',
      spine: '#030d1d',
      accent: '#00c4cc',      // Turquoise accent
      foil: '#facc15',        // School Yellow / Gold
      textMuted: '#93c5fd',   // Light ice blue / white
      crest: '#ffffff',       // White
      badgeBorder: '#00c4cc',
    },
    turquoise: {
      bg1: '#0e4e59',
      bg2: '#06282e',
      spine: '#052126',
      accent: '#facc15',      // Yellow accent
      foil: '#2dd4bf',        // Bright Turquoise
      textMuted: '#ccfbf1',
      crest: '#ffffff',
      badgeBorder: '#facc15',
    },
    navyYellow: {
      bg1: '#0a1931',
      bg2: '#000b1a',
      spine: '#040d1c',
      accent: '#facc15',      // Yellow
      foil: '#ffd000',
      textMuted: '#e2e8f0',   // White
      crest: '#38bdf8',       // Turquoise
      badgeBorder: '#ffd000',
    },
    midnight: {
      bg1: '#081a3a',
      bg2: '#030c1c',
      spine: '#040f24',
      accent: '#38bdf8',      // Turquoise-sky
      foil: '#fde047',        // Bright Yellow
      textMuted: '#cbd5e1',   // White
      crest: '#ffffff',
      badgeBorder: '#38bdf8',
    },
    whiteGold: {
      bg1: '#112240',
      bg2: '#0a1931',
      spine: '#071428',
      accent: '#00c4cc',      // Turquoise
      foil: '#facc15',        // Yellow
      textMuted: '#f8fafc',   // Crisp White
      crest: '#ffffff',
      badgeBorder: '#00c4cc',
    },
    royal: {
      bg1: '#0d2552',
      bg2: '#05122b',
      spine: '#071636',
      accent: '#2dd4bf',      // Turquoise
      foil: '#facc15',        // Yellow
      textMuted: '#e0f2fe',
      crest: '#ffffff',
      badgeBorder: '#2dd4bf',
    },
  };

  const scheme = colorMap[themeColor] || colorMap.darkBlue;
  const safeYear = escapeXml(year);
  const safeTitle = escapeXml(title);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width="100%" height="100%">
    <defs>
      <linearGradient id="bbsBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${scheme.bg1}" />
        <stop offset="100%" stop-color="${scheme.bg2}" />
      </linearGradient>
      <linearGradient id="bbsFoilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
        <stop offset="25%" stop-color="${scheme.foil}" />
        <stop offset="70%" stop-color="${scheme.accent}" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.85" />
      </linearGradient>
      <linearGradient id="bbsSpineShadow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.65" />
        <stop offset="4%" stop-color="#ffffff" stop-opacity="0.2" />
        <stop offset="8%" stop-color="#000000" stop-opacity="0.45" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </linearGradient>
      <radialGradient id="bbsVignette" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.8" />
      </radialGradient>
      <pattern id="bbsGrain" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="0.8" fill="${scheme.foil}" opacity="0.12" />
        <circle cx="30" cy="25" r="0.8" fill="${scheme.accent}" opacity="0.1" />
        <circle cx="20" cy="35" r="0.6" fill="#ffffff" opacity="0.1" />
      </pattern>
    </defs>

    <!-- Hardcover Background -->
    <rect width="400" height="560" rx="8" fill="url(#bbsBgGrad)" />
    <rect width="400" height="560" rx="8" fill="url(#bbsGrain)" />
    <rect width="400" height="560" rx="8" fill="url(#bbsVignette)" />

    <!-- Spine groove line -->
    <rect x="0" y="0" width="30" height="560" fill="url(#bbsSpineShadow)" />
    <line x1="28" y1="0" x2="28" y2="560" stroke="#000000" stroke-width="2" opacity="0.4" />
    <line x1="29" y1="0" x2="29" y2="560" stroke="#ffffff" stroke-width="1" opacity="0.2" />

    <!-- Outer Decorative Border (Embossed Yellow Gold & Turquoise Frame) -->
    <rect x="42" y="32" width="326" height="496" rx="4" fill="none" stroke="url(#bbsFoilGrad)" stroke-width="2.5" opacity="0.9" />
    <rect x="48" y="38" width="314" height="484" rx="2" fill="none" stroke="${scheme.accent}" stroke-width="1" stroke-dasharray="3,3" opacity="0.75" />

    <!-- Corner Ornaments in Turquoise & Yellow -->
    <g stroke="url(#bbsFoilGrad)" stroke-width="1.8" fill="none" opacity="0.95">
      <path d="M 52 52 L 72 52 M 52 52 L 52 72" />
      <path d="M 358 52 L 338 52 M 358 52 L 358 72" />
      <path d="M 52 518 L 72 518 M 52 518 L 52 498" />
      <path d="M 358 518 L 338 518 M 358 518 L 358 498" />
    </g>

    <!-- Official BBS Pictogram Heraldic Crest Emblem -->
    <g transform="translate(205, 160) scale(0.24)">
      <defs>
        <clipPath id="coverShieldClip">
          <path d="M -155 -190 L 155 -190 L 155 30 C 155 125, 60 170, 0 190 C -60 170, -155 125, -155 30 Z" />
        </clipPath>
      </defs>

      <!-- Shield Background and Cross (Clipped) -->
      <g clip-path="url(#coverShieldClip)">
        <!-- Top-Left: Turquoise -->
        <rect x="-155" y="-190" width="155" height="180" fill="#159899" />
        <!-- Top-Right: White -->
        <rect x="0" y="-190" width="155" height="180" fill="#ffffff" />
        <!-- Bottom-Left: White -->
        <rect x="-155" y="-10" width="155" height="200" fill="#ffffff" />
        <!-- Bottom-Right: Turquoise -->
        <rect x="0" y="-10" width="155" height="200" fill="#159899" />

        <!-- Navy Cross -->
        <rect x="-155" y="-80" width="310" height="70" fill="#031d3d" />
        <rect x="-33" y="-190" width="66" height="380" fill="#031d3d" />

        <!-- BBS Typography -->
        <text x="-70" y="115" font-family="'Playfair Display', Georgia, serif" font-size="105" font-weight="900" text-anchor="middle" fill="#031d3d">B</text>
        <text x="0" y="115" font-family="'Playfair Display', Georgia, serif" font-size="105" font-weight="900" text-anchor="middle" fill="#ffffff">B</text>
        <text x="66" y="115" font-family="'Playfair Display', Georgia, serif" font-size="105" font-weight="900" text-anchor="middle" fill="#031d3d">S</text>

        <!-- Open Book at Cross Intersection -->
        <path d="M -2 -105 L -85 -125 L -85 -13 L -2 5 L 2 5 L 85 -13 L 85 -125 L 2 -105 Z" fill="#031d3d" />
        <path d="M -4 -99 L -76 -119 L -76 -19 L -4 -1 Z" fill="#ffffff" />
        <path d="M 4 -99 L 76 -119 L 76 -19 L 4 -1 Z" fill="#ffffff" />
        <line x1="0" y1="-101" x2="0" y2="1" stroke="#031d3d" stroke-width="2.5" />

        <!-- 培 民 Characters -->
        <text x="-37" y="-41" font-family="'Kaiti', 'STKaiti', 'KaiTi', 'Noto Serif SC', 'SimSun', serif" font-size="34" font-weight="bold" text-anchor="middle" fill="#031d3d">培</text>
        <text x="37" y="-41" font-family="'Kaiti', 'STKaiti', 'KaiTi', 'Noto Serif SC', 'SimSun', serif" font-size="34" font-weight="bold" text-anchor="middle" fill="#031d3d">民</text>
      </g>

      <!-- Outer Turquoise Frame -->
      <path d="M -155 -190 L 155 -190 L 155 30 C 155 125, 60 170, 0 190 C -60 170, -155 125, -155 30 Z" fill="none" stroke="#159899" stroke-width="12" stroke-linejoin="round" />
    </g>

    <!-- School Header Text: BINA BANGSA SCHOOL -->
    <text x="205" y="78" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-size="13" font-weight="800" letter-spacing="3" fill="#ffffff">
      BINA BANGSA SCHOOL
    </text>
    <text x="205" y="94" text-anchor="middle" font-family="'Inter', sans-serif" font-size="9" font-weight="700" letter-spacing="2.5" fill="${scheme.accent}">
      PANTAI INDAH KAPUK
    </text>
    <text x="205" y="106" text-anchor="middle" font-family="'Inter', sans-serif" font-size="7.5" font-weight="600" letter-spacing="1.5" fill="${scheme.foil}" opacity="0.9">
      ANNUAL COMMEMORATIVE ARCHIVES
    </text>

    <!-- Center Academic Year Badge -->
    <g transform="translate(205, 255)">
      <rect x="-105" y="-18" width="210" height="36" rx="18" fill="${scheme.bg1}" stroke="url(#bbsFoilGrad)" stroke-width="2" />
      <text x="0" y="7" text-anchor="middle" font-family="'Cinzel', Georgia, serif" font-size="19" font-weight="800" letter-spacing="2" fill="${scheme.foil}">
        ${safeYear}
      </text>
    </g>

    <!-- Main Yearbook Title -->
    <text x="205" y="335" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-size="23" font-weight="700" fill="#ffffff" letter-spacing="0.5">
      ${truncateText(safeTitle, 26)}
    </text>

    <!-- Subtitle / Edition -->
    <text x="205" y="365" text-anchor="middle" font-family="'Inter', sans-serif" font-size="10" font-weight="700" letter-spacing="3" fill="${scheme.accent}">
      OFFICIAL BBS PIK VOLUME
    </text>

    <line x1="110" y1="385" x2="300" y2="385" stroke="url(#bbsFoilGrad)" stroke-width="1.2" opacity="0.75" />
    <circle cx="205" cy="385" r="3.5" fill="${scheme.foil}" />

    <!-- Bottom School Motto & Location -->
    <text x="205" y="475" text-anchor="middle" font-family="'Playfair Display', Georgia, italic" font-size="11" font-weight="600" fill="#ffffff">
      "Gloria Dei Vivens Homo"
    </text>
    <text x="205" y="495" text-anchor="middle" font-family="'Inter', sans-serif" font-size="8.5" letter-spacing="2" font-weight="600" fill="${scheme.accent}">
      PANTAI INDAH KAPUK • JAKARTA
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateText(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 1) + '…';
}
