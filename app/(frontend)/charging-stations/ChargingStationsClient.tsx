'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapPin, Search, Zap, Clock, ChevronRight, Navigation2, Filter, X, Building2, Loader as Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ChargingStation, HomepageSection } from '@/lib/types';
import { getStatusColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ChargingStationSubmitModal = dynamic(() => import('@/components/ChargingStationSubmitModal'), { ssr: false });
const AdBanner = dynamic(() => import('@/components/AdBanner'), { ssr: false });

interface ChargingStationsClientProps {
  sections: HomepageSection[];
  stats: { stations: number; cities: number; chargers: number; states: number };
}

const statusLabels: Record<string, string> = {
  active: 'Open Now',
  coming_soon: 'Coming Soon',
  inactive: 'Closed',
};

const ALL_CONNECTORS = ['CCS2', 'CHAdeMO', 'Type 2 AC', 'Bharat DC-001', 'Bharat AC-001', 'Ather Proprietary', 'Ola Proprietary'];

export default function ChargingStationsClient({ sections, stats: initialStats }: ChargingStationsClientProps) {
  const searchParams = useSearchParams();
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedConnector, setSelectedConnector] = useState(searchParams.get('connector') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [stateCityMap, setStateCityMap] = useState<Record<string, string[]>>({});
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [stats, setStats] = useState(initialStats);

  const sectionMap = useMemo(() => {
    const enabled = sections.filter(s => s.is_enabled);
    return new Map(enabled.map(s => [s.section_key, s.sort_order]));
  }, [sections]);

  const isSectionEnabled = useCallback((key: string) => sectionMap.has(key), [sectionMap]);
  const orderedKeys = useMemo(() => {
    return sections.filter(s => s.is_enabled).sort((a, b) => a.sort_order - b.sort_order).map(s => s.section_key);
  }, [sections]);

  // Fetch unique states and cities for filter dropdowns
  useEffect(() => {
    const fetchFilters = async () => {
      const { data } = await supabase
        .from('charging_stations')
        .select('state, city')
        .order('state');
      if (data) {
        const uniqueStates = Array.from(new Set(data.map((s: any) => s.state).filter(Boolean))).sort();
        const uniqueCities = Array.from(new Set(data.map((s: any) => s.city).filter(Boolean))).sort();
        const scMap: Record<string, string[]> = {};
        data.forEach((s: any) => {
          if (s.state && s.city) {
            if (!scMap[s.state]) scMap[s.state] = [];
            if (!scMap[s.state].includes(s.city)) scMap[s.state].push(s.city);
          }
        });
        Object.keys(scMap).forEach(st => scMap[st].sort());
        setStates(uniqueStates);
        setCities(uniqueCities);
        setStateCityMap(scMap);
      }
    };
    fetchFilters();
  }, []);

  // Cities filtered by selected state
  const availableCities = useMemo(() => {
    if (!selectedState) return cities;
    return stateCityMap[selectedState] || [];
  }, [selectedState, cities, stateCityMap]);

  // Fetch stations with all filters
  useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      let query = supabase.from('charging_stations').select('*').order('city');

      if (selectedState) query = query.eq('state', selectedState);
      if (selectedCity) query = query.eq('city', selectedCity);
      if (selectedStatus) query = query.eq('status', selectedStatus);
      if (selectedConnector) query = query.contains('connector_types', [selectedConnector]);
      if (search) query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%,operator.ilike.%${search}%`);

      const { data } = await query.limit(60);
      setStations((data || []) as ChargingStation[]);
      setLoading(false);
    };
    const timer = setTimeout(fetchStations, 200);
    return () => clearTimeout(timer);
  }, [selectedState, selectedCity, selectedConnector, selectedStatus, search]);

  // Update stats realtime
  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from('charging_stations')
        .select('city, state, total_chargers, status')
        .in('status', ['active', 'coming_soon']);
      if (data) {
        const uniqueCities = new Set(data.map((s: any) => s.city).filter(Boolean));
        const uniqueStates = new Set(data.map((s: any) => s.state).filter(Boolean));
        setStats({
          stations: data.length,
          cities: uniqueCities.size,
          chargers: data.reduce((a: number, s: any) => a + (s.total_chargers || 0), 0),
          states: uniqueStates.size,
        });
      }
    };
    fetchStats();
    const channel = supabase.channel('charging-stations-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'charging_stations' }, fetchStats)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getAvailabilityColor = (available: number, total: number) => {
    if (total === 0) return 'text-gray-500 bg-gray-50';
    const ratio = available / total;
    if (ratio > 0.5) return 'text-green-600 bg-green-50';
    if (ratio > 0.2) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const hasActiveFilters = selectedState || selectedCity || selectedConnector || selectedStatus || search;
  const clearAllFilters = () => {
    setSelectedState('');
    setSelectedCity('');
    setSelectedConnector('');
    setSelectedStatus('');
    setSearch('');
  };

  const renderSection = (key: string) => {
    if (!isSectionEnabled(key)) return null;

    switch (key) {
      case 'cs_header':
        return (
          <div key={key} className="bg-gradient-to-r from-[#0a2e14] to-[#145a2c] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="flex items-center gap-3 mb-2">
                <Zap size={24} className="text-green-300" />
                <h1 className="text-2xl sm:text-3xl font-bold">EV Charging Stations</h1>
              </div>
              <p className="text-green-200 text-sm">Find public EV charging points across India with real-time availability and directions.</p>
            </div>
          </div>
        );

      case 'cs_stats':
        return (
          <div key={key} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Stations', value: stats.stations, color: 'text-green-700 bg-green-50', icon: Zap },
                { label: 'Cities', value: stats.cities, color: 'text-blue-700 bg-blue-50', icon: MapPin },
                { label: 'States', value: stats.states, color: 'text-teal-700 bg-teal-50', icon: Building2 },
                { label: 'Total Chargers', value: stats.chargers, color: 'text-amber-700 bg-amber-50', icon: Zap },
              ].map((s) => (
                <div key={s.label} className={cn('rounded-xl p-4 text-center', s.color)}>
                  <s.icon size={18} className="mx-auto mb-1 opacity-60" />
                  <div className="text-xl sm:text-2xl font-extrabold">{s.value}</div>
                  <div className="text-xs mt-0.5 opacity-80">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'cs_search':
        return (
          <div key={key} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            {/* Search bar */}
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by station name, address, city, or operator..."
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <select
                value={selectedState}
                onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); }}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c] cursor-pointer"
              >
                <option value="">All States</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c] cursor-pointer"
              >
                <option value="">All Cities</option>
                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={selectedConnector}
                onChange={(e) => setSelectedConnector(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c] cursor-pointer"
              >
                <option value="">All Connectors</option>
                {ALL_CONNECTORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c] cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="active">Open Now</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="inactive">Closed</option>
              </select>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs text-gray-500 font-medium">{stations.length} result{stations.length !== 1 ? 's' : ''}</span>
                {selectedState && (
                  <button onClick={() => setSelectedState('')} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                    {selectedState} <X size={11} />
                  </button>
                )}
                {selectedCity && (
                  <button onClick={() => setSelectedCity('')} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                    {selectedCity} <X size={11} />
                  </button>
                )}
                {selectedConnector && (
                  <button onClick={() => setSelectedConnector('')} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                    {selectedConnector} <X size={11} />
                  </button>
                )}
                {selectedStatus && (
                  <button onClick={() => setSelectedStatus('')} className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                    {statusLabels[selectedStatus] || selectedStatus} <X size={11} />
                  </button>
                )}
                <button onClick={clearAllFilters} className="text-xs text-gray-500 hover:text-red-600 font-medium underline ml-1">
                  Clear all
                </button>
              </div>
            )}
          </div>
        );

      case 'cs_stations':
        return (
          <div key={key} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <MapPin size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm font-medium">No stations found matching your filters</p>
                  {hasActiveFilters && (
                    <button onClick={clearAllFilters} className="mt-3 text-sm text-[#145a2c] font-medium hover:underline">
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                stations.map((station) => (
                  <Link
                    key={station.id}
                    href={`/charging-stations/${station.slug}`}
                    className="text-left bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-green-200 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-[#145a2c] transition-colors">{station.name}</h3>
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0', getStatusColor(station.status))}>
                        {statusLabels[station.status] || station.status}
                      </span>
                    </div>

                    <div className="flex items-start gap-1 text-xs text-gray-500 mb-3">
                      <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{station.address}, {station.city}, {station.state}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={cn('text-xs font-medium px-2 py-1 rounded-lg', getAvailabilityColor(station.available_chargers, station.total_chargers))}>
                        {station.available_chargers}/{station.total_chargers} available
                      </span>
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Zap size={10} />
                        {station.power_kw} kW
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {station.connector_types.slice(0, 3).map(c => (
                          <span key={c} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">{c}</span>
                        ))}
                        {station.connector_types.length > 3 && (
                          <span className="text-[10px] text-gray-400 px-1">+{station.connector_types.length - 3}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={10} />
                        <span className="truncate max-w-[80px]">{station.operating_hours}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{station.operator}</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-[#145a2c] group-hover:gap-2 transition-all">
                        View Details <ChevronRight size={14} />
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        );

      case 'cs_ad_mid':
        return (
          <div key={key} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <AdBanner position="charging_stations_mid" className="mx-auto" />
          </div>
        );

      case 'cs_submit_cta':
        return (
          <div key={key} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="bg-gradient-to-r from-[#0f4020] to-[#145a2c] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {orderedKeys.map(key => renderSection(key))}
      <ChargingStationSubmitModal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} />
    </div>
  );
}
