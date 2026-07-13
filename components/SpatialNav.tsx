'use client';

import { useEffect } from 'react';
import { initSpatialNav } from '@/lib/spatial-nav';

/**
 * Mounts document-level D-pad navigation once, for the whole app. Rendered in
 * the root layout; renders nothing.
 */
export default function SpatialNav() {
  useEffect(() => initSpatialNav(), []);
  return null;
}
