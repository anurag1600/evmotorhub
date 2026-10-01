'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search, Zap, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ChargingStation } from '@/lib/types';
import { getStatusColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const ChargingStationSubmitModal = dynamic(() => import('@/components/ChargingStationSubmitModal'), {
  ssr: false,
});

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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [stats, setStats] = useState({ stations: 0, cities: 0, chargers: 0 });

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

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase
        .from('charging_stations')
        .select('city, total_chargers, status')
        .in('status', ['active', 'coming_soon']);
      if (error) { console.error('Failed to fetch stats:', error); return; }
      if (data) {
        const uniqueCities = new Set(data.map((s: any) => s.city).filter(Boolean));
        setStats({
          stations: data.length,
          cities: uniqueCities.size,
          chargers: data.reduce((a: number, s: any) => a + (s.total_chargers || 0), 0),
        });
      }
    };
    fetchStats();
    const channel = supabase.channel('charging-stations-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'charging_stations' }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getAvailabilityColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio > 0.5) return 'text-green-600 bg-green-50';
    if (ratio > 0.2) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
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
            { label: 'Stations Listed', value: stats.stations, color: 'text-green-700 bg-green-50' },
            { label: 'Cities Covered', value: stats.cities, color: 'text-blue-700 bg-blue-50' },
            { label: 'Total Chargers', value: stats.chargers, color: 'text-amber-700 bg-amber-50' },
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
              <Link
                key={station.id}
                href={`/charging-stations/${station.slug}`}
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
              </Link>
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
    </div>
  );
}
