const HEX = /^#([0-9a-f]{6})$/i;
const MIN_CONTRAST = 4.5;
const TINT_STRENGTH = 0.1;

type Rgb = [number, number, number];

export function isHexColor(value: string): boolean {
  return HEX.test(value);
}

function toRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(rgb: Rgb): string {
  return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(toRgb(a)), luminance(toRgb(b))].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

function mix(rgb: Rgb, target: number, amount: number): Rgb {
  return [
    rgb[0] + (target - rgb[0]) * amount,
    rgb[1] + (target - rgb[1]) * amount,
    rgb[2] + (target - rgb[2]) * amount,
  ];
}

/** Light tint background plus a text colour of the same hue that meets WCAG AA on it. */
export function pillColors(hex: string): { background: string; text: string } {
  const base = toRgb(isHexColor(hex) ? hex : '#6B675F');
  const background = toHex(mix(base, 255, 1 - TINT_STRENGTH));
  let text = toHex(base);
  for (let step = 0.1; contrastRatio(text, background) < MIN_CONTRAST && step <= 1; step += 0.1) {
    text = toHex(mix(base, 0, step));
  }
  return { background, text };
}
