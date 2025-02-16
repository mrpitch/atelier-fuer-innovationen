
import type { ReactNode } from 'react';

import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';

import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
});

import { Footer } from '@/app/_components/footer';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
        <Footer />
      </body>
    </html>
  );
}


