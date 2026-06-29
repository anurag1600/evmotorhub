import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 86400;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { data: seo } = await supabase.from('seo_settings').select('*').maybeSingle();

  const disallowPaths = ['/admin/'];
  if (seo?.index_search === false) disallowPaths.push('/vehicles?q=');
  if (seo?.index_comparisons === false) disallowPaths.push('/compare');

  const sitemapUrl = seo?.sitemap_enabled === false
    ? undefined
    : `${(seo?.canonical_url || 'https://evmotorhub.com').replace(/\/$/, '')}/sitemap.xml`;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: disallowPaths,
    },
    sitemap: sitemapUrl,
  };
}
