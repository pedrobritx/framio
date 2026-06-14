import { TARGET } from '@/lib/frame';
import ThemeSetting from '@/components/ThemeSetting';

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
      <p className="eyebrow">Settings</p>
      <h1 className="mt-2 font-editorial text-4xl md:text-5xl">Preferences</h1>

      <section className="mt-10">
        <h2 className="mb-1 text-xs uppercase tracking-label text-brass">Frame</h2>
        <Field label="Your TV" value="55″ · The Frame" />
        <Field
          label="Output"
          value={`${TARGET.width}×${TARGET.height} · sRGB`}
          note="Every Frame is 16:9 — size doesn't change the proportion."
        />
        <Field
          label="Frame Bridge"
          value="Phase 2"
          note="Auto-push to Art Mode over your home network."
        />
      </section>

      <section className="mt-12">
        <h2 className="mb-1 text-xs uppercase tracking-label text-brass">Appearance</h2>
        <ThemeSetting />
      </section>

      <section className="mt-12">
        <h2 className="mb-1 text-xs uppercase tracking-label text-brass">About</h2>
        <Field label="Sources" value="The Met · Art Institute of Chicago · Cleveland · CC0" />
        <Field label="Version" value="0.1" />
      </section>
    </div>
  );
}
