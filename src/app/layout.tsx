import type { Metadata, Viewport } from 'next';
import { Caveat, Cormorant_Garamond, Jost, Playfair_Display, Special_Elite } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'], variable: '--font-cormorant' });
const jost = Jost({ subsets: ['latin'], variable: '--font-jost' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700', '900'], variable: '--font-playfair' });
const specialElite = Special_Elite({ subsets: ['latin'], weight: '400', variable: '--font-special-elite' });
const caveat = Caveat({ subsets: ['latin'], weight: ['700'], variable: '--font-caveat' });

// Every page reads live data from D1 (cached in-process), so render on request.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'WOW — Wide Open World · Global Book & Film Club', template: '%s · Wide Open World' },
  description: 'Two months. One country. A book, a film, a friend. WOW is a global club exploring world cultures one country at a time.',
  icons: { icon: '/wow-expeditions-logo.png', apple: '/wow-expeditions-logo.png' },
  openGraph: { siteName: 'Wide Open World', type: 'website' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b1310' },
    { media: '(prefers-color-scheme: light)', color: '#f5efe3' },
  ],
};

// Applies the saved theme before first paint (no flash).
const themeScript = `try{var t=localStorage.getItem('wow-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${cormorant.variable} ${jost.variable} ${playfair.variable} ${specialElite.variable} ${caveat.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
