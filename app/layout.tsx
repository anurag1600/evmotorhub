import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { supabase } from '@/lib/supabase';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

async function getSeoSettings() {
  try {
    const { data } = await supabase.from('seo_settings').select('*').maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();

  const siteName = seo?.site_name || 'EVMotorHub';
  const metaTitle = seo?.meta_title || "EVMotorHub — India's #1 EV Marketplace";
  const metaDescription = seo?.meta_description || 'Discover, compare, and research the best electric vehicles in India. EV scooters, bikes, and cars with prices, specs, reviews, and charging station finder.';
  const ogTitle = seo?.og_title || metaTitle;
  const ogDescription = seo?.og_description || metaDescription;
  const ogImage = seo?.default_og_image || '/EV_logo_White.png';
  const twitterHandle = seo?.twitter_handle || '@evmotorhub';
  const favicon = seo?.favicon_url || '/Fav_(1).png';

  return {
    metadataBase: new URL('https://evmotorhub.in'),
    title: {
      default: metaTitle,
      template: `%s | ${siteName}`,
    },
    description: metaDescription,
    keywords: ['electric vehicles India', 'EV scooter', 'electric bike', 'EV car', 'EV price', 'EV range', 'electric scooter price India', 'best EV India'],
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: favicon,
    },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: 'https://evmotorhub.in',
      siteName,
      title: ogTitle,
      description: ogDescription,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
      creator: twitterHandle,
      site: twitterHandle,
    },
    verification: seo?.google_search_console_id ? {
      google: seo.google_search_console_id,
    } : undefined,
  };
}

function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'EVMotorHub',
    'url': 'https://evmotorhub.in',
    'logo': 'https://evmotorhub.in/EV_logo_White.png',
    'description': "India's most trusted EV marketplace. Compare electric vehicles, find charging stations, calculate EMI.",
    'sameAs': [],
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'customer service',
      'availableLanguage': 'English',
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={inter.variable}>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <OrganizationSchema />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
