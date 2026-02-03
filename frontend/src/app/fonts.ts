import localFont from 'next/font/local';

export const geistSans = localFont({
  src: '../../public/fonts/geist/geist-sans/Geist-Variable.woff2',
  variable: '--font-geist-sans',
  display: 'swap',
  preload: false,
});

export const geistMono = localFont({
  src: '../../public/fonts/geist/geist-mono/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  display: 'swap',
  preload: false,
});
