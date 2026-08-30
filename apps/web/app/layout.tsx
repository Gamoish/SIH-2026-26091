import type { Metadata, Viewport } from 'next';
import { SessionProvider } from '@/hooks/use-session';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'दिशा · Disha',
  description: 'Feasibility + government-loan advisor for rural micro-entrepreneurs',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#123B6D',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" data-lang="hi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Devanagari:wght@400;500;600;700&family=IBM+Plex+Serif:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        {/* no global language toggle: the language screen is the picker, and
            after that language is changed from Settings */}
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
