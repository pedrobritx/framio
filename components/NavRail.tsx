'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import {
  CollectionsIcon,
  LibraryIcon,
  SearchIcon,
  SettingsIcon,
  StudioIcon,
} from './icons';
import ThemeToggle from './ThemeToggle';

type IconType = ComponentType<{ className?: string }>;

type NavItem = {
  href: string;
  label: string;
  Icon: IconType;
  match: (p: string) => boolean;
};

/** Primary destinations — shown in the mobile bottom bar and desktop rail. */
const PRIMARY: NavItem[] = [
  {
    href: '/',
    label: 'Discover',
    Icon: SearchIcon,
    match: (p) => p === '/' || p.startsWith('/search') || p.startsWith('/artwork'),
  },
  {
    href: '/collections',
    label: 'Collections',
    Icon: CollectionsIcon,
    match: (p) => p.startsWith('/collections'),
  },
  {
    href: '/studio',
    label: 'Studio',
    Icon: StudioIcon,
    match: (p) => p.startsWith('/studio'),
  },
  {
    href: '/library',
    label: 'Library',
    Icon: LibraryIcon,
    match: (p) => p.startsWith('/library'),
  },
];

/** Settings — demoted from the crowded bottom bar to the mobile top bar. */
const SETTINGS: NavItem = {
  href: '/settings',
  label: 'Settings',
  Icon: SettingsIcon,
  match: (p) => p.startsWith('/settings'),
};

export default function NavRail() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top bar — wordmark + settings */}
      <header className="flex items-center justify-between border-b border-stone bg-paper px-5 py-4 md:hidden">
        <Link
          href="/"
          className="font-editorial text-2xl tracking-tight text-ink"
          aria-label="Framio — home"
        >
          Framio
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle className="flex h-9 w-9 items-center justify-center text-xl text-ink-soft transition-colors hover:text-ink" />
          <Link
            href={SETTINGS.href}
            aria-label="Settings"
            aria-current={SETTINGS.match(pathname) ? 'page' : undefined}
            className={`flex h-9 w-9 items-center justify-center text-xl transition-colors hover:text-ink ${
              SETTINGS.match(pathname) ? 'text-brass' : 'text-ink-soft'
            }`}
          >
            <SettingsIcon />
          </Link>
        </div>
      </header>

      {/* Desktop left rail */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-56 md:shrink-0 md:flex-col md:gap-10 md:border-r md:border-stone md:px-6 md:py-8">
        <Link
          href="/"
          className="font-editorial text-2xl tracking-tight text-ink"
          aria-label="Framio — home"
        >
          Framio
        </Link>
        <nav aria-label="Primary">
          <ul className="flex flex-col items-start gap-3">
            {[...PRIMARY, SETTINGS].map(({ href, label, Icon, match }) => {
              const active = match(pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 text-sm uppercase tracking-label transition-colors duration-300 ease-gallery ${
                      active ? 'text-brass' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    <Icon className="text-base" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <ThemeToggle className="mt-auto flex items-center gap-3 text-sm uppercase tracking-label text-ink-soft transition-colors hover:text-ink" />
      </aside>

      {/* Mobile bottom bar — opaque for legibility, pinned past the safe area */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-stone bg-paper pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_8px_rgba(28,27,25,0.06)] md:hidden"
      >
        {PRIMARY.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 pb-2.5 pt-3 text-[0.7rem] uppercase tracking-label transition-colors duration-300 ease-gallery ${
                active ? 'text-brass' : 'text-ink-soft'
              }`}
            >
              <span className="text-xl">
                <Icon />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
