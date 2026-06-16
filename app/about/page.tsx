import type { Metadata } from 'next';
import {
  CoffeeIcon,
  ExternalLinkIcon,
  GitHubIcon,
  LinkedInIcon,
} from '@/components/icons';
import { MUSEUMS } from '@/lib/museums';

export const metadata: Metadata = {
  title: 'About · Framio',
  description:
    'Why Framio exists, who made it, and the open collections and license behind it.',
};

const LINKS: {
  href: string;
  label: string;
  note: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    href: 'https://github.com/pedrobritx/framio',
    label: 'Source on GitHub',
    note: 'pedrobritx/framio',
    Icon: GitHubIcon,
  },
  {
    href: 'https://www.linkedin.com/in/pedrobritx/',
    label: 'LinkedIn',
    note: 'in/pedrobritx',
    Icon: LinkedInIcon,
  },
  {
    href: 'https://pedrobritx.github.io/EwP/',
    label: 'Personal site',
    note: 'pedrobritx.github.io/EwP',
    Icon: ExternalLinkIcon,
  },
  {
    href: 'https://buymeacoffee.com/pedrobritx',
    label: 'Buy me a coffee',
    note: 'Support the project',
    Icon: CoffeeIcon,
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-2xl px-6 py-10 md:px-10 md:py-16">
      <p className="eyebrow">About</p>
      <h1 className="mt-2 font-editorial text-4xl md:text-5xl">Framio</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-soft">
        A personal museum for your wall — and a calm place to wander the open
        collections of the world.
      </p>

      <section className="mt-12">
        <h2 className="mb-3 text-xs uppercase tracking-label text-brass">
          Manifesto
        </h2>
        <div className="space-y-4 font-editorial text-lg leading-relaxed text-ink">
          <p>
            Framio began with a simple want: beautiful art on my own television.
            The Samsung Frame turns a screen into a canvas, but filling it meant
            hunting for high-resolution public-domain images, cropping them by
            hand to 16:9, and losing quality along the way.
          </p>
          <p>
            So I built the tool I wished existed — and then it grew. What started
            as a way to dress one screen became a gallery-like hub for anyone: a
            single place to discover the open collections of the world&apos;s
            great museums, curate your own rotating exhibitions, and frame any
            work for your wall.
          </p>
          <p>
            It is not a wallpaper manager. It is a quiet curator that lives
            between the museum and your room.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-xs uppercase tracking-label text-brass">
          Open &amp; free
        </h2>
        <p className="leading-relaxed text-ink">
          Framio is open source under the{' '}
          <a
            href="https://github.com/pedrobritx/framio/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
            className="text-brass underline-offset-2 hover:underline"
          >
            MIT License
          </a>
          . Use it, fork it, build on it — anyone can. The only rule is to keep
          the credit to the developer, Pedro Brito.
        </p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          The artwork itself is open access — public domain or CC0 — sourced
          directly from the museums&apos; own programs. Framio shows only works it
          can source under open licenses; in-copyright pieces are surfaced for
          discovery, not download.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-xs uppercase tracking-label text-brass">
          Collections
        </h2>
        <ul className="space-y-1">
          {MUSEUMS.map((m) => (
            <li key={m.url}>
              <a
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between gap-4 border-t border-stone py-3 text-sm text-ink transition-colors hover:text-brass"
              >
                <span>{m.full}</span>
                <ExternalLinkIcon className="shrink-0 text-sm text-ink-soft opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-xs uppercase tracking-label text-brass">
          Links &amp; support
        </h2>
        <ul className="space-y-1">
          {LINKS.map(({ href, label, note, Icon }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 border-t border-stone py-4 transition-colors hover:text-brass"
              >
                <Icon className="shrink-0 text-xl text-ink-soft transition-colors group-hover:text-brass" />
                <span className="flex-1">
                  <span className="block text-sm text-ink group-hover:text-brass">
                    {label}
                  </span>
                  <span className="block text-xs text-ink-soft">{note}</span>
                </span>
                <ExternalLinkIcon className="shrink-0 text-sm text-ink-soft opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-14 text-xs text-ink-soft">
        Built by Pedro Brito · Open source (MIT) · {new Date().getFullYear()}
      </p>
    </div>
  );
}
