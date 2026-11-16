// Generates original, locally rendered placeholder artwork (SVG -> WebP) so the
// site looks complete without using any third-party images.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const PLACEHOLDER_DIR = path.join(process.cwd(), "public", "placeholders");

type Palette = { bg: string; bg2: string; main: string; dark: string; accent: string };

export const PALETTES: Palette[] = [
  { bg: "#FDE7D8", bg2: "#FBD3BA", main: "#F97316", dark: "#C2410C", accent: "#0F766E" },
  { bg: "#D9F2EE", bg2: "#BDE7E0", main: "#0F766E", dark: "#115E59", accent: "#F97316" },
  { bg: "#F3E8FF", bg2: "#E4CCFB", main: "#9333EA", dark: "#6B21A8", accent: "#F59E0B" },
  { bg: "#FEF3C7", bg2: "#FDE68A", main: "#D97706", dark: "#92400E", accent: "#DB2777" },
  { bg: "#FCE7F3", bg2: "#FBCFE8", main: "#DB2777", dark: "#9D174D", accent: "#0EA5E9" },
  { bg: "#E0F2FE", bg2: "#BAE6FD", main: "#0284C7", dark: "#075985", accent: "#F97316" },
];

const background = (p: Palette, w: number, h: number, seed: number) => {
  const dots: string[] = [];
  for (let y = 30; y < h; y += 60) {
    for (let x = 30 + ((y / 60) % 2) * 30; x < w; x += 60) {
      dots.push(`<circle cx="${x}" cy="${y}" r="${3 + ((x + y + seed) % 3)}" fill="${p.bg2}" opacity="0.8"/>`);
    }
  }
  return `<rect width="${w}" height="${h}" fill="${p.bg}"/>${dots.join("")}
  <circle cx="${w * 0.85}" cy="${h * 0.12}" r="${w * 0.22}" fill="${p.bg2}" opacity="0.7"/>
  <circle cx="${w * 0.1}" cy="${h * 0.92}" r="${w * 0.28}" fill="${p.bg2}" opacity="0.6"/>`;
};

const motifs: Record<string, (p: Palette, v: number) => string> = {
  crochet: (p, v) => {
    const lines = Array.from({ length: 7 }, (_, i) => {
      const o = -150 + i * 50;
      return `<path d="M ${-170} ${o} Q 0 ${o + (v % 2 ? 60 : -60)} 170 ${o + 20}" stroke="${p.dark}" stroke-width="9" fill="none" stroke-linecap="round" opacity="0.55"/>`;
    }).join("");
    return `<g transform="translate(400 480) rotate(${v * 12 - 20})">
      <ellipse cx="10" cy="215" rx="190" ry="26" fill="${p.dark}" opacity="0.15"/>
      <circle r="200" fill="${p.main}"/>
      <clipPath id="ball"><circle r="200"/></clipPath>
      <g clip-path="url(#ball)">${lines}
        <path d="M -200 40 Q 0 -120 200 -40" stroke="${p.bg}" stroke-width="10" fill="none" opacity="0.5"/></g>
      <path d="M 150 140 C 260 220 120 300 300 330" stroke="${p.main}" stroke-width="12" fill="none" stroke-linecap="round"/>
      <g transform="rotate(-38) translate(-40 -330)">
        <rect x="0" y="0" width="22" height="420" rx="11" fill="${p.accent}"/>
        <path d="M 0 10 q 11 -26 22 0" fill="${p.accent}"/>
        <rect x="-6" y="250" width="34" height="110" rx="12" fill="#ffffff" opacity="0.85"/>
      </g></g>`;
  },
  knitting: (p, v) => {
    const rows = Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 6 }, (_, c) => {
        const x = -150 + c * 50;
        const y = -170 + r * 46;
        return `<path d="M ${x} ${y} l 25 34 l 25 -34" stroke="${r % 3 === v % 3 ? p.accent : p.dark}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      }).join(""),
    ).join("");
    return `<g transform="translate(400 500)">
      <rect x="-190" y="-210" width="380" height="420" rx="28" fill="${p.main}"/>
      ${rows}
      <g transform="rotate(${-30 + v * 4})"><rect x="-8" y="-330" width="16" height="560" rx="8" fill="#8B5E3C"/><circle cx="0" cy="-334" r="20" fill="${p.accent}"/></g>
      <g transform="rotate(${32 - v * 4})"><rect x="-8" y="-330" width="16" height="560" rx="8" fill="#A47148"/><circle cx="0" cy="-334" r="20" fill="${p.accent}"/></g>
    </g>`;
  },
  sewing: (p, v) => `<g transform="translate(400 500)">
      <g transform="translate(-90 0) rotate(${v * 5 - 8})">
        <rect x="-110" y="-200" width="220" height="36" rx="10" fill="#B07A4F"/>
        <rect x="-80" y="-164" width="160" height="300" fill="${p.main}"/>
        ${Array.from({ length: 10 }, (_, i) => `<line x1="-80" x2="80" y1="${-150 + i * 29}" y2="${-140 + i * 29}" stroke="${p.dark}" stroke-width="5" opacity="0.5"/>`).join("")}
        <rect x="-110" y="136" width="220" height="36" rx="10" fill="#B07A4F"/>
      </g>
      <path d="M -10 -40 C 120 -180 240 40 140 180 S 40 320 180 330" stroke="${p.main}" stroke-width="7" fill="none" stroke-dasharray="18 12"/>
      <g transform="translate(170 -40) rotate(35)"><rect x="-6" y="-170" width="12" height="300" rx="6" fill="#64748B"/><ellipse cx="0" cy="-150" rx="3" ry="14" fill="${p.bg}"/></g>
      ${[0, 1, 2].map((i) => `<g transform="translate(${120 + i * 70} ${230 - i * 30})"><circle r="30" fill="${i === 1 ? p.accent : p.dark}"/><circle cx="-8" cy="-8" r="5" fill="${p.bg}"/><circle cx="8" cy="-8" r="5" fill="${p.bg}"/><circle cx="-8" cy="8" r="5" fill="${p.bg}"/><circle cx="8" cy="8" r="5" fill="${p.bg}"/></g>`).join("")}
    </g>`,
  crafts: (p, v) => {
    const petals = Array.from({ length: 8 }, (_, i) => `<path d="M 0 0 L 70 -170 L 0 -230 L -70 -170 Z" fill="${i % 2 ? p.main : p.accent}" transform="rotate(${i * 45 + v * 7})" opacity="${i % 2 ? 1 : 0.85}"/>`).join("");
    return `<g transform="translate(400 470)">${petals}<circle r="60" fill="${p.dark}"/><circle r="26" fill="${p.bg}"/>
      <rect x="-6" y="60" width="12" height="380" fill="${p.dark}"/>
      <path d="M 0 300 q 90 -70 140 -10 q -80 50 -140 10" fill="${p.accent}"/></g>`;
  },
  felting: (p, v) => `<g transform="translate(400 520)">
      <ellipse cx="0" cy="210" rx="210" ry="30" fill="${p.dark}" opacity="0.15"/>
      <rect x="-70" y="-20" width="140" height="220" rx="60" fill="#FFF7ED"/>
      <path d="M -230 0 C -230 -220 230 -220 230 0 Z" fill="${p.main}"/>
      ${[[-120, -60, 26], [-20, -130, 20], [90, -70, 30], [160, -20, 16], [30, -40, 14]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="0.9"/>`).join("")}
      <g transform="translate(${170 - v * 10} -240) rotate(25)"><rect x="-5" y="-40" width="10" height="230" rx="5" fill="#475569"/><rect x="-16" y="-80" width="32" height="60" rx="10" fill="${p.accent}"/></g>
      <circle cx="-210" cy="170" r="50" fill="${p.accent}" opacity="0.9"/>
    </g>`,
  embroidery: (p, v) => {
    const flower = (x: number, y: number, c: string, s: number) =>
      `<g transform="translate(${x} ${y}) scale(${s})">${Array.from({ length: 6 }, (_, i) => `<ellipse rx="14" ry="34" cy="-34" fill="none" stroke="${c}" stroke-width="7" transform="rotate(${i * 60})"/>`).join("")}<circle r="12" fill="${p.accent}"/></g>`;
    return `<g transform="translate(400 490)">
      <circle r="250" fill="#C08A57"/><circle r="232" fill="#FFFDF8"/><circle r="232" fill="none" stroke="#D9A574" stroke-width="6"/>
      <rect x="-26" y="-290" width="52" height="60" rx="10" fill="#A0703F"/>
      ${flower(-60, -40, p.main, 1.2)}${flower(80, 40, p.dark, 0.9)}${flower(-20, 120, p.accent, 0.7)}${flower(110 - v * 5, -120, p.main, 0.6)}
      <path d="M -60 0 Q -40 100 -20 120 M 80 70 Q 60 130 -20 140" stroke="#15803D" stroke-width="6" fill="none"/>
      ${[[-140, 60], [-120, 100], [-90, 130], [140, -40], [160, 0]].map(([x, y]) => `<path d="M ${x} ${y} l 14 -14" stroke="#15803D" stroke-width="6" stroke-linecap="round"/>`).join("")}
    </g>`;
  },
};

export const CATEGORY_KEYS = Object.keys(motifs);

const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

async function render(file: string, markup: string) {
  const buf = await sharp(Buffer.from(markup)).webp({ quality: 82 }).toBuffer();
  await writeFile(path.join(PLACEHOLDER_DIR, file), buf);
  const blur = await sharp(buf).resize(16, 20, { fit: "cover" }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${blur.toString("base64")}`;
}

export type GeneratedImage = { url: string; blur: string };

/** Renders product, category, article, avatar and fallback placeholders. */
export async function generatePlaceholders(variantsPerCategory = 6) {
  await mkdir(PLACEHOLDER_DIR, { recursive: true });
  const products: Record<string, GeneratedImage[]> = {};
  const categories: Record<string, string> = {};

  for (const [ci, key] of CATEGORY_KEYS.entries()) {
    products[key] = [];
    for (let v = 0; v < variantsPerCategory; v++) {
      const p = PALETTES[(ci + v) % PALETTES.length];
      const file = `${key}-${v + 1}.webp`;
      const blur = await render(file, svg(800, 1000, background(p, 800, 1000, v) + motifs[key](p, v)));
      products[key].push({ url: `/placeholders/${file}`, blur });
    }
    const p = PALETTES[ci % PALETTES.length];
    const file = `category-${key}.webp`;
    await render(file, svg(800, 800, background(p, 800, 800, ci) + `<g transform="translate(0 -80)">${motifs[key](p, 1)}</g>`));
    categories[key] = `/placeholders/${file}`;
  }

  const articles: string[] = [];
  for (let i = 0; i < 8; i++) {
    const key = CATEGORY_KEYS[i % CATEGORY_KEYS.length];
    const p = PALETTES[(i + 2) % PALETTES.length];
    const file = `article-${i + 1}.webp`;
    await render(file, svg(1200, 675, background(p, 1200, 675, i) + `<g transform="translate(200 -180) scale(0.85)">${motifs[key](p, i)}</g>`));
    articles.push(`/placeholders/${file}`);
  }

  await render("fallback.webp", svg(800, 1000, background(PALETTES[1], 800, 1000, 0) + motifs.crochet(PALETTES[1], 1)));
  await render(
    "hero.webp",
    svg(1200, 900, background(PALETTES[0], 1200, 900, 3) +
      `<g transform="translate(-60 -40) scale(0.9)">${motifs.crochet(PALETTES[0], 2)}</g><g transform="translate(420 160) scale(0.75)">${motifs.embroidery(PALETTES[1], 1)}</g>`),
  );
  await render("og.webp", svg(1200, 630, background(PALETTES[1], 1200, 630, 1) + `<g transform="translate(400 -120) scale(0.8)">${motifs.knitting(PALETTES[1], 2)}</g>`));

  return { products, categories, articles };
}

export async function generateAvatar(file: string, initials: string, index: number) {
  const p = PALETTES[index % PALETTES.length];
  await mkdir(PLACEHOLDER_DIR, { recursive: true });
  const markup = svg(
    240,
    240,
    `<rect width="240" height="240" fill="${p.bg}"/><circle cx="120" cy="120" r="100" fill="${p.main}"/>
     <text x="120" y="138" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="700" fill="#ffffff" text-anchor="middle">${initials}</text>`,
  );
  await render(file, markup);
  return `/placeholders/${file}`;
}
