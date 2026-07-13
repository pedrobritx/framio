import type { Metadata } from 'next';
import {
  CoffeeIcon,
  ExternalLinkIcon,
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
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
    href: 'mailto:pedrobritx@gmail.com',
    label: 'Send feedback',
    note: 'pedrobritx@gmail.com',
    Icon: MailIcon,
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
        A living museum for every screen — and a calm place to wander the open
        collections of the world.
      </p>

      <section className="mt-12">
        <h2 className="mb-3 text-xs uppercase tracking-label text-brass-text">
          Manifesto
        </h2>
        <p className="mb-4 font-editorial text-xl italic leading-relaxed text-ink">
          Art belongs on the walls of the living.
        </p>
        <div className="space-y-4 font-editorial text-lg leading-relaxed text-ink">
          <p>
            Framio began with a simple want: beautiful art on my own television.
            The Samsung Frame turns a screen into a canvas, but filling it meant
            hunting for high-resolution public-domain images and cropping them by
            hand. So I built the tool I wished existed — and it grew past the one
            screen, into a living, interactive way to make art part of a day: on
            the TV, the phone, the tablet, the desk.
          </p>
          <p>
            We never take credit for others&apos; work. Every piece names its
            maker, and every file Framio exports carries the artist, museum, and
            license embedded inside it — so credit travels with the image
            wherever it goes.
          </p>
          <p>
            Framio works only with art that is genuinely open — public domain or
            CC0, from museums&apos; own programs. What the public funded and time
            returned to everyone belongs to everyone.
          </p>
          <p>
            And access is the point, not an afterthought: open, community-written
            descriptions so art can be met without being seen, and an interface
            that works by remote, by touch, and by keyboard alike. If a person
            cannot experience the art, the museum isn&apos;t really open yet.
          </p>
        </div>
        <a
          href="https://github.com/pedrobritx/framio/blob/main/MANIFESTO.md"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm text-brass-text underline-offset-2 hover:underline"
        >
          Read the full manifesto →
        </a>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-xs uppercase tracking-label text-brass-text">
          Open &amp; free
        </h2>
        <p className="leading-relaxed text-ink">
          Framio is open source under the{' '}
          <a
            href="https://github.com/pedrobritx/framio/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer"
            className="text-brass-text underline-offset-2 hover:underline"
          >
            MIT License
          </a>
          . Use it, fork it, build on it — anyone can. The only rule is to keep
          the credit to the developer, Pedro Brito.
        </p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          The artwork itself is open access — public domain or CC0 — sourced
          directly from the museums&apos; own open-access programs, never
          scraped or repackaged. Framio shows only works it can source under
          open licenses; in-copyright pieces are surfaced for discovery, never
          for download. Are you a museum or gallery?{' '}
          <a
            href="https://github.com/pedrobritx/framio/blob/main/docs/OPEN-ACCESS.md"
            target="_blank"
            rel="noreferrer"
            className="text-brass-text underline-offset-2 hover:underline"
          >
            Open your collection to Framio.
          </a>
        </p>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-xs uppercase tracking-label text-brass-text">
          Collections
        </h2>
        <ul className="space-y-1">
          {MUSEUMS.map((m) => (
            <li key={m.url}>
              <a
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between gap-4 border-t border-stone py-3 text-sm text-ink transition-colors hover:text-brass-text"
              >
                <span>{m.full}</span>
                <ExternalLinkIcon className="shrink-0 text-sm text-ink-soft opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-xs uppercase tracking-label text-brass-text">
          Links &amp; support
        </h2>
        <ul className="space-y-1">
          {LINKS.map(({ href, label, note, Icon }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 border-t border-stone py-4 transition-colors hover:text-brass-text"
              >
                <Icon className="shrink-0 text-xl text-ink-soft transition-colors group-hover:text-brass-text" />
                <span className="flex-1">
                  <span className="block text-sm text-ink group-hover:text-brass-text">
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
