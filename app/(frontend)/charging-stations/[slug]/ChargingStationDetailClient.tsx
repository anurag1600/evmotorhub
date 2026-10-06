'use client';

import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, Zap, Clock, Wifi, Coffee, Navigation2, Phone, ChevronRight, ArrowLeft, Building2, Newspaper, Car } from 'lucide-react';
import { ChargingStation, HomepageSection, NewsArticle, Vehicle } from '@/lib/types';
import { DetailBreadcrumbs } from '@/components/Breadcrumbs';

type NewsCardData = Pick<NewsArticle, 'id' | 'title' | 'slug' | 'excerpt' | 'image_url' | 'category' | 'author' | 'author_image' | 'published_at' | 'read_time_mins' | 'tags'>;
type VehicleCardData = Pick<Vehicle, 'id' | 'name' | 'slug' | 'type' | 'segment' | 'price_min' | 'range_km' | 'top_speed_kmh' | 'battery_capacity_kwh' | 'charging_time_hrs' | 'image_url' | 'is_featured' | 'is_latest' | 'is_upcoming' | 'status'> & { manufacturers?: { name: string; slug: string } };
import { getStatusColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const VehicleCard = dynamic(() => import('@/components/VehicleCard'), { ssr: false });
const NewsCard = dynamic(() => import('@/components/NewsCard'), { ssr: false });
const AdBanner = dynamic(() => import('@/components/AdBanner'), { ssr: false });

const statusLabels: Record<string, string> = {
  active: 'Open Now',
  coming_soon: 'Coming Soon',
  inactive: 'Closed',
};

interface ChargingStationDetailClientProps {
  station: ChargingStation;
  sections: HomepageSection[];
  nearby: ChargingStation[];
  news: NewsCardData[];
  vehicles: VehicleCardData[];
}

export default function ChargingStationDetailClient({
  station,
  sections,
  nearby,
  news,
  vehicles,
}: ChargingStationDetailClientProps) {
  const sectionMap = useMemo(() => {
    const enabled = sections.filter(s => s.is_enabled);
    return new Map(enabled.map(s => [s.section_key, s.sort_order]));
  }, [sections]);

  const isSectionEnabled = useCallback((key: string) => sectionMap.has(key), [sectionMap]);
  const orderedKeys = useMemo(() => {
    return sections.filter(s => s.is_enabled).sort((a, b) => a.sort_order - b.sort_order).map(s => s.section_key);
  }, [sections]);

  const getAvailabilityColor = (available: number, total: number) => {
    if (!total || total === 0) return 'text-gray-500 bg-gray-50';
    const ratio = available / total;
    if (ratio > 0.5) return 'text-green-600 bg-green-50';
    if (ratio > 0.2) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const generateGoogleMapsUrl = (s: ChargingStation) => {
    if (s.lat && s.lng) {
      return `https://www.google.com/maps?q=${s.lat},${s.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name}, ${s.address}, ${s.city}`)}`;
  };

  const directionsUrl = generateGoogleMapsUrl(station);
  const availPct = station.total_chargers > 0 ? (station.available_chargers / station.total_chargers) * 100 : 0;

  const renderSection = (key: string) => {
    if (!isSectionEnabled(key)) return null;

    switch (key) {
      case 'csd_header':
        return (
          <div key={key} className="bg-gradient-to-r from-[#0a2e14] to-[#145a2c] text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Link href="/charging-stations" className="inline-flex items-center gap-1.5 text-green-200 hover:text-white text-sm mb-4 transition-colors">
                <ArrowLeft size={14} /> All Charging Stations
              </Link>
              <div className="flex items-start gap-3 mb-2">
                <Zap size={28} className="text-green-300 flex-shrink-0 mt-1" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{station.name}</h1>
                  <div className="flex items-center gap-1 text-green-200 text-sm mt-2">
                    <MapPin size={14} className="flex-shrink-0" />
                    <span>{station.address}, {station.city}, {station.state}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', getStatusColor(station.status))}>
                  {statusLabels[station.status] || station.status}
                </span>
                <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', getAvailabilityColor(station.available_chargers, station.total_chargers))}>
                  {station.available_chargers}/{station.total_chargers} chargers available
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-white">
                  <Zap size={10} className="inline mr-1" />{station.power_kw} kW
                </span>
              </div>
            </div>
          </div>
        );

      case 'csd_map':
        return (
          <div key={key} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="h-64 sm:h-80 relative bg-gray-100">
                {station.lat && station.lng ? (
                  <iframe
                    src={`https://www.google.com/maps?q=${station.lat},${station.lng}&z=15&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${station.name} location`}
                    className="absolute inset-0"
                  />
                ) : station.map_embed_url ? (
                  <iframe
                    src={station.map_embed_url}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${station.name} location`}
                    className="absolute inset-0"
                  />
                ) : (
                  <div className="h-full bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin size={40} className="text-[#145a2c] mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Map location not available</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 flex gap-2">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#145a2c] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#0f4020] transition-colors"
                >
                  <Navigation2 size={16} /> Get Directions
                </a>
                {station.phone_support && (
                  <a
                    href={`tel:${station.phone_support}`}
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                  >
                    <Phone size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        );

      case 'csd_details':
        return (
          <div key={key} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Specs */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Station Details</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Operator', value: station.operator },
                      { label: 'Power', value: `${station.power_kw} kW` },
                      { label: 'Chargers', value: station.total_chargers },
                      { label: 'Hours', value: station.operating_hours },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-500 mb-1">{label}</div>
                        <div className="text-sm font-bold text-gray-900">{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Availability */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span className="font-medium">Charger Availability</span>
                      <span className="font-semibold text-[#145a2c]">{station.available_chargers}/{station.total_chargers} free</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                        style={{ width: `${availPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Connectors */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Connector Types</h2>
                  <div className="flex flex-wrap gap-2">
                    {station.connector_types.map(c => (
                      <span key={c} className="flex items-center gap-1.5 text-sm bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-lg">
                        <Zap size={14} />
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                {station.amenities && station.amenities.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Nearby Amenities</h2>
                    <div className="flex flex-wrap gap-2">
                      {station.amenities.map(a => (
                        <span key={a} className="flex items-center gap-1 text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg">
                          {a === 'Cafe' && <Coffee size={14} />}
                          {a === 'WiFi' && <Wifi size={14} />}
                          {!['Cafe', 'WiFi'].includes(a) && <MapPin size={14} />}
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                {(station.price_per_kwh || station.fast_charging) && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Pricing</h2>
                    <div className="flex flex-wrap gap-3">
                      {station.price_per_kwh && (
                        <span className="text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg font-medium">
                          Rs. {station.price_per_kwh}/kWh
                        </span>
                      )}
                      {station.fast_charging && (
                        <span className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                          <Zap size={12} /> Fast Charging
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-600">Status</span>
                    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', getStatusColor(station.status))}>
                      {statusLabels[station.status] || station.status}
                    </span>
                  </div>
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#145a2c] text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-[#0f4020] transition-colors"
                  >
                    <Navigation2 size={16} /> Get Directions
                  </a>
                  {station.phone_support && (
                    <a
                      href={`tel:${station.phone_support}`}
                      className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-800 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors mt-2"
                    >
                      <Phone size={16} /> {station.phone_support}
                    </a>
                  )}
                </div>

                <Link
                  href="/charging-stations"
                  className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-green-200 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-[#145a2c]">Browse all stations</span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-[#145a2c]" />
                  </div>
                </Link>

                {/* Quick city/state links */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Explore More</h3>
                  <div className="space-y-2">
                    <Link
                      href={`/charging-stations?city=${encodeURIComponent(station.city)}`}
                      className="flex items-center justify-between text-sm text-gray-600 hover:text-[#145a2c] group"
                    >
                      <span className="flex items-center gap-2"><MapPin size={14} /> Stations in {station.city}</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-[#145a2c]" />
                    </Link>
                    <Link
                      href={`/charging-stations?state=${encodeURIComponent(station.state)}`}
                      className="flex items-center justify-between text-sm text-gray-600 hover:text-[#145a2c] group"
                    >
                      <span className="flex items-center gap-2"><Building2 size={14} /> Stations in {station.state}</span>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-[#145a2c]" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'csd_ad_sidebar':
        return (
          <div key={key} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <AdBanner position="charging_station_detail_sidebar" className="mx-auto" />
          </div>
        );

      case 'csd_ad_bottom':
        return (
          <div key={key} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <AdBanner position="charging_station_detail_bottom" className="mx-auto" />
          </div>
        );

      case 'csd_nearby':
        return nearby.length > 0 ? (
          <div key={key} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={20} className="text-[#145a2c]" />
              <h2 className="text-lg font-bold text-gray-900">
                {nearby.some(s => s.city === station.city)
                  ? `More Charging Stations in ${station.city}`
                  : `More Charging Stations in ${station.state}`}
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearby.map(s => (
                <Link
                  key={s.id}
                  href={`/charging-stations/${s.slug}`}
                  className="text-left bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg hover:border-green-200 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-[#145a2c] transition-colors">{s.name}</h3>
                    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0', getStatusColor(s.status))}>
                      {statusLabels[s.status] || s.status}
                    </span>
                  </div>
                  <div className="flex items-start gap-1 text-xs text-gray-500 mb-2">
                    <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{s.address}, {s.city}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={cn('text-xs font-medium px-2 py-1 rounded-lg', getAvailabilityColor(s.available_chargers, s.total_chargers))}>
                      {s.available_chargers}/{s.total_chargers}
                    </span>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg flex items-center gap-1">
                      <Zap size={10} />{s.power_kw} kW
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null;

      case 'csd_evs':
        return vehicles.length > 0 ? (
          <div key={key} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-2 mb-4">
              <Car size={20} className="text-[#145a2c]" />
              <h2 className="text-lg font-bold text-gray-900">Popular EVs to Charge Here</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {vehicles.map(v => (
                <VehicleCard key={v.id} vehicle={v as any} compact />
              ))}
            </div>
          </div>
        ) : null;

      case 'csd_news':
        return news.length > 0 ? (
          <div key={key} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper size={20} className="text-[#145a2c]" />
              <h2 className="text-lg font-bold text-gray-900">Latest EV News</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {news.map(article => (
                <NewsCard key={article.id} article={article as NewsArticle} />
              ))}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Charging Stations', href: '/charging-stations' },
    { label: station.state, href: `/charging-stations?state=${encodeURIComponent(station.state)}` },
    { label: station.city, href: `/charging-stations?city=${encodeURIComponent(station.city)}` },
    { label: station.name },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <DetailBreadcrumbs items={breadcrumbItems} />
      {orderedKeys.map(key => renderSection(key))}
    </div>
  );
}
