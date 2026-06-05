'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search, Zap, Clock, Wifi, Coffee, X, Filter, CircleCheck as CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ChargingStation } from '@/lib/types';
import { getStatusColor } from '@/lib/format';
import { cn } from '@/lib/utils';

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
        {/* Coming Soon Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-amber-600" />
          </div>
          <div>
            <div className="font-semibold text-amber-800 text-sm">Interactive Map Coming Soon</div>
            <div className="text-xs text-amber-700 mt-0.5">
              We&apos;re building a full interactive map with real-time availability. For now, browse the station directory below.
              Filter by city, connector type, and operator to find the right charging point.
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Stations Listed', value: stations.length || '12+', color: 'text-green-700 bg-green-50' },
            { label: 'Cities Covered', value: '10+', color: 'text-blue-700 bg-blue-50' },
            { label: 'Total Chargers', value: `${stations.reduce((a, s) => a + s.total_chargers, 0) || '100+'}`, color: 'text-amber-700 bg-amber-50' },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-xl p-3 text-center', s.color)}>
              <div className="text-xl font-extrabold">{s.value}</div>
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

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Station List */}
          <div className={cn('space-y-3', selectedStation ? 'lg:col-span-1' : 'lg:col-span-3')}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="animate-shimmer h-4 rounded w-3/4 mb-2" />
                  <div className="animate-shimmer h-3 rounded w-1/2 mb-3" />
                  <div className="flex gap-2">
                    <div className="animate-shimmer h-6 rounded-full w-16" />
                    <div className="animate-shimmer h-6 rounded-full w-20" />
                  </div>
                </div>
              ))
            ) : stations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <MapPin size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">No stations found in this area</p>
              </div>
            ) : (
              stations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => setSelectedStation(selectedStation?.id === station.id ? null : station)}
                  className={cn(
                    'w-full text-left bg-white rounded-2xl border p-4 hover:shadow-md transition-all duration-200',
                    selectedStation?.id === station.id ? 'border-[#145a2c] shadow-md' : 'border-gray-100 hover:border-green-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{station.name}</h3>
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

                  <div className="flex flex-wrap gap-1">
                    {station.connector_types.slice(0, 3).map(c => (
                      <span key={c} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{c}</span>
                    ))}
                    {station.connector_types.length > 3 && (
                      <span className="text-xs text-gray-400">+{station.connector_types.length - 3}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Station Detail Panel */}
          {selectedStation && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-4 overflow-hidden">
                {/* Map Placeholder */}
                <div className="h-48 sm:h-64 bg-gradient-to-br from-green-100 to-emerald-50 relative flex items-center justify-center border-b border-gray-100">
                  <div className="text-center">
                    <MapPin size={40} className="text-[#145a2c] mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Interactive Map</p>
                    <p className="text-xs text-gray-500">Coming Soon</p>
                    {selectedStation.lat && selectedStation.lng && (
                      <p className="text-xs text-gray-400 mt-1">{selectedStation.lat}°N, {selectedStation.lng}°E</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedStation(null)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                      { label: 'Operator', value: selectedStation.operator },
                      { label: 'Charging Power', value: `${selectedStation.power_kw} kW` },
                      { label: 'Total Chargers', value: selectedStation.total_chargers },
                      { label: 'Hours', value: selectedStation.operating_hours },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-xs text-gray-500 mb-1">{label}</div>
                        <div className="text-sm font-bold text-gray-900">{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Connector Types</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedStation.connector_types.map(c => (
                        <span key={c} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={10} />
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedStation.amenities.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Nearby Amenities</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedStation.amenities.map(a => (
                          <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Availability Bar */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>Charger Availability</span>
                      <span className="font-semibold">{selectedStation.available_chargers}/{selectedStation.total_chargers} free</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${(selectedStation.available_chargers / selectedStation.total_chargers) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Station CTA */}
        <div className="mt-8 bg-gradient-to-r from-[#0f4020] to-[#145a2c] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-lg mb-1">Know a charging station not listed here?</div>
            <div className="text-green-200 text-sm">Help us build India&apos;s most complete EV charging directory.</div>
          </div>
          <button className="bg-white text-[#145a2c] px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors whitespace-nowrap flex-shrink-0">
            Submit a Station
          </button>
        </div>
      </div>
    </div>
  );
}
