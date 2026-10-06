import { Metadata } from 'next';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { getSeoSettings, buildCanonicalUrl, buildNoindexMeta } from '@/lib/seo';
import ChargingStationsClient from './ChargingStationsClient';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  const title = 'EV Charging Stations in India — Find EV Chargers Near You';
  const description = 'Browse EV charging stations across India. Filter by state, city, connector type and status. Find CCS2, CHAdeMO, Type 2 AC chargers with real-time availability, power ratings and directions.';

  return {
    title,
    description,
    ...buildCanonicalUrl('/charging-stations', seo),
    ...buildNoindexMeta('charging_stations', seo),
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

async function getPageData() {
  const [sectionsRes, statsRes] = await Promise.all([
    supabase.from('homepage_sections').select('*').eq('page', 'charging_stations').order('sort_order', { ascending: true }),
    supabase.from('charging_stations').select('city, state, total_chargers, status').in('status', ['active', 'coming_soon']),
  ]);

  const sections = sectionsRes.data || [];
  const statsData = statsRes.data || [];
  const uniqueCities = new Set(statsData.map((s: any) => s.city).filter(Boolean));
  const uniqueStates = new Set(statsData.map((s: any) => s.state).filter(Boolean));
  const stats = {
    stations: statsData.length,
    cities: uniqueCities.size,
    chargers: statsData.reduce((a: number, s: any) => a + (s.total_chargers || 0), 0),
    states: uniqueStates.size,
  };

  return { sections, stats };
}

export default async function ChargingStationsPage() {
  const { sections, stats } = await getPageData();
  return (
    <Suspense fallback={<div className="bg-gray-50 min-h-screen" />}>
      <ChargingStationsClient sections={sections} stats={stats} />
    </Suspense>
  );
}
