import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://evmotorhub.com';

  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${baseUrl}/vehicles`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.8 },
    { url: `${baseUrl}/manufacturers`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/emi-calculator`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${baseUrl}/charging-stations`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.5 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.4 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
    { url: `${baseUrl}/disclaimer`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.2 },
  ];

  try {
    const [vehiclesRes, newsRes, manufacturersRes] = await Promise.all([
      supabase.from('vehicles').select('slug, updated_at').eq('status', 'published'),
      supabase.from('news').select('slug, published_at').eq('status', 'published'),
      supabase.from('manufacturers').select('slug'),
    ]);

    const vehicleRoutes = (vehiclesRes.data || []).map((v: any) => ({
      url: `${baseUrl}/vehicles/${v.slug}`,
      lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    const newsRoutes = (newsRes.data || []).map((n: any) => ({
      url: `${baseUrl}/news/${n.slug}`,
      lastModified: n.published_at ? new Date(n.published_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    const manufacturerRoutes = (manufacturersRes.data || []).map((m: any) => ({
      url: `${baseUrl}/manufacturers/${m.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...vehicleRoutes, ...newsRoutes, ...manufacturerRoutes];
  } catch {
    return staticRoutes;
  }
}
