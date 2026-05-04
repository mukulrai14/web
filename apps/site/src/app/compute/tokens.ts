export const dark = {
  colorBackgroundDefault: "#030712",
  colorBackgroundNeutral: "#1f2937",
  colorBackgroundNeutralWeak: "#111827",
  colorForegroundNeutral: "#f9fafb",
  colorForegroundNeutralWeak: "#9ca3af",
  colorForegroundPpg: "#14b8a6",
  colorForegroundPpgStrong: "#2dd4bf",
  colorForegroundPpgWeak: "#0d9488",
  colorForegroundPpgReverseWeak: "#99f6e4",
  colorStrokePpg: "#2dd4bf",
  colorStrokePpgWeak: "#115e59",
} as const;

export const light = {
  colorBackgroundDefault: "#99f6e4",
  colorBackgroundNeutral: "#99f6e4",
  colorBackgroundNeutralWeak: "#99f6e4",
  colorForegroundNeutral: "#99f6e4",
  colorForegroundNeutralWeak: "#99f6e4",
  colorForegroundPpg: "#99f6e4",
  colorForegroundPpgStrong: "#99f6e4",
  colorForegroundPpgWeak: "#ffffff",
  colorForegroundPpgReverseWeak: "#99f6e4",
  colorStrokePpg: "#99f6e4",
  colorStrokePpgWeak: "#99f6e4",
} as const;

export function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Per-marker tint so cobe uses the colored marker shader path. */
export const COBE_MARKER_DOT_RGB = (isLight?: boolean) =>
  hexToRgb01(
    isLight
      ? light.colorForegroundPpgReverseWeak
      : dark.colorForegroundPpgReverseWeak,
  ) as [number, number, number];

/** RGB 0–1 for cobe `baseColor`, `markerColor`, `glowColor`, `arcColor`. */
export const cobeGlobe = (isLight?: boolean) => ({
  baseColor: hexToRgb01(
    isLight ? light.colorForegroundPpgWeak : dark.colorForegroundPpgWeak,
  ),
  markerColor: COBE_MARKER_DOT_RGB(isLight),
  glowColor: hexToRgb01(
    isLight
      ? light.colorForegroundPpgReverseWeak
      : dark.colorForegroundPpgReverseWeak,
  ),
  arcColor: hexToRgb01(
    isLight ? light.colorForegroundPpg : dark.colorForegroundPpg,
  ),
});
