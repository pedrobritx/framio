import type { Metadata } from 'next';
import Watch from '@/components/Watch';

export const metadata: Metadata = {
  title: 'Watch · Framio',
  description:
    'An ambient, full-screen gallery — your art, rotating slowly, credits always shown.',
};

export default function WatchPage() {
  return <Watch />;
}
