export default function Placeholder({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-2xl px-6 py-10 md:px-10 md:py-16">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 font-editorial text-4xl md:text-5xl">{title}</h1>
      <p className="mt-5 leading-relaxed text-ink-soft">{body}</p>
      <p className="mt-8 text-xs uppercase tracking-label text-brass">
        Arriving in the MVP build
      </p>
    </div>
  );
}
