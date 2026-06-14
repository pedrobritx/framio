import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-2xl px-6 py-16 md:px-10 md:py-24">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-editorial text-4xl md:text-5xl">
        Off the gallery map
      </h1>
      <p className="mt-5 leading-relaxed text-ink-soft">
        This page isn&apos;t part of the exhibition. The static showcase
        pre-renders a curated set of works — head back to Browse to find the rest.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block bg-ink px-5 py-2.5 text-sm text-paper transition-colors duration-300 ease-gallery hover:bg-brass"
      >
        Return to Browse
      </Link>
    </div>
  );
}
