import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import '../styles/tokens.css';
import './globals.css';
import NavRail from '@/components/NavRail';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-editorial',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://pedrobritx.github.io/framio/'),
  title: 'Framio — Your personal museum',
  description: 'Curated art for your Samsung Frame TV.',
  openGraph: {
    title: 'Framio — Your personal museum',
    description: 'Curated art for your Samsung Frame TV.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  // Extend under the iOS home indicator so the bottom bar can sit on the
  // safe-area inset instead of floating as the browser chrome shows/hides.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf7' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1c' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="bg-paper text-ink font-ui antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="min-h-screen md:flex">
          <NavRail />
          <main
            id="main"
            className="min-w-0 flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0"
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
