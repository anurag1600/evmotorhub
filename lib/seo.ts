import { supabase } from '@/lib/supabase';
import { Metadata } from 'next';

let cachedSeo: Record<string, any> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60000;

export async function getSeoSettings() {
  const now = Date.now();
  if (cachedSeo && now - cacheTime < CACHE_TTL) return cachedSeo;
  try {
    const { data } = await supabase.from('seo_settings').select('*').maybeSingle();
    cachedSeo = data as Record<string, any> | null;
    cacheTime = now;
    return cachedSeo;
  } catch {
    return null;
  }
}

export function buildNoindexMeta(section: string, seo: Record<string, any> | null): Pick<Metadata, 'robots'> {
  if (!seo) return {};
  const key = `index_${section}`;
  if (seo[key] === false) {
    return { robots: { index: false, follow: true } };
  }
  return {};
}

export function buildCanonicalUrl(path: string, seo: Record<string, any> | null): Pick<Metadata, 'alternates'> {
  const base = (seo?.canonical_url || 'https://evmotorhub.in').replace(/\/$/, '');
  const url = `${base}${path}`;
  return { alternates: { canonical: url } };
}
