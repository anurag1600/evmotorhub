import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const station = await getStation(params.slug);
  if (!station) {
    return {
      title: 'Charging Station Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${station.name} — EV Charging Station in ${station.city}`;
  const description = `${station.name} in ${station.address}, ${station.city}. ${station.total_chargers} chargers (${station.power_kw} kW), ${station.connector_types?.join(', ') || 'multiple connectors'}. ${station.operating_hours}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/charging-stations/${station.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
    },
  };
}

export default async function ChargingStationDetailPage({ params }: { params: { slug: string } }) {
  const station = await getStation(params.slug);
  if (!station) notFound();
  return <ChargingStationDetailClient station={station} />;
}
