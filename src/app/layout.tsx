import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ByteSized Careers — Early access to creator-economy work & talent',
  description:
    'Join the ByteSized Careers waitlist. Find creator-economy work and talent without relying on scattered posts, DMs and referrals. Get early access before public launch.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'ByteSized Careers — Early access',
    description:
      'Find creator-economy work and talent without relying on scattered posts, DMs and referrals.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0d12',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
