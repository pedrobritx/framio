'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Browse', match: (p: string) => p === '/' || p.startsWith('/artwork') },
  { href: '/collections', label: 'Collections', match: (p: string) => p.startsWith('/collections') },
  { href: '/studio', label: 'Frame Studio', match: (p: string) => p.startsWith('/studio') },
  { href: '/library', label: 'Library', match: (p: string) => p.startsWith('/library') },
  { href: '/settings', label: 'Settings', match: (p: string) => p.startsWith('/settings') },
];

export default function NavRail() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-stone md:h-screen md:w-56 md:shrink-0 md:border-b-0 md:border-r md:sticky md:top-0">
      <div className="flex items-center justify-between gap-6 px-6 py-5 md:flex-col md:items-start md:gap-10 md:py-8">
        <Link href="/" className="font-editorial text-2xl tracking-tight text-ink">
          Framio
        </Link>
        <nav>
          <ul className="flex items-center gap-5 md:flex-col md:items-start md:gap-3">
            {ITEMS.map((it) => {
              const active = it.match(pathname);
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    className={`text-sm uppercase tracking-label transition-colors duration-300 ease-gallery ${
                      active ? 'text-brass' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
