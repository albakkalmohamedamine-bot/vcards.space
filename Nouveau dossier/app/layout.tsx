import type {Metadata} from 'next';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans-custom',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif-custom',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-custom',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VCARDS SPACE • Premium NFC Digital Business Cards',
  description: 'Deploy and manage modern high-converting landing pages and business cards for your NFC clients under the VCARDS SPACE ecosystem.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VCARDS SPACE',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="antialiased bg-slate-50 min-h-screen text-slate-800 font-sans">
        {children}
      </body>
    </html>
  );
}


