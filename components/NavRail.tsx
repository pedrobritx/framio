'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import {
  BrowseIcon,
  CollectionsIcon,
  LibraryIcon,
  SearchIcon,
  SettingsIcon,
  StudioIcon,
} from './icons';

type IconType = ComponentType<{ className?: string }>;

const ITEMS: {
  href: string;
  label: string;
  Icon: IconType;
  match: (p: string) => boolean;
}[] = [
  { href: '/', label: 'Browse', Icon: BrowseIcon, match: (p) => p === '/' || p.startsWith('/artwork') },
  { href: '/search', label: 'Search', Icon: SearchIcon, match: (p) => p.startsWith('/search') },
  { href: '/collections', label: 'Collections', Icon: CollectionsIcon, match: (p) => p.startsWith('/collections') },
  { href: '/studio', label: 'Studio', Icon: StudioIcon, match: (p) => p.startsWith('/studio') },
  { href: '/library', label: 'Library', Icon: LibraryIcon, match: (p) => p.startsWith('/library') },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon, match: (p) => p.startsWith('/settings') },
];

export default function NavRail() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top bar — wordmark + quick search */}
      <header className="flex items-center justify-between border-b border-stone px-5 py-4 md:hidden">
        <Link
          href="/"
          className="font-editorial text-2xl tracking-tight text-ink"
          aria-label="Framio — home"
        >
          Framio
        </Link>
        <Link
          href="/search"
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center text-xl text-ink-soft transition-colors hover:text-ink"
        >
          <SearchIcon />
        </Link>
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
            {ITEMS.map(({ href, label, Icon, match }) => {
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
      </aside>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-stone bg-paper/95 backdrop-blur md:hidden"
      >
        {ITEMS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[0.62rem] uppercase tracking-label transition-colors duration-300 ease-gallery ${
                active ? 'text-brass' : 'text-ink-soft'
              }`}
            >
              <span className="text-lg">
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
