import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Editorial display serif for "The Brief" art direction. The optical-size axis gives the
// hero its letterpress character at display sizes without a second font file.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
});

// Document voice: brief entries, micro-labels, act numerals. Two weights only.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bytesizedcareers.com'),
  title: 'ByteSized Careers — Your brief for creator-economy work & talent',
  description:
    'Creator-economy hiring happens in scattered posts, DMs and referrals. ByteSized Careers turns your intent into a structured brief and matches it. Join the founding cohort.',
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: '/brand/bytesized-careers-mark.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/brand/bytesized-careers-mark-apple.png', type: 'image/png' }],
  },
  openGraph: {
    title: 'ByteSized Careers — Early access',
    description:
      'Tell us what you do or who you need. We turn it into a brief worth matching.',
    type: 'website',
    images: [
      {
        url: '/brand/bytesized-careers-og.png',
        width: 1200,
        height: 630,
        alt: 'ByteSized Careers — your brief for creator-economy work and talent',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ByteSized Careers — Early access',
    description: 'Tell us what you do or who you need. We turn it into a brief worth matching.',
    images: ['/brand/bytesized-careers-og.png'],
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
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
