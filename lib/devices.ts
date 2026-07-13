import { getFrameSize } from './frame';

/**
 * Export presets — one artwork, framed for every screen in the house.
 *
 * Reference devices set the pixel targets; anything smaller in the same
 * category downscales cleanly. The Frame preset defers to the reader's saved
 * Frame size (Settings), keeping lib/frame.ts the source of truth for TVs.
 */

export type DeviceCategory = 'tv' | 'phone' | 'tablet' | 'desktop';

export interface DevicePreset {
  id: string;
  label: string;
  category: DeviceCategory;
  width: number;
  height: number;
  note: string;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'frame',
    label: 'The Frame TV',
    category: 'tv',
    width: 3840,
    height: 2160,
    note: 'Uses your Frame size from Settings',
  },
  {
    id: 'phone',
    label: 'Phone wallpaper',
    category: 'phone',
    width: 1320,
    height: 2868,
    note: 'iPhone Pro Max reference — scales to any modern phone',
  },
  {
    id: 'tablet',
    label: 'Tablet · portrait',
    category: 'tablet',
    width: 2048,
    height: 2732,
    note: 'iPad Pro 12.9″ reference',
  },
  {
    id: 'tablet-landscape',
    label: 'Tablet · landscape',
    category: 'tablet',
    width: 2732,
    height: 2048,
    note: 'iPad Pro 12.9″ reference, on its side',
  },
  {
    id: 'desktop',
    label: 'Desktop · 4K',
    category: 'desktop',
    width: 3840,
    height: 2160,
    note: 'Any 16:9 monitor',
  },
];

export const DEFAULT_PRESET_ID = 'frame';

export function presetById(id: string | null): DevicePreset {
  return (
    DEVICE_PRESETS.find((p) => p.id === id) ??
    DEVICE_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!
  );
}

/**
 * The concrete export resolution for a preset. The Frame preset resolves
 * through the reader's saved Frame size (the 32″ is FHD, the rest 4K).
 */
export function presetResolution(preset: DevicePreset): {
  width: number;
  height: number;
} {
  if (preset.id === 'frame') {
    const frame = getFrameSize();
    return { width: frame.width, height: frame.height };
  }
  return { width: preset.width, height: preset.height };
}

export function presetAspect(preset: DevicePreset): number {
  return preset.width / preset.height;
}
