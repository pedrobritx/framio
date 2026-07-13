'use client';

import { useEffect, useState } from 'react';

type Choice = 'system' | 'light' | 'dark';

const KEY = 'framio:theme';

function systemTheme(): 'light' | 'dark' {
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function apply(choice: Choice) {
  const resolved = choice === 'system' ? systemTheme() : choice;
  document.documentElement.setAttribute('data-theme', resolved);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta)
    meta.setAttribute('content', resolved === 'dark' ? '#1a1a1c' : '#fbfaf7');
  try {
    if (choice === 'system') window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, choice);
  } catch {
    /* private mode — choice just won't persist */
  }
}

const OPTIONS: { id: Choice; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

/** Theme selector for Settings — Light "Gallery Wall" / Dark "Exhibition Room". */
export default function ThemeSetting() {
  const [choice, setChoice] = useState<Choice>('system');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      setChoice(saved === 'light' || saved === 'dark' ? saved : 'system');
    } catch {
      setChoice('system');
    }
  }, []);

  return (
    <div className="flex flex-col gap-2 border-t border-stone py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <div>
        <p className="text-sm">Theme</p>
        <p className="mt-1 text-xs text-ink-soft">
          Light “Gallery Wall” / Dark “Exhibition Room”.
        </p>
      </div>
      <div className="flex w-fit overflow-hidden rounded-full border border-stone sm:shrink-0">
        {OPTIONS.map((o) => {
          const active = choice === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setChoice(o.id);
                apply(o.id);
              }}
              className={`px-3 py-1.5 text-xs uppercase tracking-label transition-colors ${
                active ? 'bg-brass text-paper' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
