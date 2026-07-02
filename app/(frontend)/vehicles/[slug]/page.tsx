import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Vehicle, VehicleVariant } from '@/lib/types';
import { formatPrice, formatPriceRange, getVehicleTypeLabel, getSegmentLabel } from '@/lib/format';
import { getSeoSettings, buildNoindexMeta, buildCanonicalUrl } from '@/lib/seo';
import VehicleDetailClient from '@/components/VehicleDetailClient';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const [seo, { data }] = await Promise.all([
    getSeoSettings(),
    supabase.from('vehicles').select('*, manufacturers(name)').eq('slug', params.slug).maybeSingle(),
  ]);

  if (!data) return { title: 'Vehicle Not Found' };

  const brandName = (data.manufacturers as any)?.name;
  return {
    title: `${data.name} Price, Range, Specs & Reviews in India`,
    description: `${data.name} by ${brandName} — Range: ${data.range_km}km, Price: ${formatPrice(data.price_min)}. Full specs, features, colors, and EMI calculator.`,
    ...buildNoindexMeta('vehicles', seo),
    ...buildCanonicalUrl(`/vehicles/${params.slug}`, seo),
  };
}

function VehicleSchema({ vehicle, manufacturer }: { vehicle: Vehicle & { manufacturers: any }; manufacturer: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': vehicle.name,
    'brand': { '@type': 'Brand', 'name': manufacturer?.name },
    'image': vehicle.image_url,
    'description': vehicle.description,
    'offers': {
      '@type': 'Offer',
      'priceCurrency': 'INR',
      'price': vehicle.price_min,
      'availability': vehicle.is_upcoming ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock',
    },
    'additionalProperty': [
      { '@type': 'PropertyValue', 'name': 'Range', 'value': `${vehicle.range_km} km` },
      { '@type': 'PropertyValue', 'name': 'Top Speed', 'value': `${vehicle.top_speed_kmh} km/h` },
      { '@type': 'PropertyValue', 'name': 'Battery Capacity', 'value': `${vehicle.battery_capacity_kwh} kWh` },
      { '@type': 'PropertyValue', 'name': 'Charging Time', 'value': `${vehicle.charging_time_hrs} hrs` },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function BreadcrumbSchema({ vehicle, manufacturer }: { vehicle: Vehicle & { manufacturers: any }; manufacturer: any }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://evmotorhub.in' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Vehicles', 'item': 'https://evmotorhub.in/vehicles' },
      { '@type': 'ListItem', 'position': 3, 'name': getVehicleTypeLabel(vehicle.type), 'item': `https://evmotorhub.in/vehicles?type=${vehicle.type}` },
      { '@type': 'ListItem', 'position': 4, 'name': vehicle.name },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

async function getVehicle(slug: string) {
  const { data } = await supabase
    .from('vehicles')
    .select('id, name, slug, type, segment, price_min, price_max, range_km, top_speed_kmh, charging_time_hrs, battery_capacity_kwh, motor_power_kw, image_url, image_gallery, gallery_urls, video_url, description, is_upcoming, is_latest, is_featured, launch_date, colors, specifications, features, pros, cons, related_news_ids, similar_vehicle_ids, default_variant_id, manufacturers(*)')
    .eq('slug', slug)
    .maybeSingle();
  return data as (Vehicle & { manufacturers: any }) | null;
}

async function getVehicleVariants(vehicleId: string) {
  const { data } = await supabase
    .from('vehicle_variants')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('sort_order', { ascending: true });
  return (data || []) as VehicleVariant[];
}

async function getSimilarVehicles(type: string, excludeId: string) {
  const { data } = await supabase
    .from('vehicles')
    .select('id, name, slug, type, segment, price_min, price_max, range_km, image_url, is_upcoming, is_latest, manufacturers(name, slug)')
    .eq('type', type)
    .neq('id', excludeId)
    .limit(4);
  return (data || []) as any[];
}

export default async function VehicleDetailPage({ params }: { params: { slug: string } }) {
  const vehicle = await getVehicle(params.slug);
  if (!vehicle) notFound();

  const [similar, seo, variants] = await Promise.all([
    getSimilarVehicles(vehicle.type, vehicle.id),
    getSeoSettings(),
    getVehicleVariants(vehicle.id),
  ]);
  const manufacturer = vehicle.manufacturers;

  return (
    <>
      <VehicleSchema vehicle={vehicle} manufacturer={manufacturer} />
      {seo?.schema_breadcrumb !== false && <BreadcrumbSchema vehicle={vehicle} manufacturer={manufacturer} />}
      <VehicleDetailClient
        vehicle={vehicle}
        variants={variants}
        similar={similar}
      />
    </>
  );
}
