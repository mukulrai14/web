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
  colorBackgroundDefault: "#ffffff",
  colorBackgroundNeutral: "#f3f4f6",
  colorBackgroundNeutralWeak: "#f9fafb",
  colorForegroundNeutral: "#111827",
  colorForegroundNeutralWeak: "#6b7280",
  colorForegroundPpg: "#0d9488",
  colorForegroundPpgStrong: "#0f766e",
  colorForegroundPpgWeak: "#14b8a6",
  colorForegroundPpgReverseWeak: "#99f6e4",
  colorStrokePpg: "#0d9488",
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
export const COBE_MARKER_DOT_RGB = hexToRgb01(
  dark.colorForegroundPpgReverseWeak,
) as [number, number, number];

/** RGB 0–1 for cobe `baseColor`, `markerColor`, `glowColor`, `arcColor`. */
export const cobeGlobe = {
  baseColor: hexToRgb01(dark.colorForegroundPpgWeak),
  markerColor: COBE_MARKER_DOT_RGB,
  glowColor: hexToRgb01(dark.colorForegroundPpgReverseWeak),
  arcColor: hexToRgb01(dark.colorForegroundPpg),
};
