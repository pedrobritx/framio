'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { trapFocus } from '@/lib/focus-trap';

/**
 * Global keyboard shortcuts for desktop:
 *   /  focus search      w  Watch mode
 *   t  toggle theme      ?  this help
 * Ignored while typing in a field. Watch runs its own key handling and is
 * skipped here.
 */

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: '/', action: 'Focus search' },
  { keys: 'w', action: 'Watch mode' },
  { keys: 't', action: 'Toggle light / dark' },
  { keys: '←  →', action: 'Move focus (also arrows on a TV remote)' },
  { keys: '?', action: 'Show this help' },
  { keys: 'Esc', action: 'Close a dialog' },
];

function isTyping(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    (el as HTMLElement).isContentEditable
  );
}

export default function Shortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (helpOpen && dialogRef.current) return trapFocus(dialogRef.current);
  }, [helpOpen]);

  const focusSearch = useCallback(() => {
    const input = document.getElementById('artwork-search') as HTMLInputElement | null;
    if (input) input.focus();
    else router.push('/search/');
  }, [router]);

  useEffect(() => {
    // Watch owns its keys; don't double-handle there.
    if (pathname.startsWith('/watch')) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        if (helpOpen) setHelpOpen(false);
        return;
      }
      if (isTyping(document.activeElement)) return;
      switch (e.key) {
        case '/':
          e.preventDefault();
          focusSearch();
          break;
        case 'w':
          e.preventDefault();
          router.push('/watch/');
          break;
        case 't':
          e.preventDefault();
          (document.querySelector('[data-theme-toggle]') as HTMLElement | null)?.click();
          break;
        case '?':
          e.preventDefault();
          setHelpOpen((v) => !v);
          break;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pathname, helpOpen, focusSearch, router]);

  if (!helpOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Close shortcuts"
        onClick={() => setHelpOpen(false)}
        className="absolute inset-0 bg-midnight/60"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        tabIndex={-1}
        className="relative w-full max-w-md border border-stone bg-paper p-6 text-ink shadow-xl"
      >
        <h2 id="shortcuts-title" className="font-editorial text-2xl">
          Keyboard shortcuts
        </h2>
        <dl className="mt-4 space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-4">
              <dt className="text-sm text-ink-soft">{s.action}</dt>
              <dd>
                <kbd className="rounded border border-stone bg-ivory px-2 py-0.5 font-ui text-xs text-ink">
                  {s.keys}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={() => setHelpOpen(false)}
          className="mt-6 w-full bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-brass"
        >
          Close
        </button>
      </div>
    </div>
  );
}
