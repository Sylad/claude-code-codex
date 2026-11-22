// Contraste WCAG calculé depuis les jetons de la charte (src/styles/global.css) — L8.
// oklch → sRGB (Björn Ottosson, OKLab), composition alpha en sRGB (comme le navigateur), ratio WCAG 2.x.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const CSS = readFileSync(fileURLToPath(new URL('../../src/styles/global.css', import.meta.url)), 'utf8');

/** Jetons `--nom: oklch(L C h)` du bloc :root. */
export function jetons(css = CSS) {
  const root = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));
  const out = {};
  for (const [, nom, l, c, h] of root.matchAll(/--([\w-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/g)) {
    out[nom] = oklchToRgb(Number(l), Number(c), Number(h));
  }
  return out;
}

/** oklch → [r, g, b] sRGB 0–255 (bornés). */
export function oklchToRgb(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((v) => {
    const x = Math.min(1, Math.max(0, v));
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  });
}

/** Couleur `haut` d'opacité `alpha` posée sur `bas` (composition sRGB). */
export const poser = (haut, alpha, bas) => haut.map((v, i) => v * alpha + bas[i] * (1 - alpha));

const lum = ([r, g, b]) => {
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
export const contraste = (x, y) => {
  const [a, b] = [lum(x), lum(y)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
