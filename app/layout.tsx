import type { Metadata } from 'next';
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
          <main id="main" className="min-w-0 flex-1 pb-24 md:pb-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
