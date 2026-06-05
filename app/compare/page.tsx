'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Plus, Minus, Scale, Zap, Gauge, Battery, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/types';
import { formatPrice, getVehicleTypeLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

const compareFields = [
  { key: 'type', label: 'Vehicle Type', format: (v: any) => getVehicleTypeLabel(v) },
  { key: 'price_min', label: 'Starting Price', format: (v: any) => formatPrice(v) },
  { key: 'range_km', label: 'Range (km)', format: (v: any) => `${v} km`, highlight: true },
  { key: 'top_speed_kmh', label: 'Top Speed', format: (v: any) => `${v} kmh`, highlight: true },
  { key: 'battery_capacity_kwh', label: 'Battery Capacity', format: (v: any) => `${v} kWh`, highlight: true },
  { key: 'motor_power_kw', label: 'Motor Power', format: (v: any) => `${v} kW`, highlight: true },
  { key: 'charging_time_hrs', label: 'Charging Time', format: (v: any) => `${v} hrs`, highlight: true, lower: true },
  { key: 'segment', label: 'Segment', format: (v: any) => v },
];

export default function ComparePage() {
  const [allVehicles, setAllVehicles] = useState<(Vehicle & { manufacturers: { name: string } })[]>([]);
  const [selected, setSelected] = useState<(Vehicle & { manufacturers: { name: string } }) | null>(null);
  const [compared, setCompared] = useState<(Vehicle & { manufacturers: { name: string } }) | null>(null);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [resultsA, setResultsA] = useState<any[]>([]);
  const [resultsB, setResultsB] = useState<any[]>([]);
  const [popularComparisons, setPopularComparisons] = useState<{ vehicle1: Vehicle & { manufacturers: { name: string } }; vehicle2: Vehicle & { manufacturers: { name: string } }; title: string | null }[]>([]);

  useEffect(() => {
    supabase
      .from('vehicles')
      .select('*, manufacturers(name)')
      .limit(100)
      .then(({ data }) => setAllVehicles((data || []) as any));

    // Fetch popular comparisons
    const fetchPopular = async () => {
      const { data: compData } = await supabase
        .from('popular_comparisons')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(6);

      if (compData && compData.length > 0) {
        const enriched = await Promise.all(
          compData.map(async (comp) => {
            const [v1Res, v2Res] = await Promise.all([
              supabase.from('vehicles').select('*, manufacturers(name)').eq('slug', comp.vehicle1_slug).maybeSingle(),
              supabase.from('vehicles').select('*, manufacturers(name)').eq('slug', comp.vehicle2_slug).maybeSingle(),
            ]);
            if (!v1Res.data || !v2Res.data) return null;
            return { vehicle1: v1Res.data as any, vehicle2: v2Res.data as any, title: comp.title };
          })
        );
        setPopularComparisons(enriched.filter(Boolean) as any);
      }
    };
    fetchPopular();
  }, []);

  useEffect(() => {
    if (!searchA.trim()) { setResultsA([]); return; }
    const q = searchA.toLowerCase();
    setResultsA(allVehicles.filter(v => v.name.toLowerCase().includes(q)).slice(0, 5));
  }, [searchA, allVehicles]);

  useEffect(() => {
    if (!searchB.trim()) { setResultsB([]); return; }
    const q = searchB.toLowerCase();
    setResultsB(allVehicles.filter(v => v.name.toLowerCase().includes(q)).slice(0, 5));
  }, [searchB, allVehicles]);

  const getBetter = (field: typeof compareFields[0]) => {
    if (!selected || !compared) return null;
    const a = (selected as any)[field.key];
    const b = (compared as any)[field.key];
    if (typeof a !== 'number' || typeof b !== 'number' || !field.highlight) return null;
    if (a === b) return 'tie';
    return field.lower ? (a < b ? 'a' : 'b') : (a > b ? 'a' : 'b');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a2e14] to-[#145a2c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Scale size={24} className="text-green-300" />
            <h1 className="text-2xl sm:text-3xl font-bold">Compare Electric Vehicles</h1>
          </div>
          <p className="text-green-200 text-sm">Side-by-side comparison of any two EVs</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vehicle Selectors */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {/* Vehicle A */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle 1</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchA}
                onChange={(e) => setSearchA(e.target.value)}
                placeholder="Search EV model..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c]"
              />
              {resultsA.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                  {resultsA.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setSelected(v); setSearchA(v.name); setResultsA([]); }}
                      className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={v.image_url} alt={v.name} fill className="object-cover" sizes="40px" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{v.name}</div>
                        <div className="text-xs text-gray-500">{v.manufacturers?.name} · {formatPrice(v.price_min)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selected && (
              <div className="mt-3 bg-white rounded-xl border border-green-200 p-4 flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={selected.image_url} alt={selected.name} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{selected.name}</div>
                  <div className="text-xs text-gray-500">{selected.manufacturers?.name}</div>
                  <div className="text-sm font-bold text-[#145a2c]">{formatPrice(selected.price_min)}</div>
                </div>
                <button onClick={() => { setSelected(null); setSearchA(''); }} className="text-gray-400 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Vehicle B */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle 2</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchB}
                onChange={(e) => setSearchB(e.target.value)}
                placeholder="Search EV model..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c]"
              />
              {resultsB.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                  {resultsB.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setCompared(v); setSearchB(v.name); setResultsB([]); }}
                      className="flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-green-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={v.image_url} alt={v.name} fill className="object-cover" sizes="40px" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{v.name}</div>
                        <div className="text-xs text-gray-500">{v.manufacturers?.name} · {formatPrice(v.price_min)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {compared && (
              <div className="mt-3 bg-white rounded-xl border border-green-200 p-4 flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={compared.image_url} alt={compared.name} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{compared.name}</div>
                  <div className="text-xs text-gray-500">{compared.manufacturers?.name}</div>
                  <div className="text-sm font-bold text-[#145a2c]">{formatPrice(compared.price_min)}</div>
                </div>
                <button onClick={() => { setCompared(null); setSearchB(''); }} className="text-gray-400 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Table */}
        {selected && compared ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-gray-100">
              <div className="p-4 bg-gray-50 border-r border-gray-100">
                <span className="text-sm font-semibold text-gray-500">Specification</span>
              </div>
              <div className="p-4 border-r border-gray-100 bg-green-50">
                <div className="relative h-28 rounded-xl overflow-hidden mb-3">
                  <Image src={selected.image_url} alt={selected.name} fill className="object-cover" sizes="200px" />
                </div>
                <div className="font-bold text-[#145a2c] text-sm">{selected.name}</div>
                <div className="text-xs text-gray-500">{selected.manufacturers?.name}</div>
              </div>
              <div className="p-4 bg-blue-50">
                <div className="relative h-28 rounded-xl overflow-hidden mb-3">
                  <Image src={compared.image_url} alt={compared.name} fill className="object-cover" sizes="200px" />
                </div>
                <div className="font-bold text-blue-700 text-sm">{compared.name}</div>
                <div className="text-xs text-gray-500">{compared.manufacturers?.name}</div>
              </div>
            </div>

            {/* Rows */}
            {compareFields.map((field, i) => {
              const better = getBetter(field);
              return (
                <div key={field.key} className={cn('grid grid-cols-3 border-b border-gray-50', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                  <div className="p-4 border-r border-gray-100">
                    <span className="text-sm text-gray-600 font-medium">{field.label}</span>
                  </div>
                  <div className={cn('p-4 border-r border-gray-100 flex items-center', better === 'a' ? 'bg-green-50' : '')}>
                    <span className="text-sm font-semibold text-gray-900">
                      {field.format((selected as any)[field.key])}
                    </span>
                    {better === 'a' && <CheckCircle2 size={14} className="ml-2 text-green-500" />}
                    {better === 'b' && <XCircle size={14} className="ml-2 text-gray-300" />}
                  </div>
                  <div className={cn('p-4 flex items-center', better === 'b' ? 'bg-blue-50' : '')}>
                    <span className="text-sm font-semibold text-gray-900">
                      {field.format((compared as any)[field.key])}
                    </span>
                    {better === 'b' && <CheckCircle2 size={14} className="ml-2 text-blue-500" />}
                    {better === 'a' && <XCircle size={14} className="ml-2 text-gray-300" />}
                  </div>
                </div>
              );
            })}

            {/* Spec Details from spec table */}
            {selected.specifications && compared.specifications && (
              <>
                {Object.keys(selected.specifications).slice(0, 8).map((key, i) => (
                  <div key={key} className={cn('grid grid-cols-3 border-b border-gray-50', (compareFields.length + i) % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                    <div className="p-4 border-r border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">{key}</span>
                    </div>
                    <div className="p-4 border-r border-gray-100">
                      <span className="text-sm text-gray-800">{(selected.specifications as any)[key] || '—'}</span>
                    </div>
                    <div className="p-4">
                      <span className="text-sm text-gray-800">{(compared.specifications as any)[key] || '—'}</span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* CTA Row */}
            <div className="grid grid-cols-3 bg-gray-50 p-4">
              <div />
              <div className="pr-2">
                <Link href={`/vehicles/${selected.slug}`} className="block w-full text-center bg-[#145a2c] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0f4020] transition-colors">
                  View {selected.name}
                </Link>
              </div>
              <div className="pl-2">
                <Link href={`/vehicles/${compared.slug}`} className="block w-full text-center bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                  View {compared.name}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Scale size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Select Two Vehicles to Compare</h3>
            <p className="text-gray-500 text-sm">Search for any EV above and pick two to compare side-by-side</p>
          </div>
        )}

        {/* Popular comparisons */}
        <div className="mt-8">
          <h2 className="text-base font-bold text-gray-900 mb-4">Popular Comparisons</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularComparisons.length > 0 ? (
              popularComparisons.map((comp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelected(comp.vehicle1);
                    setCompared(comp.vehicle2);
                    setSearchA(comp.vehicle1.name);
                    setSearchB(comp.vehicle2.name);
                  }}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between hover:border-green-200 hover:shadow-sm transition-all text-left"
                >
                  <div className="text-sm flex items-center gap-2">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={comp.vehicle1.image_url} alt={comp.vehicle1.name} fill className="object-cover" sizes="40px" />
                    </div>
                    <span className="font-semibold text-gray-900">{comp.vehicle1.name}</span>
                    <span className="text-gray-400 mx-1">vs</span>
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={comp.vehicle2.image_url} alt={comp.vehicle2.name} fill className="object-cover" sizes="40px" />
                    </div>
                    <span className="font-semibold text-gray-900">{comp.vehicle2.name}</span>
                  </div>
                  <Scale size={14} className="text-green-600 flex-shrink-0" />
                </button>
              ))
            ) : (
              <>
                {[
                  { a: 'Ather 450X', b: 'Ola S1 Pro Gen 2' },
                  { a: 'Tata Nexon EV', b: 'MG ZS EV' },
                  { a: 'Tata Tiago EV', b: 'Tata Nexon EV' },
                  { a: 'TVS iQube ST', b: 'Bajaj Chetak Premium' },
                ].map((pair) => (
                  <div key={`${pair.a}-${pair.b}`} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between hover:border-green-200 hover:shadow-sm transition-all cursor-pointer">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900">{pair.a}</span>
                      <span className="text-gray-400 mx-2">vs</span>
                      <span className="font-semibold text-gray-900">{pair.b}</span>
                    </div>
                    <Scale size={14} className="text-green-600 flex-shrink-0" />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
