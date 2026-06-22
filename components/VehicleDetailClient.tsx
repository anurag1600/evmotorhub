'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Zap, Gauge, Battery, Clock, MapPin, ChevronRight, Scale, Calculator, ShoppingBag, ArrowRight, ThumbsUp, ThumbsDown, Check, X, Newspaper, ExternalLink } from 'lucide-react';
import { Vehicle, VehicleVariant, PricingState, PricingCity } from '@/lib/types';
import { formatPrice, formatPriceRange, getVehicleTypeLabel, getSegmentLabel, getSegmentColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import VehicleGallery from '@/components/VehicleGallery';
import VehicleVariantSelector from '@/components/VehicleVariantSelector';
import PriceBreakdown from '@/components/PriceBreakdown';
import VehicleCard from '@/components/VehicleCard';

interface VehicleDetailClientProps {
  vehicle: Vehicle & { manufacturers: any };
  variants: VehicleVariant[];
  similar: any[];
}

export default function VehicleDetailClient({ vehicle, variants, similar }: VehicleDetailClientProps) {
  const manufacturer = vehicle.manufacturers;
  const defaultVariant = variants.find(v => v.is_featured && v.status === 'active') ||
                         variants.find(v => v.status === 'active') ||
                         (variants.length > 0 ? variants[0] : null);
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(defaultVariant);
  const [news, setNews] = useState<any[]>([]);

  // Display values from selected variant or vehicle
  const displayValues = useMemo(() => ({
    price: selectedVariant?.price || vehicle.price_min,
    range_km: selectedVariant?.range_km ?? vehicle.range_km,
    top_speed_kmh: selectedVariant?.top_speed_kmh ?? vehicle.top_speed_kmh,
    battery_capacity_kwh: selectedVariant?.battery_capacity_kwh ?? vehicle.battery_capacity_kwh,
    motor_power_kw: selectedVariant?.motor_power_kw ?? vehicle.motor_power_kw,
    charging_time_hrs: selectedVariant?.charging_time_hrs ?? vehicle.charging_time_hrs,
    kerb_weight: selectedVariant?.kerb_weight,
    specifications: selectedVariant?.specifications || vehicle.specifications || {},
  }), [selectedVariant, vehicle]);

  // Filter similar vehicles by same type only
  const filteredSimilar = useMemo(() =>
    similar.filter(v => v.type === vehicle.type).slice(0, 4),
    [similar, vehicle.type]
  );

  // Load related news
  useEffect(() => {
    const loadNews = async () => {
      const { data } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(4);
      setNews(data || []);
    };
    loadNews();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <nav className="flex items-center gap-1 text-xs text-gray-500">
            <Link href="/" className="hover:text-[#145a2c]">Home</Link>
            <ChevronRight size={12} className="text-gray-300" />
            <Link href="/vehicles" className="hover:text-[#145a2c]">Vehicles</Link>
            <ChevronRight size={12} className="text-gray-300" />
            <Link href={`/vehicles?type=${vehicle.type}`} className="hover:text-[#145a2c]">{getVehicleTypeLabel(vehicle.type)}</Link>
            <ChevronRight size={12} className="text-gray-300" />
            <span className="text-gray-900 font-medium">{vehicle.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Gallery - Left 3 columns */}
            <div className="lg:col-span-3">
              <VehicleGallery
                mainImage={vehicle.image_url}
                galleryImages={vehicle.image_gallery || vehicle.gallery_urls || []}
                vehicleName={vehicle.name}
                isUpcoming={vehicle.is_upcoming}
                isLatest={vehicle.is_latest}
              />
            </div>

            {/* Info Panel - Right 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              {/* Brand & Title */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {manufacturer && (
                    <Link
                      href={`/manufacturers/${manufacturer.slug}`}
                      className="text-xs font-semibold text-[#145a2c] bg-green-50 px-2.5 py-1 rounded hover:bg-green-100 transition-colors"
                    >
                      {manufacturer.name}
                    </Link>
                  )}
                  <span className="text-xs text-gray-500">{getVehicleTypeLabel(vehicle.type)}</span>
                  <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded ml-auto', getSegmentColor(vehicle.segment))}>
                    {getSegmentLabel(vehicle.segment)}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  {vehicle.name}
                  {selectedVariant && selectedVariant.name !== vehicle.name && (
                    <span className="text-sm font-medium text-gray-500 ml-2">- {selectedVariant.short_name || selectedVariant.name}</span>
                  )}
                </h1>
              </div>

              {/* Price Display */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Ex-showroom Price</div>
                    <div className="text-2xl font-bold text-[#145a2c]">{formatPrice(displayValues.price)}</div>
                  </div>
                  {selectedVariant && variants.length > 1 && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Selected Variant</div>
                      <div className="text-sm font-medium text-gray-700">{selectedVariant.short_name || selectedVariant.name}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Specs Grid - Compact */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <Zap size={14} className="mx-auto text-amber-500 mb-1" />
                  <div className="text-sm font-bold text-gray-900">{displayValues.range_km}<span className="text-xs font-normal text-gray-500">km</span></div>
                  <div className="text-[10px] text-gray-500">Range</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <Battery size={14} className="mx-auto text-green-500 mb-1" />
                  <div className="text-sm font-bold text-gray-900">{displayValues.battery_capacity_kwh}<span className="text-xs font-normal text-gray-500">kWh</span></div>
                  <div className="text-[10px] text-gray-500">Battery</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <Gauge size={14} className="mx-auto text-blue-500 mb-1" />
                  <div className="text-sm font-bold text-gray-900">{displayValues.top_speed_kmh}<span className="text-xs font-normal text-gray-500">km/h</span></div>
                  <div className="text-[10px] text-gray-500">Top Speed</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <Clock size={14} className="mx-auto text-purple-500 mb-1" />
                  <div className="text-sm font-bold text-gray-900">{displayValues.charging_time_hrs}<span className="text-xs font-normal text-gray-500">hrs</span></div>
                  <div className="text-[10px] text-gray-500">Charge</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="grid grid-cols-3 gap-2">
                <Link
                  href={`/compare?vehicles=${vehicle.slug}${selectedVariant ? `&variants=${selectedVariant.id}` : ''}`}
                  className="flex items-center justify-center gap-1.5 border border-[#145a2c] text-[#145a2c] rounded-lg py-2.5 text-xs font-semibold hover:bg-green-50 transition-colors"
                >
                  <Scale size={14} /> Compare
                </Link>
                <Link
                  href="/emi-calculator"
                  className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-xs font-semibold hover:bg-gray-200 transition-colors"
                >
                  <Calculator size={14} /> EMI
                </Link>
                <button className="flex items-center justify-center gap-1.5 bg-orange-500 text-white rounded-lg py-2.5 text-xs font-semibold hover:bg-orange-600 transition-colors shadow-sm">
                  <ShoppingBag size={14} /> Get Offer
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Variants Section */}
            {variants.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-100 p-4">
                <VehicleVariantSelector
                  colors={vehicle.colors || []}
                  priceMin={vehicle.price_min}
                  priceMax={vehicle.price_max}
                  vehicleName={vehicle.name}
                  vehicleSlug={vehicle.slug}
                  variants={variants}
                  selectedVariantId={selectedVariant?.id}
                  onVariantChange={setSelectedVariant}
                />
              </section>
            )}

            {/* Specifications Section - Grouped Cards */}
            <section className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap size={16} className="text-[#145a2c]" />
                Specifications & Features
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Performance */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Gauge size={12} className="text-blue-500" /> Performance
                  </h3>
                  <div className="space-y-1.5">
                    <SpecRow label="Range" value={`${displayValues.range_km} km`} />
                    <SpecRow label="Top Speed" value={`${displayValues.top_speed_kmh} km/h`} />
                    <SpecRow label="Motor Power" value={displayValues.motor_power_kw ? `${displayValues.motor_power_kw} kW` : '-'} />
                    <SpecRow label="Acceleration" value="-" />
                  </div>
                </div>

                {/* Battery & Charging */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Battery size={12} className="text-green-500" /> Battery & Charging
                  </h3>
                  <div className="space-y-1.5">
                    <SpecRow label="Capacity" value={`${displayValues.battery_capacity_kwh} kWh`} />
                    <SpecRow label="Type" value="Li-ion" />
                    <SpecRow label="Charging Time" value={`${displayValues.charging_time_hrs} hrs`} />
                    <SpecRow label="Fast Charging" value="-" />
                  </div>
                </div>

                {/* Dimensions */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Scale size={12} className="text-purple-500" /> Dimensions
                  </h3>
                  <div className="space-y-1.5">
                    <SpecRow label="Kerb Weight" value={displayValues.kerb_weight ? `${displayValues.kerb_weight} kg` : '-'} />
                    <SpecRow label="Length" value="-" />
                    <SpecRow label="Width" value="-" />
                    <SpecRow label="Ground Clearance" value="-" />
                  </div>
                </div>

                {/* Additional Specs from JSON */}
                {Object.keys(displayValues.specifications).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Zap size={12} className="text-amber-500" /> Additional Specs
                    </h3>
                    <div className="space-y-1.5">
                      {Object.entries(displayValues.specifications).slice(0, 4).map(([key, value]) => (
                        <SpecRow key={key} label={key} value={String(value)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Features List */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2">Key Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.map((feature: string) => (
                      <span key={feature} className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                        <Check size={10} className="text-green-500" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Pros & Cons */}
            {(vehicle.pros?.length > 0 || vehicle.cons?.length > 0) && (
              <section className="bg-white rounded-xl border border-gray-100 p-4">
                <h2 className="text-base font-bold text-gray-900 mb-4">Pros & Cons</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {vehicle.pros?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                        <ThumbsUp size={12} /> Pros
                      </h3>
                      <ul className="space-y-1.5">
                        {vehicle.pros.map((pro: string) => (
                          <li key={pro} className="flex items-start gap-2 text-sm text-gray-700">
                            <Check size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {vehicle.cons?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                        <ThumbsDown size={12} /> Cons
                      </h3>
                      <ul className="space-y-1.5">
                        {vehicle.cons.map((con: string) => (
                          <li key={con} className="flex items-start gap-2 text-sm text-gray-700">
                            <X size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Compare Section */}
            <section className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-base font-bold text-gray-900 mb-4">Compare with Similar {getVehicleTypeLabel(vehicle.type)}s</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredSimilar.slice(0, 3).map((v) => (
                  <Link
                    key={v.id}
                    href={`/compare?vehicles=${vehicle.slug},${v.slug}`}
                    className="group flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#145a2c] hover:bg-green-50/50 transition-colors"
                  >
                    <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate group-hover:text-[#145a2c]">{v.name}</div>
                      <div className="text-xs text-gray-500">{formatPrice(v.price_min)}</div>
                    </div>
                    <Scale size={16} className="text-gray-300 group-hover:text-[#145a2c] flex-shrink-0" />
                  </Link>
                ))}
              </div>
              <Link
                href={`/compare?vehicles=${vehicle.slug}`}
                className="inline-flex items-center gap-1 mt-3 text-xs text-[#145a2c] font-medium hover:underline"
              >
                Compare with more vehicles <ArrowRight size={12} />
              </Link>
            </section>

            {/* Related News */}
            {news.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Newspaper size={16} className="text-gray-400" /> Related News & Updates
                  </h2>
                  <Link href="/news" className="text-xs text-[#145a2c] font-medium hover:underline">View all</Link>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {news.map((article) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="group flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-gray-500 uppercase">{article.category}</div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-[#145a2c]">{article.title}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-5">
            {/* Price Breakdown */}
            <PriceBreakdown
              exShowroomPrice={displayValues.price}
              vehicleName={vehicle.name}
            />

            {/* Similar Vehicles Card */}
            {filteredSimilar.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Similar {getVehicleTypeLabel(vehicle.type)}s</h3>
                <div className="space-y-3">
                  {filteredSimilar.map((v) => (
                    <Link key={v.id} href={`/vehicles/${v.slug}`} className="block group">
                      <VehicleCard vehicle={v} compact />
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/vehicles?type=${vehicle.type}`}
                  className="block text-center text-xs text-[#145a2c] font-medium mt-3 hover:underline"
                >
                  View all {getVehicleTypeLabel(vehicle.type)}s
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description Section */}
      {vehicle.description && (
        <div className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h2 className="text-base font-bold text-gray-900 mb-3">About {vehicle.name}</h2>
            <div className="prose prose-sm max-w-none text-gray-600">
              <p className="leading-relaxed">{vehicle.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-800">{value}</span>
    </div>
  );
}
