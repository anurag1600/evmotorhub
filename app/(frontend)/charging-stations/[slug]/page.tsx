import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSeoSettings, buildCanonicalUrl, buildNoindexMeta } from '@/lib/seo';
import { DetailBreadcrumbs } from '@/components/Breadcrumbs';
import ChargingStationDetailClient from './ChargingStationDetailClient';

export const revalidate = 3600;

async function getStation(slug: string) {
  const { data, error } = await supabase
    .from('charging_stations')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from('charging_stations')
    .select('slug')
    .not('slug', 'is', null);
  return (data || []).map((s: any) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const [station, seo] = await Promise.all([
    getStation(params.slug),
    getSeoSettings(),
  ]);

  if (!station) {
    return {
      title: 'Charging Station Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${station.name} — EV Charging Station in ${station.city}`;
  const description = `${station.name} at ${station.address}, ${station.city}, ${station.state}. ${station.total_chargers} chargers (${station.power_kw} kW), ${station.connector_types?.join(', ') || 'multiple connectors'}. ${station.operating_hours}. Get directions and check availability.`;

  return {
    title,
    description,
    ...buildCanonicalUrl(`/charging-stations/${station.slug}`, seo),
    ...buildNoindexMeta('charging_station_detail', seo),
    openGraph: {
      title,
      description,
      type: 'article',
    },
  };
}

async function getDetailData(slug: string) {
  const station = await getStation(slug);
  if (!station) return null;

  const [sectionsRes, nearbyRes, newsRes, vehiclesRes] = await Promise.all([
    supabase.from('homepage_sections').select('*').eq('page', 'charging_station_detail').order('sort_order', { ascending: true }),
    supabase.from('charging_stations').select('*').eq('city', station.city).neq('id', station.id).limit(6),
    supabase.from('news').select('id, title, slug, excerpt, image_url, category, author, author_image, published_at, read_time_mins, tags, status').eq('status', 'published').order('published_at', { ascending: false }).limit(4),
    supabase.from('vehicles').select('id, name, slug, type, segment, price_min, range_km, top_speed_kmh, battery_capacity_kwh, charging_time_hrs, image_url, is_featured, is_latest, is_upcoming, status, manufacturers(name, slug)').eq('status', 'published').or('is_featured.eq.true,is_latest.eq.true').limit(4),
  ]);

  // If not enough nearby in same city, get nearby in same state
  let nearby = nearbyRes.data || [];
  if (nearby.length < 3 && station.state) {
    const excludeIds = nearby.map((s: any) => s.id);
    let stateQuery = supabase
      .from('charging_stations')
      .select('*')
      .eq('state', station.state)
      .neq('id', station.id)
      .limit(6 - nearby.length);
    if (excludeIds.length > 0) {
      stateQuery = stateQuery.not('id', 'in', `(${excludeIds.map(id => `'${id}'`).join(',')})`);
    }
    const { data: stateStations } = await stateQuery;
    if (stateStations) nearby = [...nearby, ...stateStations];
  }

  return {
    station,
    sections: sectionsRes.data || [],
    nearby: nearby as any[],
    news: newsRes.data || [],
    vehicles: vehiclesRes.data || [],
  };
}

export default async function ChargingStationDetailPage({ params }: { params: { slug: string } }) {
  const data = await getDetailData(params.slug);
  if (!data) notFound();

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: data.station.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.station.address,
      addressLocality: data.station.city,
      addressRegion: data.station.state,
      addressCountry: 'IN',
    },
    telephone: data.station.phone_support || undefined,
    openingHours: data.station.operating_hours,
  };

  if (data.station.lat && data.station.lng) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: data.station.lat,
      longitude: data.station.lng,
    };
  }

  return (
    <>
      <DetailBreadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Charging Stations', href: '/charging-stations' },
        { label: data.station.state, href: `/charging-stations?state=${encodeURIComponent(data.station.state)}` },
        { label: data.station.city, href: `/charging-stations?city=${encodeURIComponent(data.station.city)}` },
        { label: data.station.name },
      ]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ChargingStationDetailClient
        station={data.station}
        sections={data.sections}
        nearby={data.nearby}
        news={data.news as any}
        vehicles={data.vehicles as any}
      />
    </>
  );
}
