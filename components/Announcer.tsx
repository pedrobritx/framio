'use client';

import { useSyncExternalStore } from 'react';
import { getAnnouncement, subscribeAnnouncer } from '@/lib/announce';

/**
 * The app's single polite live region. Visually hidden; screen readers speak
 * whatever `announce()` last set (favorites, export progress, playback).
 */
export default function Announcer() {
  const message = useSyncExternalStore(
    subscribeAnnouncer,
    getAnnouncement,
    () => '',
  );
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {message}
    </div>
  );
}
