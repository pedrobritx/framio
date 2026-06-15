/**
 * The Frame output spec and Frame Studio options.
 * All Samsung Frame TVs are 16:9; the 55" is 4K. See docs/FRAME-TV.md.
 */

export const TARGET = { width: 3840, height: 2160 } as const; // 55" Frame · 4K · 16:9

export type StudioMode = 'museumMat' | 'floating' | 'smartCrop' | 'blurExtend';

export const MAT_COLORS: Record<string, string> = {
  ivory: '#F7F4EF',
  stone: '#E7E2D9',
  charcoal: '#1A1A1C',
  black: '#0E0E10',
};

export interface StudioOptions {
  mode: StudioMode;
  matColor?: string; // palette key (e.g. "ivory") or a #RRGGBB hex
  margin?: number; // 0..0.3 fraction of canvas, for mat / floating
  position?: string; // gravity for smartCrop ("attention" | "centre")
  /** smartCrop fill multiplier over the 16:9 cover (1..4). */
  zoom?: number;
  /** smartCrop horizontal pan within the overflow (-1..1). */
  offsetX?: number;
  /** smartCrop vertical pan within the overflow (-1..1). */
  offsetY?: number;
}

export const STUDIO_DEFAULTS: Record<StudioMode, Partial<StudioOptions>> = {
  museumMat: { matColor: 'ivory', margin: 0.08 },
  floating: { matColor: 'ivory', margin: 0.16 },
  smartCrop: { position: 'attention' },
  blurExtend: { matColor: 'charcoal' },
};

/** Resolve a palette key or hex string to a concrete #RRGGBB value. */
export function resolveMatColor(c?: string): string {
  if (!c) return MAT_COLORS.ivory;
  if (MAT_COLORS[c]) return MAT_COLORS[c];
  if (/^#?[0-9a-fA-F]{6}$/.test(c)) return c.startsWith('#') ? c : `#${c}`;
  return MAT_COLORS.ivory;
}
