'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Car, Calendar, Zap, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Manufacturer, VehicleType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ManufacturerWithCounts extends Manufacturer {
  scooter_count?: number;
  bike_count?: number;
  car_count?: number;
  total_vehicles?: number;
}

export default function ManufacturersClientPage() {
  const [manufacturers, setManufacturers] = useState<ManufacturerWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<VehicleType | 'all'>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Get manufacturers
      const { data: manufacturersData } = await supabase
        .from('manufacturers')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('name');

      // Get vehicle counts per manufacturer per type
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('manufacturer_id, type');

      // Aggregate counts
      const countsMap: Record<string, { scooter: number; bike: number; car: number }> = {};

      (vehiclesData || []).forEach((v: any) => {
        const mid = v.manufacturer_id;
        if (!countsMap[mid]) countsMap[mid] = { scooter: 0, bike: 0, car: 0 };
        if (v.type === 'scooter') countsMap[mid].scooter++;
        if (v.type === 'bike') countsMap[mid].bike++;
        if (v.type === 'car') countsMap[mid].car++;
      });

      // Enhance manufacturers with counts
      const enhanced = (manufacturersData || []).map((m) => ({
        ...m,
        scooter_count: countsMap[m.id]?.scooter || 0,
        bike_count: countsMap[m.id]?.bike || 0,
        car_count: countsMap[m.id]?.car || 0,
        total_vehicles: (countsMap[m.id]?.scooter || 0) + (countsMap[m.id]?.bike || 0) + (countsMap[m.id]?.car || 0),
      })) as ManufacturerWithCounts[];

      setManufacturers(enhanced);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Filter manufacturers based on active type
  const filteredManufacturers = manufacturers.filter((m) => {
    if (activeType === 'all') return m.total_vehicles && m.total_vehicles > 0;
    if (activeType === 'scooter') return m.scooter_count && m.scooter_count > 0;
    if (activeType === 'bike') return m.bike_count && m.bike_count > 0;
    if (activeType === 'car') return m.car_count && m.car_count > 0;
    return true;
  });

  // Calculate total counts for tabs
  const totalScooters = manufacturers.reduce((a, m) => a + (m.scooter_count || 0), 0);
  const totalBikes = manufacturers.reduce((a, m) => a + (m.bike_count || 0), 0);
  const totalCars = manufacturers.reduce((a, m) => a + (m.car_count || 0), 0);

  const tabs = [
    { type: 'all' as const, label: 'All', count: manufacturers.length },
    { type: 'scooter' as const, label: 'Scooters', count: totalScooters },
    { type: 'bike' as const, label: 'Bikes', count: totalBikes },
    { type: 'car' as const, label: 'Cars', count: totalCars },
  ];

  const featured = filteredManufacturers.filter(m => m.is_featured);
  const others = filteredManufacturers.filter(m => !m.is_featured);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a2e14] to-[#145a2c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">EV Manufacturers in India</h1>
          <p className="text-green-200 text-sm">{manufacturers.length} brands shaping India&apos;s electric future</p>
        </div>
      </div>

      {/* Vehicle Type Tabs */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.type}
                onClick={() => setActiveType(tab.type)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  activeType === tab.type
                    ? 'bg-[#145a2c] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {tab.label}
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  activeType === tab.type ? 'bg-white/20' : 'bg-gray-200'
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading manufacturers...</div>
        ) : filteredManufacturers.length === 0 ? (
          <div className="text-center py-12">
            <Car size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">No manufacturers found for this vehicle type</p>
          </div>
        ) : (
          <>
            {/* Featured Brands */}
            {featured.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-5 bg-[#145a2c] rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900">Leading EV Brands</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  {featured.map((m) => (
                    <Link key={m.id} href={`/manufacturers/${m.slug}`} className="group">
                      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                        {/* Hero Image */}
                        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-gray-50 to-green-50">
                          <Image
                            src={m.hero_image_url}
                            alt={m.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                            sizes="(max-width: 1024px) 50vw, 25vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <h3 className="text-white font-bold text-base">{m.name}</h3>
                            <span className="text-xs text-green-300">{m.country}</span>
                          </div>
                        </div>

                        <div className="p-4">
                          <p className="text-xs text-gray-600 line-clamp-2 mb-3">{m.description}</p>

                          {/* Vehicle Type Counts */}
                          {/* <div className="flex flex-wrap gap-1.5 mb-3">
                            {m.scooter_count && m.scooter_count > 0 && (
                              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                                {m.scooter_count} Scooters
                              </span>
                            )}
                            {m.bike_count && m.bike_count > 0 && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                {m.bike_count} Bikes
                              </span>
                            )}
                            {m.car_count && m.car_count > 0 && (
                              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                                {m.car_count} Cars
                              </span>
                            )}
                          </div> */}

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Car size={11} />
                              {m.total_vehicles} models
                            </span>
                            {m.founded_year && (
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                Est. {m.founded_year}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 flex items-center gap-1 text-sm font-medium text-[#145a2c] group-hover:gap-2 transition-all">
                            View models <ArrowRight size={13} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All Brands */}
            {others.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-5 bg-gray-300 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900">More EV Brands</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {others.map((m) => (
                    <Link key={m.id} href={`/manufacturers/${m.slug}`} className="group">
                      <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 relative rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image src={m.logo_url || m.hero_image_url} alt={m.name} fill className="object-cover" sizes="48px" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm group-hover:text-[#145a2c] transition-colors">{m.name}</h3>
                            <span className="text-xs text-gray-500">{m.country}</span>
                          </div>
                        </div>

                        {/* Vehicle Type Tags */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {m.scooter_count && m.scooter_count > 0 && (
                            <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">
                              {m.scooter_count} Scooters
                            </span>
                          )}
                          {m.bike_count && m.bike_count > 0 && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                              {m.bike_count} Bikes
                            </span>
                          )}
                          {m.car_count && m.car_count > 0 && (
                            <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                              {m.car_count} Cars
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Car size={11} />
                          {m.total_vehicles} models
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Manufacturer Registration CTA */}
      <section className="py-14 md:py-20 bg-gradient-to-br from-[#0a2e14] to-[#145a2c] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" aria-hidden="true">
          <svg width="100%" height="100%" viewBox="0 0 1200 300" fill="none" preserveAspectRatio="xMidYMid slice">
            <path d="M0 200 H200 V100 H400 V50 H600 V170 H800 V90 H1000 V190 H1200" stroke="#22c55e" strokeWidth="2" fill="none" />
            <circle cx="200" cy="100" r="5" fill="#22c55e" />
            <circle cx="400" cy="50" r="5" fill="#22c55e" />
            <circle cx="600" cy="170" r="5" fill="#22c55e" />
            <circle cx="800" cy="90" r="5" fill="#22c55e" />
            <circle cx="1000" cy="190" r="5" fill="#22c55e" />
            <path d="M580 140 L 595 115 L 585 115 L 600 90 L 590 125 L 600 125 L 585 150 Z" fill="#22c55e" opacity="0.4" />
          </svg>
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-400/20 rounded-full px-4 py-1.5 mb-5">
            <Zap size={14} className="text-green-400" />
            <span className="text-xs font-semibold text-green-300 uppercase tracking-wider">For Manufacturers</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold mb-4 leading-tight">
            Are You an EV Manufacturer?
          </h2>
          <p className="text-green-100 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Register your company on EVMotorHub and showcase your electric vehicles to thousands of potential buyers across India.
          </p>
          <Link
            href="/register-company"
            className="inline-flex items-center gap-2 bg-white text-[#0a2e14] hover:bg-green-50 font-bold px-8 py-3.5 rounded-xl text-base transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Building2 size={18} />
            Register Your Company
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
