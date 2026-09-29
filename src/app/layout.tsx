import type { Metadata } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/lib/store';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const serif = Instrument_Serif({
  subsets: ['latin'], weight: '400', style: ['normal', 'italic'],
  variable: '--font-serif', display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tokuma — Circular Economy Intelligence',
  description:
    'Measure circularity, discover value, design the next lifecycle. Tokuma connects material flows, waste reduction, lifecycle performance and financial impact into one platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-bone-100 antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
