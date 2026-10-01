'use client';

import Link from 'next/link';
import { MapPin, Zap, Clock, Wifi, Coffee, Navigation2, Phone, ExternalLink, ChevronRight, ArrowLeft } from 'lucide-react';
import { ChargingStation } from '@/lib/types';
import { getStatusColor } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function ChargingStationDetailClient({ station }: { station: ChargingStation }) {
  const getAvailabilityColor = (available: number, total: number) => {
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

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a2e14] to-[#145a2c] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/charging-stations" className="inline-flex items-center gap-1.5 text-green-200 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={14} /> All Charging Stations
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Zap size={24} className="text-green-300" />
            <h1 className="text-2xl sm:text-3xl font-bold">{station.name}</h1>
          </div>
          <div className="flex items-center gap-1 text-green-200 text-sm">
            <MapPin size={14} />
            {station.address}, {station.city}, {station.state}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="h-64 sm:h-80 relative bg-gray-100">
                {station.lat && station.lng ? (
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${station.lat},${station.lng}&zoom=15`}
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
                  href={generateGoogleMapsUrl(station)}
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
                    style={{ width: `${(station.available_chargers / station.total_chargers) * 100}%` }}
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
            {station.amenities.length > 0 && (
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
                  {station.status === 'active' ? 'Active' : station.status === 'coming_soon' ? 'Coming Soon' : 'Inactive'}
                </span>
              </div>
              <a
                href={generateGoogleMapsUrl(station)}
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
          </div>
        </div>
      </div>
    </div>
  );
}
