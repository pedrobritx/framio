import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import '../styles/tokens.css';
import './globals.css';
import NavRail from '@/components/NavRail';
import ScrollReset from '@/components/ScrollReset';
import { THEME_BOOT_SCRIPT } from '@/components/ThemeToggle';

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="bg-paper text-ink font-ui antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ScrollReset />
        {/* Fixed-height app shell: the content pane scrolls internally so the
            mobile bottom bar lives in normal flow and never floats over the
            page as the iOS browser chrome shows and hides. */}
        <div className="flex h-[100dvh] flex-col md:flex-row">
          <NavRail />
          <main
            id="main"
            className="order-2 min-w-0 flex-1 overflow-y-auto md:order-none"
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
