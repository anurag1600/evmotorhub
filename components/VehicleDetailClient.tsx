'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Zap, Gauge, Battery, Clock, Scale, CircleCheck as CheckCircle2, Circle as XCircle, ArrowRight, Calendar, Layers, Power } from 'lucide-react';
import { Vehicle, VehicleVariant } from '@/lib/types';
import { formatPrice, formatPriceRange, getVehicleTypeLabel, getSegmentLabel, getSegmentColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import VehicleGallery from '@/components/VehicleGallery';
import VehicleVariantSelector from '@/components/VehicleVariantSelector';
import VehicleCard from '@/components/VehicleCard';

interface VehicleDetailClientProps {
  vehicle: Vehicle & { manufacturers: any };
  variants: VehicleVariant[];
  similar: any[];
}

export default function VehicleDetailClient({ vehicle, variants, similar }: VehicleDetailClientProps) {
  const manufacturer = vehicle.manufacturers;

  // Determine default variant: featured first, then first active variant
  const defaultVariant = variants.find(v => v.is_featured && v.status === 'active') ||
                         variants.find(v => v.status === 'active') ||
                         (variants.length > 0 ? variants[0] : null);

  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(defaultVariant);

  // Use selected variant values if available, otherwise fall back to vehicle values
  const displayValues = {
    price_min: selectedVariant?.price || vehicle.price_min,
    price_max: selectedVariant?.price || vehicle.price_max,
    range_km: selectedVariant?.range_km ?? vehicle.range_km,
    top_speed_kmh: selectedVariant?.top_speed_kmh ?? vehicle.top_speed_kmh,
    battery_capacity_kwh: selectedVariant?.battery_capacity_kwh ?? vehicle.battery_capacity_kwh,
    motor_power_kw: selectedVariant?.motor_power_kw ?? vehicle.motor_power_kw,
    charging_time_hrs: selectedVariant?.charging_time_hrs ?? vehicle.charging_time_hrs,
  };

  const specHighlights = [
    { label: 'Range', value: `${displayValues.range_km} km`, icon: Zap, color: 'text-green-600 bg-green-50' },
    { label: 'Top Speed', value: `${displayValues.top_speed_kmh} kmh`, icon: Gauge, color: 'text-blue-600 bg-blue-50' },
    { label: 'Battery', value: `${displayValues.battery_capacity_kwh} kWh`, icon: Battery, color: 'text-amber-600 bg-amber-50' },
    { label: 'Charge Time', value: `${displayValues.charging_time_hrs} hrs`, icon: Clock, color: 'text-teal-600 bg-teal-50' },
    { label: 'Motor', value: `${displayValues.motor_power_kw} kW`, icon: Zap, color: 'text-rose-600 bg-rose-50' },
    { label: 'Starting Price', value: formatPrice(displayValues.price_min), icon: null, color: 'text-[#145a2c] bg-green-50' },
  ];

  const handleVariantChange = (variant: VehicleVariant | null) => {
    setSelectedVariant(variant);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-[#145a2c]">Home</Link>
            <span>/</span>
            <Link href="/vehicles" className="hover:text-[#145a2c]">Vehicles</Link>
            <span>/</span>
            <Link href={`/vehicles?type=${vehicle.type}`} className="hover:text-[#145a2c]">{getVehicleTypeLabel(vehicle.type)}</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{vehicle.name}</span>
            {selectedVariant && (
              <>
                <span>/</span>
                <span className="text-gray-600">{selectedVariant.name}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Image Gallery */}
            <VehicleGallery
              mainImage={vehicle.image_url || 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800'}
              galleryImages={(vehicle.image_gallery && vehicle.image_gallery.length > 0 ? vehicle.image_gallery : vehicle.gallery_urls || [])}
              vehicleName={vehicle.name}
              isUpcoming={vehicle.is_upcoming}
              isLatest={vehicle.is_latest}
            />

            {/* Details */}
            <div>
              {/* Brand + Type */}
              <div className="flex items-center gap-2 mb-3">
                {manufacturer && (
                  <Link href={`/manufacturers/${manufacturer.slug}`} className="text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-full transition-colors">
                    {manufacturer.name}
                  </Link>
                )}
                <span className="text-sm text-gray-500">{getVehicleTypeLabel(vehicle.type)}</span>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full ml-auto', getSegmentColor(vehicle.segment))}>
                  {getSegmentLabel(vehicle.segment)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
                {vehicle.name}
                {selectedVariant && (
                  <span className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-500 ml-2">
                    {selectedVariant.short_name || selectedVariant.name}
                  </span>
                )}
              </h1>

              {/* Price */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-5 border border-green-100">
                <div className="text-xs text-gray-500 mb-1">
                  {vehicle.is_upcoming ? 'Expected Price (ex-showroom)' : 'Price (ex-showroom)'}
                </div>
                <div className="text-3xl font-extrabold text-[#145a2c]">
                  {selectedVariant
                    ? formatPrice(selectedVariant.price)
                    : formatPriceRange(vehicle.price_min, vehicle.price_max)
                  }
                </div>
                {selectedVariant && selectedVariant.status !== 'active' && (
                  <div className="text-xs text-amber-600 mt-1">
                    Status: {selectedVariant.status}
                  </div>
                )}
                {vehicle.launch_date && vehicle.is_upcoming && (
                  <div className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                    <Calendar size={11} />
                    Expected: {new Date(vehicle.launch_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>

              {/* Spec Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
                {specHighlights.map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className={cn('rounded-xl p-3 text-center', color)}>
                    {Icon && <Icon size={16} className="mx-auto mb-1" />}
                    <div className="text-base sm:text-lg font-bold">{value}</div>
                    <div className="text-xs opacity-70">{label}</div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex gap-3">
                <Link
                  href={`/compare?vehicles=${vehicle.slug}${selectedVariant ? `&variants=${selectedVariant.id}` : ''}`}
                  className="flex-1 flex items-center justify-center gap-2 border border-[#145a2c] text-[#145a2c] rounded-xl py-2.5 text-sm font-semibold hover:bg-green-50 transition-colors"
                >
                  <Scale size={15} /> Compare
                </Link>
                <Link
                  href="/emi-calculator"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#145a2c] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#0f4020] transition-colors"
                >
                  <Zap size={15} /> EMI Calculator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variants Section - BikeDekho Style */}
      {(vehicle.colors && vehicle.colors.length > 0 || variants.length > 0) && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Layers size={20} className="text-[#145a2c]" />
                Variants & Prices
              </h2>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {variants.length > 0 ? `${variants.length} variants` : `${vehicle.colors?.length || 0} colors`}
              </span>
            </div>

            <VehicleVariantSelector
              colors={vehicle.colors || []}
              priceMin={vehicle.price_min}
              priceMax={vehicle.price_max}
              vehicleName={vehicle.name}
              vehicleSlug={vehicle.slug}
              variants={variants}
              onVariantChange={handleVariantChange}
              selectedVariantId={selectedVariant?.id}
            />
          </div>
        </div>
      )}

      {/* Spec Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Overview / Description */}
            {vehicle.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Overview</h2>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{vehicle.description}</p>
              </div>
            )}

            {/* Variant-specific specs */}
            {selectedVariant?.specifications && Object.keys(selectedVariant.specifications).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-3">{selectedVariant.name} Specifications</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.entries(selectedVariant.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">{key}</span>
                      <span className="text-sm text-gray-900 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vehicle Specs Table */}
            {vehicle.specifications && Object.keys(vehicle.specifications).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Full Specifications</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {Object.entries(vehicle.specifications).map(([key, value], i) => (
                    <div key={key} className={cn('flex justify-between px-5 py-3', i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                      <span className="text-sm text-gray-600 font-medium">{key}</span>
                      <span className="text-sm text-gray-900 font-semibold text-right max-w-xs">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            {vehicle.features && vehicle.features.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Key Features</h2>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {vehicle.features.map((feature: string) => (
                    <div key={feature} className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pros & Cons */}
            {(vehicle.pros?.length > 0 || vehicle.cons?.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {vehicle.pros?.length > 0 && (
                  <div className="bg-green-50 rounded-2xl border border-green-100 p-5">
                    <h3 className="text-base font-bold text-green-800 mb-3">Pros</h3>
                    <ul className="space-y-2">
                      {vehicle.pros.map((pro: string) => (
                        <li key={pro} className="flex items-start gap-2 text-sm text-green-800">
                          <CheckCircle2 size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {vehicle.cons?.length > 0 && (
                  <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
                    <h3 className="text-base font-bold text-red-800 mb-3">Cons</h3>
                    <ul className="space-y-2">
                      {vehicle.cons.map((con: string) => (
                        <li key={con} className="flex items-start gap-2 text-sm text-red-800">
                          <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5 lg:sticky lg:top-4">
            {/* Manufacturer Card */}
            {manufacturer && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Manufacturer</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 relative rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={manufacturer.logo_url || manufacturer.hero_image_url}
                      alt={manufacturer.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{manufacturer.name}</div>
                    <div className="text-xs text-gray-500">{manufacturer.headquarters}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 line-clamp-3 mb-3">{manufacturer.description}</p>
                <Link href={`/manufacturers/${manufacturer.slug}`} className="flex items-center gap-1 text-sm text-[#145a2c] font-medium hover:gap-2 transition-all">
                  View all models <ArrowRight size={13} />
                </Link>
              </div>
            )}

            {/* Quick Tools */}
            <div className="bg-gradient-to-br from-[#0f4020] to-[#145a2c] rounded-2xl p-5 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wide mb-3 text-green-200">Buying Tools</h3>
              <div className="space-y-3">
                <Link href={`/compare?vehicles=${vehicle.slug}${selectedVariant ? `&variants=${selectedVariant.id}` : ''}`} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl p-3 transition-colors text-sm">
                  <Scale size={15} className="text-green-300" />
                  Compare with another EV
                </Link>
                <Link href="/emi-calculator" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl p-3 transition-colors text-sm">
                  <Zap size={15} className="text-green-300" />
                  Calculate EMI
                </Link>
                <Link href="/charging-stations" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl p-3 transition-colors text-sm">
                  <Battery size={15} className="text-green-300" />
                  Find Charging Stations
                </Link>
              </div>
            </div>

            {/* Core Specs Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">At a Glance</h3>
              <div className="space-y-3">
                {[
                  { label: 'Type', value: getVehicleTypeLabel(vehicle.type) },
                  { label: 'Segment', value: getSegmentLabel(vehicle.segment) },
                  { label: 'Range', value: `${displayValues.range_km} km` },
                  { label: 'Top Speed', value: `${displayValues.top_speed_kmh} kmh` },
                  { label: 'Battery', value: `${displayValues.battery_capacity_kwh} kWh` },
                  { label: 'Motor Power', value: `${displayValues.motor_power_kw} kW` },
                  { label: 'Charging Time', value: `${displayValues.charging_time_hrs} hours` },
                  ...(selectedVariant?.kerb_weight ? [{ label: 'Kerb Weight', value: `${selectedVariant.kerb_weight} kg` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-sm font-semibold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Vehicles */}
        {similar.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Similar {getVehicleTypeLabel(vehicle.type)}s</h2>
              <Link href={`/vehicles?type=${vehicle.type}`} className="flex items-center gap-1 text-sm text-[#145a2c] font-medium hover:gap-2 transition-all">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similar.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
