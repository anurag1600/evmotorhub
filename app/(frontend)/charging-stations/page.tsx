'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MapPin, Search, Zap, Clock, Wifi, Coffee, X, Navigation2, Phone, ExternalLink, Car, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ChargingStation } from '@/lib/types';
import { getStatusColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import ChargingStationSubmitModal from '@/components/ChargingStationSubmitModal';

const indianCities = [
  'All Cities', 'Bengaluru', 'Mumbai', 'New Delhi', 'Gurugram', 'Chennai',
  'Pune', 'Hyderabad', 'Kolkata', 'Gandhinagar', 'Ahmedabad'
];

const connectorTypes = ['CCS2', 'CHAdeMO', 'Type 2 AC', 'Bharat DC-001', 'Bharat AC-001', 'Ather Proprietary', 'Ola Proprietary'];

export default function ChargingStationsPage() {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');
  const [search, setSearch] = useState('');
  const [selectedConnector, setSelectedConnector] = useState('');
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from('charging_stations').select('*').order('city');
      if (selectedCity) query = query.eq('city', selectedCity);
      if (search) query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
      if (selectedConnector) query = query.contains('connector_types', [selectedConnector]);

      const { data } = await query.limit(50);
      setStations((data || []) as ChargingStation[]);
      setLoading(false);
    };
    fetch();
  }, [selectedCity, search, selectedConnector]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedStation) {
        setSelectedStation(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStation]);

  const getAvailabilityColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio > 0.5) return 'text-green-600 bg-green-50';
    if (ratio > 0.2) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const generateGoogleMapsUrl = (station: ChargingStation) => {
    if (station.lat && station.lng) {
      return `https://www.google.com/maps?q=${station.lat},${station.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${station.name}, ${station.address}, ${station.city}`)}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a2e14] to-[#145a2c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Zap size={24} className="text-green-300" />
            <h1 className="text-2xl sm:text-3xl font-bold">EV Charging Stations</h1>
          </div>
          <p className="text-green-200 text-sm">Find public EV charging points across India</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Stations Listed', value: stations.length || '12+', color: 'text-green-700 bg-green-50' },
            { label: 'Cities Covered', value: '10+', color: 'text-blue-700 bg-blue-50' },
            { label: 'Total Chargers', value: `${stations.reduce((a, s) => a + s.total_chargers, 0) || '100+'}`, color: 'text-amber-700 bg-amber-50' },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-xl p-4 text-center', s.color)}>
              <div className="text-2xl font-extrabold">{s.value}</div>
              <div className="text-xs mt-0.5 opacity-80">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search station name or address..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c]"
            />
          </div>
          <select
            value={selectedConnector}
            onChange={(e) => setSelectedConnector(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c]"
          >
            <option value="">All Connectors</option>
            {connectorTypes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* City Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
          {indianCities.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city === 'All Cities' ? '' : city)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors',
                (city === 'All Cities' ? '' : city) === selectedCity
                  ? 'bg-[#145a2c] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'
              )}
            >
              <MapPin size={11} />
              {city}
            </button>
          ))}
        </div>

        {/* Station Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="animate-pulse h-4 rounded w-3/4 mb-2 bg-gray-200" />
                <div className="animate-pulse h-3 rounded w-1/2 mb-3 bg-gray-200" />
                <div className="flex gap-2">
                  <div className="animate-pulse h-6 rounded-full w-16 bg-gray-200" />
                  <div className="animate-pulse h-6 rounded-full w-20 bg-gray-200" />
                </div>
              </div>
            ))
          ) : stations.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-100">
              <MapPin size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No stations found in this area</p>
            </div>
          ) : (
            stations.map((station) => (
              <button
                key={station.id}
                onClick={() => setSelectedStation(station)}
                className="text-left bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-lg hover:border-green-200 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-[#145a2c] transition-colors">{station.name}</h3>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0', getStatusColor(station.status))}>
                    {station.status === 'active' ? 'Open' : station.status === 'coming_soon' ? 'Coming Soon' : 'Closed'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                  <MapPin size={11} />
                  <span className="truncate">{station.address}, {station.city}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={cn('text-xs font-medium px-2 py-1 rounded-lg', getAvailabilityColor(station.available_chargers, station.total_chargers))}>
                    {station.available_chargers}/{station.total_chargers} available
                  </span>
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Zap size={10} />
                    {station.power_kw} kW
                  </span>
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Clock size={10} />
                    {station.operating_hours}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {station.connector_types.slice(0, 2).map(c => (
                      <span key={c} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                    {station.connector_types.length > 2 && (
                      <span className="text-xs text-gray-400">+{station.connector_types.length - 2}</span>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-[#145a2c] transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Add Station CTA */}
        <div className="mt-8 bg-gradient-to-r from-[#0f4020] to-[#145a2c] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-lg mb-1">Know a charging station not listed here?</div>
            <div className="text-green-200 text-sm">Help us build India&apos;s most complete EV charging directory.</div>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="bg-white text-[#145a2c] px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors whitespace-nowrap flex-shrink-0"
          >
            Submit a Station
          </button>
        </div>
      </div>

      {/* Submit Modal */}
      <ChargingStationSubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
      />

      {/* Station Detail Modal */}
      {selectedStation && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedStation(null)}
        >
          <div
            className={cn(
              'bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden',
              'animate-in slide-in-from-bottom sm:animate-in sm:fade-in sm:zoom-in duration-300'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Map */}
            <div className="h-48 sm:h-64 relative bg-gray-100">
              {selectedStation.lat && selectedStation.lng ? (
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${selectedStation.lat},${selectedStation.lng}&zoom=15`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${selectedStation.name} location`}
                  className="absolute inset-0"
                />
              ) : (
                <div className="h-full bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin size={40} className="text-[#145a2c] mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">View on Google Maps</p>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedStation(null)}
                className="absolute top-3 right-3 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
              >
                <X size={18} className="text-gray-700" />
              </button>

              {/* Quick Actions Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                <a
                  href={generateGoogleMapsUrl(selectedStation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-white/95 text-gray-800 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-white transition-colors shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Navigation2 size={16} className="text-green-600" />
                  Directions
                </a>
                {selectedStation.phone_support && (
                  <a
                    href={`tel:${selectedStation.phone_support}`}
                    className="flex items-center justify-center gap-2 bg-[#145a2c] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#0f4020] transition-colors shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone size={16} />
                  </a>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedStation.name}</h2>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin size={13} />
                    {selectedStation.address}, {selectedStation.city}, {selectedStation.state}
                  </div>
                </div>
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', getStatusColor(selectedStation.status))}>
                  {selectedStation.status === 'active' ? 'Active' : selectedStation.status === 'coming_soon' ? 'Coming Soon' : 'Inactive'}
                </span>
              </div>

              {/* Quick Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Operator', value: selectedStation.operator },
                  { label: 'Power', value: `${selectedStation.power_kw} kW` },
                  { label: 'Chargers', value: selectedStation.total_chargers },
                  { label: 'Hours', value: selectedStation.operating_hours },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">{label}</div>
                    <div className="text-sm font-bold text-gray-900">{value}</div>
                  </div>
                ))}
              </div>

              {/* Availability */}
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span className="font-medium">Charger Availability</span>
                  <span className="font-semibold text-[#145a2c]">{selectedStation.available_chargers}/{selectedStation.total_chargers} free</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                    style={{ width: `${(selectedStation.available_chargers / selectedStation.total_chargers) * 100}%` }}
                  />
                </div>
              </div>

              {/* Connectors */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Connector Types</div>
                <div className="flex flex-wrap gap-2">
                  {selectedStation.connector_types.map(c => (
                    <span key={c} className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-lg">
                      <Zap size={12} />
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              {selectedStation.amenities.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Nearby Amenities</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedStation.amenities.map(a => (
                      <span key={a} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg">
                        {a === 'Cafe' && <Coffee size={12} />}
                        {a === 'WiFi' && <Wifi size={12} />}
                        {!['Cafe', 'WiFi'].includes(a) && <MapPin size={12} />}
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing */}
              {(selectedStation.price_per_kwh || selectedStation.fast_charging) && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                  {selectedStation.price_per_kwh && (
                    <span className="text-sm bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg font-medium">
                      Rs. {selectedStation.price_per_kwh}/kWh
                    </span>
                  )}
                  {selectedStation.fast_charging && (
                    <span className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1">
                      <Zap size={12} /> Fast Charging
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
