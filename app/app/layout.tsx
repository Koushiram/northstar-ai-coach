import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  title: 'Northstar — Your personal AI coach',
  description: 'A calm, adaptive command centre for your priorities, time, money, and wellbeing.',
  openGraph: {
    title: 'Northstar — Your personal AI coach',
    description: 'Plan your priorities, time, money, and wellbeing.',
    images: [{ url: '/og.png', width: 1792, height: 933, alt: 'Northstar personal AI coach' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Northstar — Your personal AI coach',
    description: 'Plan your priorities, time, money, and wellbeing.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
