import type { Metadata, Viewport } from 'next';
import * as React from 'react';
import { Nav } from '@/components/layout/nav';
import { Footer } from '@/components/layout/footer';
import { Providers } from '@/components/providers';
import { SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} — Custom Kart Graphics`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Custom Kart Graphics`,
    description: SITE_DESCRIPTION,
    url: getSiteUrl(),
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Custom Kart Graphics`,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <Providers>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
