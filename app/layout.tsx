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
    return data as Record<string, any> | null;
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
  const ogImage = seo?.default_og_image || '/EV_logo_White.webp';
  const twitterHandle = seo?.twitter_handle || '@evmotorhub';
  const twitterCard = (seo?.twitter_card as 'summary' | 'summary_large_image') || 'summary_large_image';
  const favicon = seo?.favicon_url || '/Fav_(1).png';
  const canonicalUrl = seo?.canonical_url || 'https://evmotorhub.in';

  return {
    metadataBase: new URL(canonicalUrl.replace(/\/$/, '')),
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
    alternates: {
      canonical: canonicalUrl.replace(/\/$/, ''),
    },
    icons: {
      icon: favicon,
    },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: canonicalUrl.replace(/\/$/, ''),
      siteName,
      title: ogTitle,
      description: ogDescription,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: twitterCard,
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

function OrganizationSchema({ seo }: { seo: Record<string, any> }) {
  const siteName = seo?.site_name || 'EVMotorHub';
  const canonicalUrl = (seo?.canonical_url || 'https://evmotorhub.in').replace(/\/$/, '');

  const sameAs = [
    seo?.social_facebook,
    seo?.social_instagram,
    seo?.social_twitter,
    seo?.social_linkedin,
    seo?.social_youtube,
  ].filter(Boolean);

  const orgData = seo?.schema_organization || {};

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': orgData.name || siteName,
    'url': canonicalUrl,
    'logo': orgData.logo || `${canonicalUrl}/EV_logo_White.webp`,
    'description': orgData.description || seo?.site_description || "India's most trusted EV marketplace. Compare electric vehicles, find charging stations, calculate EMI.",
    'sameAs': sameAs.length > 0 ? sameAs : undefined,
    'contactPoint': orgData.contactPoint || {
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

function WebsiteSchema({ seo }: { seo: Record<string, any> }) {
  if (!seo?.schema_website) return null;

  const siteName = seo?.site_name || 'EVMotorHub';
  const canonicalUrl = (seo?.canonical_url || 'https://evmotorhub.in').replace(/\/$/, '');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': siteName,
    'url': canonicalUrl,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${canonicalUrl}/vehicles?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function GoogleAnalyticsScript({ id }: { id: string }) {
  if (!id) return null;
  return (
    <>
      <script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} async />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`,
        }}
      />
    </>
  );
}

function GTMHeadScript({ id }: { id: string }) {
  if (!id) return null;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`,
      }}
    />
  );
}

function GTMBodyScript({ id }: { id: string }) {
  if (!id) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${id}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}

function MetaPixelScript({ id }: { id: string }) {
  if (!id) return null;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`,
      }}
    />
  );
}

function ClarityScript({ id }: { id: string }) {
  if (!id) return null;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${id}");`,
      }}
    />
  );
}

function GoogleAdsScript({ id }: { id: string }) {
  if (!id) return null;
  return (
    <script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
  );
}

function CustomHeadScripts({ html }: { html: string }) {
  if (!html?.trim()) return null;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function CustomFooterScripts({ html }: { html: string }) {
  if (!html?.trim()) return null;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const seo = await getSeoSettings();

  const gtmId = (seo?.gtm_id as string) || '';
  const gaId = (seo?.google_analytics_id as string) || '';
  const metaPixelId = (seo?.meta_pixel_id as string) || '';
  const clarityId = (seo?.clarity_id as string) || '';
  const googleAdsId = (seo?.google_ads_id as string) || '';
  const customHead = (seo?.custom_head_scripts as string) || '';
  const customFooter = (seo?.custom_footer_scripts as string) || '';

  return (
    <html lang="en-IN" className={inter.variable}>
      <head>
        <OrganizationSchema seo={seo || {}} />
        <WebsiteSchema seo={seo || {}} />
        <GoogleAnalyticsScript id={gaId} />
        <GTMHeadScript id={gtmId} />
        <MetaPixelScript id={metaPixelId} />
        <ClarityScript id={clarityId} />
        <GoogleAdsScript id={googleAdsId} />
        <CustomHeadScripts html={customHead} />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <GTMBodyScript id={gtmId} />
        {children}
        <CustomFooterScripts html={customFooter} />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
