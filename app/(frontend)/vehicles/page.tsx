'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X, ChevronDown, Car, Bike, Radio } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/types';
import VehicleCard from '@/components/VehicleCard';
import { formatPrice } from '@/lib/format';

const vehicleTypes = [
  { value: '', label: 'All Types', icon: null },
  { value: 'scooter', label: 'Scooters', icon: Radio },
  { value: 'bike', label: 'Bikes', icon: Bike },
  { value: 'car', label: 'Cars', icon: Car },
];

const sortOptions = [
  { value: 'created_at', label: 'Latest First' },
  { value: 'price_min_asc', label: 'Price: Low to High' },
  { value: 'price_min_desc', label: 'Price: High to Low' },
  { value: 'range_km', label: 'Range: High to Low' },
];

function formatLakh(price: number): string {
  if (price >= 100000) {
    const lakh = price / 100000;
    return lakh % 1 === 0 ? `${lakh}L` : `${lakh.toFixed(1)}L`;
  }
  return `${(price / 1000).toFixed(0)}K`;
}

export default function VehiclesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vehicles, setVehicles] = useState<(Vehicle & { manufacturers: { name: string; slug: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [priceRanges, setPriceRanges] = useState<{ value: string; label: string; min: number | null; max: number | null }[]>([]);

  const typeParam = searchParams.get('type') || '';
  const priceParam = searchParams.get('price') || '';
  const upcomingParam = searchParams.get('upcoming') || '';
  const sortParam = searchParams.get('sort') || 'created_at';
  const qParam = searchParams.get('q') || '';

  const [search, setSearch] = useState(qParam);
  const [selectedType, setSelectedType] = useState(typeParam);
  const [selectedPrice, setSelectedPrice] = useState(priceParam);
  const [showUpcoming, setShowUpcoming] = useState(upcomingParam === 'true');
  const [sort, setSort] = useState(sortParam);

  // Generate dynamic price ranges from actual vehicle data
  useEffect(() => {
    const generatePriceRanges = async () => {
      const { data } = await supabase
        .from('vehicles')
        .select('price_min')
        .eq('status', 'published')
        .gt('price_min', 0)
        .order('price_min', { ascending: true });

      if (!data || data.length === 0) {
        setPriceRanges([{ value: '', label: 'All Budgets', min: null, max: null }]);
        return;
      }

      const prices = data.map(v => v.price_min).filter(Boolean).sort((a, b) => a - b);
      const minPrice = prices[0];
      const maxPrice = prices[prices.length - 1];

      // Generate bucket boundaries at 1L, 3L, 5L, 10L, 15L, 20L based on data
      const boundaries = [100000, 300000, 500000, 1000000, 1500000, 2000000, 3000000, 5000000];
      const relevantBoundaries = boundaries.filter(b => b > minPrice && b < maxPrice);

      const ranges: { value: string; label: string; min: number | null; max: number | null }[] = [
        { value: '', label: 'All Budgets', min: null, max: null },
      ];

      // Under first boundary
      if (relevantBoundaries.length > 0) {
        ranges.push({ value: `0-${relevantBoundaries[0]}`, label: `Under ${formatLakh(relevantBoundaries[0])}`, min: 0, max: relevantBoundaries[0] });
      }

      // Between boundaries
      for (let i = 0; i < relevantBoundaries.length - 1; i++) {
        const lo = relevantBoundaries[i];
        const hi = relevantBoundaries[i + 1];
        ranges.push({
          value: `${lo}-${hi}`,
          label: `${formatLakh(lo)} - ${formatLakh(hi)}`,
          min: lo,
          max: hi,
        });
      }

      // Above last boundary
      if (relevantBoundaries.length > 0) {
        ranges.push({
          value: `${relevantBoundaries[relevantBoundaries.length - 1]}-plus`,
          label: `${formatLakh(relevantBoundaries[relevantBoundaries.length - 1])}+`,
          min: relevantBoundaries[relevantBoundaries.length - 1],
          max: null,
        });
      }

      setPriceRanges(ranges);
    };
    generatePriceRanges();
  }, []);

  const getPriceRange = (priceValue: string) => {
    const range = priceRanges.find(r => r.value === priceValue);
    return range ? { min: range.min, max: range.max } : { min: null, max: null };
  };

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('vehicles')
      .select('*, manufacturers(name, slug)')
      .eq('status', 'published');

    if (selectedType) query = query.eq('type', selectedType);

    if (selectedPrice) {
      const { min, max } = getPriceRange(selectedPrice);
      if (min !== null) query = query.gte('price_min', min);
      if (max !== null) query = query.lte('price_min', max);
    }

    if (showUpcoming) query = query.eq('is_upcoming', true);
    if (search) query = query.ilike('name', `%${search}%`);

    if (sort === 'price_min_asc') query = query.order('price_min', { ascending: true });
    else if (sort === 'price_min_desc') query = query.order('price_min', { ascending: false });
    else if (sort === 'range_km') query = query.order('range_km', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error } = await query.limit(50);
    if (!error && data) {
      setVehicles(data as any);
      setTotal(data.length);
    }
    setLoading(false);
  }, [selectedType, selectedPrice, showUpcoming, sort, search, priceRanges]);

  useEffect(() => {
    if (priceRanges.length > 0) fetchVehicles();
  }, [fetchVehicles]);

  const clearFilters = () => {
    setSelectedType('');
    setSelectedPrice('');
    setShowUpcoming(false);
    setSort('created_at');
    setSearch('');
  };

  const hasActiveFilters = selectedType || selectedPrice || showUpcoming || search;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a2e14] to-[#145a2c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Electric Vehicles in India</h1>
          <p className="text-green-200 text-sm">
            {total} {total === 1 ? 'vehicle' : 'vehicles'} found
            {selectedType ? ` · ${vehicleTypes.find(t => t.value === selectedType)?.label}` : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search EV model, brand..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${filterOpen ? 'bg-[#145a2c] text-white border-[#145a2c]' : 'bg-white text-gray-700 border-gray-200 hover:border-green-300'}`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 bg-green-400 rounded-full" />}
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="hidden sm:block px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c] cursor-pointer"
          >
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Filters Panel */}
        {filterOpen && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Vehicle Type</label>
                <div className="flex flex-wrap gap-2">
                  {vehicleTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setSelectedType(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedType === t.value ? 'bg-[#145a2c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Price Range</label>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setSelectedPrice(r.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedPrice === r.value ? 'bg-[#145a2c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upcoming */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Launch Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowUpcoming(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!showUpcoming ? 'bg-[#145a2c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => setShowUpcoming(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showUpcoming ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Upcoming
                  </button>
                </div>
              </div>

              {/* Sort (mobile) */}
              <div className="sm:hidden">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none"
                >
                  {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">Active filters applied</span>
                <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                  <X size={13} /> Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {/* Type Quick Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {vehicleTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${selectedType === t.value ? 'bg-[#145a2c] text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-[#145a2c]'}`}
            >
              {t.icon && <t.icon size={14} />}
              {t.label}
            </button>
          ))}
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                <div className="h-48 animate-shimmer" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 rounded animate-shimmer w-1/3" />
                  <div className="h-5 bg-gray-100 rounded animate-shimmer w-3/4" />
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(j => <div key={j} className="h-12 bg-gray-100 rounded animate-shimmer" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-300 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No vehicles found</h3>
            <p className="text-gray-500 text-sm mb-4">Try adjusting your filters or search terms</p>
            <button onClick={clearFilters} className="bg-[#145a2c] text-white px-6 py-2.5 rounded-xl text-sm font-medium">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
