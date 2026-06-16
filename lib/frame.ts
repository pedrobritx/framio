/**
 * The Frame output spec and Frame Studio options.
 * All Samsung Frame TVs are 16:9; the 55" is 4K. See docs/FRAME-TV.md.
 */

export const TARGET = { width: 3840, height: 2160 } as const; // 55" Frame · 4K · 16:9

/**
 * Every Frame is 16:9, so the crop never changes — only the export resolution
 * does. All models from 43" up are 4K; the 32" is the lone FHD panel. The
 * reader picks their size in Settings (55" by default) and exports match it.
 */
export interface FrameSize {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const FRAME_SIZES: FrameSize[] = [
  { id: '32', label: '32″', width: 1920, height: 1080 }, // FHD — the only non-4K Frame
  { id: '43', label: '43″', width: 3840, height: 2160 },
  { id: '50', label: '50″', width: 3840, height: 2160 },
  { id: '55', label: '55″', width: 3840, height: 2160 }, // default
  { id: '65', label: '65″', width: 3840, height: 2160 },
  { id: '75', label: '75″', width: 3840, height: 2160 },
  { id: '85', label: '85″', width: 3840, height: 2160 },
];

export const DEFAULT_FRAME_ID = '55';

const FRAME_KEY = 'framio:frame';

export function frameById(id: string | null): FrameSize {
  return (
    FRAME_SIZES.find((s) => s.id === id) ??
    FRAME_SIZES.find((s) => s.id === DEFAULT_FRAME_ID)!
  );
}

/** The reader's saved Frame size, falling back to the 55" default. */
export function getFrameSize(): FrameSize {
  if (typeof window === 'undefined') return frameById(DEFAULT_FRAME_ID);
  try {
    return frameById(window.localStorage.getItem(FRAME_KEY));
  } catch {
    return frameById(DEFAULT_FRAME_ID);
  }
}

export function setFrameSize(id: string) {
  try {
    if (id === DEFAULT_FRAME_ID) window.localStorage.removeItem(FRAME_KEY);
    else window.localStorage.setItem(FRAME_KEY, id);
  } catch {
    /* private mode — choice just won't persist */
  }
}

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
  /** Export resolution; defaults to TARGET (55" Frame · 4K) when omitted. */
  width?: number;
  height?: number;
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
