'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * The app shell scrolls its <main> internally (so the mobile bottom bar can sit
 * in normal flow rather than float). Browser scroll restoration only tracks the
 * window, so reset the content pane to the top on each route change.
 */
export default function ScrollReset() {
  const pathname = usePathname();
  useEffect(() => {
    document.getElementById('main')?.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}
