import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://evmotorhub.in'),
  title: {
    default: 'EVMotorHub — India\'s #1 EV Marketplace',
    template: '%s | EVMotorHub',
  },
  description: 'Discover, compare, and research the best electric vehicles in India. EV scooters, bikes, and cars with prices, specs, reviews, and charging station finder.',
  keywords: ['electric vehicles India', 'EV scooter', 'electric bike', 'EV car', 'EV price', 'EV range', 'electric scooter price India', 'best EV India'],
  authors: [{ name: 'EVMotorHub' }],
  creator: 'EVMotorHub',
  publisher: 'EVMotorHub',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://evmotorhub.in',
    siteName: 'EVMotorHub',
    title: 'EVMotorHub — India\'s #1 EV Marketplace',
    description: 'Discover, compare, and research the best electric vehicles in India.',
    images: [{ url: '/EV_logo_White.png', width: 1200, height: 630, alt: 'EVMotorHub' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EVMotorHub — India\'s #1 EV Marketplace',
    description: 'Discover, compare, and research the best electric vehicles in India.',
    images: ['/EV_logo_White.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={inter.variable}>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1 pt-[100px] md:pt-[108px]">
          {children}
        </main>
        <Footer />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
