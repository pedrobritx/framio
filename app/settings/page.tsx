import Link from 'next/link';
import ThemeSetting from '@/components/ThemeSetting';
import FrameSetting from '@/components/FrameSetting';
import { MUSEUMS } from '@/lib/museums';

function Field({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-t border-stone py-4">
      <div>
        <p className="text-sm">{label}</p>
        {note && <p className="mt-1 text-xs text-ink-soft">{note}</p>}
      </div>
      <p className="shrink-0 text-sm text-ink-soft">{value}</p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-2xl px-6 py-10 md:px-10 md:py-16">
      <p className="eyebrow">Your museum</p>
      <h1 className="mt-2 font-editorial text-4xl md:text-5xl">Settings</h1>

      <section className="mt-10">
        <h2 className="mb-1 text-xs uppercase tracking-label text-brass-text">Frame</h2>
        <FrameSetting />
        <Field
          label="Frame Bridge"
          value="Phase 2"
          note="Auto-push to Art Mode over your home network."
        />
      </section>

      <section className="mt-12">
        <h2 className="mb-1 text-xs uppercase tracking-label text-brass-text">Appearance</h2>
        <ThemeSetting />
      </section>

      <section className="mt-12">
        <h2 className="mb-1 text-xs uppercase tracking-label text-brass-text">About</h2>
        <div className="border-t border-stone py-4">
          <p className="text-sm">Sources</p>
          <p className="mt-1 text-xs text-ink-soft">
            Open access · public domain / CC0
          </p>
          <p className="mt-2 flex flex-wrap gap-x-1.5 gap-y-1 text-sm text-ink-soft">
            {MUSEUMS.map((m, i) => (
              <span key={m.url} className="inline-flex items-center gap-1.5">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink transition-colors hover:text-brass-text"
                >
                  {m.short}
                </a>
                {i < MUSEUMS.length - 1 && (
                  <span aria-hidden className="text-ink-soft">
                    ·
                  </span>
                )}
              </span>
            ))}
          </p>
        </div>
        <Field label="Version" value="0.1" />
        <Link
          href="/about"
          className="flex items-baseline justify-between gap-6 border-t border-stone py-4 text-sm text-ink transition-colors hover:text-brass-text"
        >
          <span>Manifesto, license &amp; credits</span>
          <span className="shrink-0 text-ink-soft">→</span>
        </Link>
      </section>
    </div>
  );
}
