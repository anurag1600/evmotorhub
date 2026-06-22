'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Zap, Gauge, Battery, Clock, Scale, Check as CheckCircle2, X as XCircle, ArrowRight,
  Calendar, MapPin, ChevronDown, Star, Bookmark, Share2, ThumbsUp, ThumbsDown,
  Newspaper, Calculator, ExternalLink, Info
} from 'lucide-react';
import { Vehicle, VehicleVariant, PricingState, PricingCity } from '@/lib/types';
import { formatPrice, formatPriceRange, getVehicleTypeLabel, getSegmentLabel, getSegmentColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import VehicleCard from '@/components/VehicleCard';

interface VehicleDetailClientProps {
  vehicle: Vehicle & { manufacturers: any };
  variants: VehicleVariant[];
  similar: any[];
}

// Sticky navigation sections
const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'variants', label: 'Variants' },
  { id: 'price', label: 'Price' },
  { id: 'specs', label: 'Specs' },
  { id: 'compare', label: 'Compare' },
  { id: 'similar', label: 'Similar' },
];

export default function VehicleDetailClient({ vehicle, variants, similar }: VehicleDetailClientProps) {
  const manufacturer = vehicle.manufacturers;

  // State
  const defaultVariant = variants.find(v => v.is_featured && v.status === 'active') ||
                         variants.find(v => v.status === 'active') ||
                         (variants.length > 0 ? variants[0] : null);
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(defaultVariant);
  const [activeSection, setActiveSection] = useState('overview');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedState, setSelectedState] = useState<PricingState | null>(null);
  const [selectedCity, setSelectedCity] = useState<PricingCity | null>(null);
  const [compareVehicles, setCompareVehicles] = useState<any[]>([]);
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

  // On-road price calculation
  const onRoadPrice = useMemo(() => {
    const rto = selectedCity?.rto_charge || Math.round(displayValues.price * (selectedState?.rto_percentage || 8) / 100);
    const insurance = selectedCity?.insurance_charge || Math.round(displayValues.price * 0.04);
    const roadTax = Math.round(displayValues.price * (selectedState?.road_tax_percentage || 0) / 100);
    const other = selectedCity?.other_charges || selectedState?.other_charges || 1000;
    return {
      exShowroom: displayValues.price,
      rto,
      insurance,
      roadTax,
      other,
      total: displayValues.price + rto + insurance + roadTax + other,
    };
  }, [displayValues.price, selectedState, selectedCity]);

  // Load default location
  useEffect(() => {
    const loadDefaultLocation = async () => {
      const { data: state } = await supabase
        .from('pricing_states')
        .select('*')
        .eq('code', 'DL')
        .maybeSingle();
      if (state) {
        setSelectedState(state as PricingState);
        const { data: city } = await supabase
          .from('pricing_cities')
          .select('*')
          .eq('state_id', state.id)
          .maybeSingle();
        if (city) setSelectedCity(city as PricingCity);
      }
    };
    loadDefaultLocation();
  }, []);

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

  // Filter similar vehicles by same type only
  const filteredSimilar = useMemo(() =>
    similar.filter(v => v.type === vehicle.type).slice(0, 4),
    [similar, vehicle.type]
  );

  // Scroll spy for active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV_SECTIONS.map(s => document.getElementById(s.id));
      const scrollPos = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPos) {
          setActiveSection(NAV_SECTIONS[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1360px] mx-auto px-4">
          <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {NAV_SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors',
                  activeSection === section.id
                    ? 'bg-[#145a2c] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {section.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 flex-shrink-0">
              <button className="p-1.5 text-gray-400 hover:text-[#145a2c] rounded-lg hover:bg-gray-100">
                <Bookmark size={16} />
              </button>
              <button className="p-1.5 text-gray-400 hover:text-[#145a2c] rounded-lg hover:bg-gray-100">
                <Share2 size={16} />
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Breadcrumb - Compact */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1360px] mx-auto px-4 py-2">
          <nav className="flex items-center gap-1 text-xs text-gray-500">
            <Link href="/" className="hover:text-[#145a2c]">Home</Link>
            <span className="text-gray-300">/</span>
            <Link href="/vehicles" className="hover:text-[#145a2c]">Vehicles</Link>
            <span className="text-gray-300">/</span>
            <Link href={`/vehicles?type=${vehicle.type}`} className="hover:text-[#145a2c]">{getVehicleTypeLabel(vehicle.type)}</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">{vehicle.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section - Compact, information dense */}
      <section id="overview" className="bg-white">
        <div className="max-w-[1360px] mx-auto px-4 py-6 lg:py-8">
          <div className="grid lg:grid-cols-[55%_45%] gap-6 lg:gap-8">
            {/* Gallery - Left 55% */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={vehicle.image_url || 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800'}
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                />
                {vehicle.is_upcoming && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-semibold px-2 py-1 rounded">
                    Upcoming
                  </span>
                )}
                {vehicle.is_latest && (
                  <span className="absolute top-3 right-3 bg-[#145a2c] text-white text-[10px] font-semibold px-2 py-1 rounded">
                    New
                  </span>
                )}
              </div>
              {/* Thumbnail strip */}
              {vehicle.image_gallery?.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {[vehicle.image_url, ...vehicle.image_gallery.slice(0, 4)].map((img, i) => (
                    <div key={i} className="w-16 h-12 rounded overflow-hidden flex-shrink-0 border-2 border-gray-200">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info - Right 45% */}
            <div className="space-y-4">
              {/* Brand & Type - Compact */}
              <div className="flex items-center gap-2">
                {manufacturer && (
                  <Link
                    href={`/manufacturers/${manufacturer.slug}`}
                    className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded hover:bg-green-200"
                  >
                    {manufacturer.name}
                  </Link>
                )}
                <span className="text-xs text-gray-500">{getVehicleTypeLabel(vehicle.type)}</span>
                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded ml-auto', getSegmentColor(vehicle.segment))}>
                  {getSegmentLabel(vehicle.segment)}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                {vehicle.name}
                {selectedVariant && (
                  <span className="text-base font-semibold text-gray-500 ml-2">{selectedVariant.short_name || selectedVariant.name}</span>
                )}
              </h1>

              {/* Price - Inline */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-[#145a2c]">
                  {formatPrice(displayValues.price)}
                </span>
                <span className="text-xs text-gray-500">ex-showroom</span>
                <span className="text-xs text-gray-400">•</span>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="text-xs text-[#145a2c] hover:underline flex items-center gap-1"
                >
                  <MapPin size={12} />
                  {selectedCity?.name || 'Delhi'}
                  <ChevronDown size={10} />
                </button>
              </div>

              {/* On-Road Price Preview */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">On-Road Price</span>
                  <span className="text-lg font-bold text-gray-900">{formatPrice(onRoadPrice.total)}</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  incl. RTO ({formatPrice(onRoadPrice.rto)}) + Insurance ({formatPrice(onRoadPrice.insurance)})
                </div>
              </div>

              {/* Quick Specs - Inline grid */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: Zap, value: displayValues.range_km, unit: 'km', label: 'Range' },
                  { icon: Battery, value: displayValues.battery_capacity_kwh, unit: 'kWh', label: 'Battery' },
                  { icon: Gauge, value: displayValues.top_speed_kmh, unit: 'km/h', label: 'Speed' },
                  { icon: Clock, value: displayValues.charging_time_hrs, unit: 'hrs', label: 'Charge' },
                ].map((spec, i) => (
                  <div key={i} className="text-center">
                    <spec.icon size={14} className="mx-auto text-gray-400 mb-1" />
                    <div className="text-sm font-bold text-gray-900">{spec.value}{spec.unit}</div>
                    <div className="text-[10px] text-gray-500">{spec.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-2">
                <Link
                  href={`/compare?vehicles=${vehicle.slug}${selectedVariant ? `&variants=${selectedVariant.id}` : ''}`}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-[#145a2c] text-[#145a2c] rounded-lg py-2.5 text-xs font-semibold hover:bg-green-50"
                >
                  <Scale size={14} /> Compare
                </Link>
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 text-white rounded-lg py-2.5 text-xs font-semibold hover:bg-orange-600">
                  Get Best Offer
                </button>
                <Link
                  href="/emi-calculator"
                  className="flex items-center justify-center gap-1.5 bg-[#145a2c] text-white rounded-lg py-2.5 px-4 text-xs font-semibold hover:bg-[#0f4020]"
                >
                  <Calculator size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Variants Section - Horizontal Cards */}
      {variants.length > 0 && (
        <section id="variants" className="bg-gray-50 border-y border-gray-200">
          <div className="max-w-[1360px] mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Variants</h2>
              <span className="text-xs text-gray-500">{variants.length} options</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
              {variants.filter(v => v.status === 'active').map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={cn(
                      'flex-shrink-0 w-[180px] snap-start rounded-lg border p-3 text-left transition-all',
                      isSelected
                        ? 'border-[#145a2c] bg-green-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs font-semibold text-gray-900 truncate">{variant.short_name || variant.name}</div>
                        <div className="text-[10px] text-gray-500">{variant.name}</div>
                      </div>
                      {variant.is_featured && (
                        <Star size={12} className="text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    <div className="text-sm font-bold text-[#145a2c]">{formatPrice(variant.price)}</div>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-[10px] text-gray-600">
                      <div>{variant.range_km} km</div>
                      <div>{variant.battery_capacity_kwh} kWh</div>
                      <div>{variant.top_speed_kmh} km/h</div>
                      <div>{variant.charging_time_hrs}h charge</div>
                    </div>
                    {isSelected && (
                      <div className="mt-2 text-[10px] font-semibold text-[#145a2c] flex items-center gap-1">
                        <CheckCircle2 size={10} /> Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Price Breakdown Section */}
      <section id="price" className="bg-white border-b border-gray-200">
        <div className="max-w-[1360px] mx-auto px-4 py-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">On-Road Price Breakdown</h2>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Price Table */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <PriceRow label="Ex-showroom Price" value={onRoadPrice.exShowroom} />
                <PriceRow label="RTO Charges" value={onRoadPrice.rto} info="Registration & road tax" />
                <PriceRow label="Insurance" value={onRoadPrice.insurance} info="Comprehensive coverage" />
                {onRoadPrice.roadTax > 0 && (
                  <PriceRow label="Road Tax" value={onRoadPrice.roadTax} info="State road tax" />
                )}
                <PriceRow label="Other Charges" value={onRoadPrice.other} info="Handling, registration fees" />
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">On-Road Price</span>
                <span className="text-xl font-bold text-[#145a2c]">{formatPrice(onRoadPrice.total)}</span>
              </div>
            </div>

            {/* Location Selector */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Location</h3>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="text-xs text-[#145a2c] hover:underline flex items-center gap-1"
                >
                  <MapPin size={12} /> Change
                </button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <MapPin size={20} className="text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{selectedCity?.name || 'New Delhi'}</div>
                  <div className="text-xs text-gray-500">{selectedState?.name || 'Delhi'}</div>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                * Prices are indicative. Contact dealer for exact pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Compare Section */}
      <section id="compare" className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-[1360px] mx-auto px-4 py-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Compare with Similar {getVehicleTypeLabel(vehicle.type)}s</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSimilar.slice(0, 3).map((v) => (
              <Link
                key={v.id}
                href={`/compare?vehicles=${vehicle.slug},${v.slug}`}
                className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3 hover:border-[#145a2c] hover:shadow-sm transition-all"
              >
                <div className="w-16 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{v.name}</div>
                  <div className="text-xs text-gray-500">{formatPrice(v.price_min)}</div>
                </div>
                <Scale size={16} className="text-gray-400 flex-shrink-0" />
              </Link>
            ))}
          </div>

          <Link
            href={`/compare?vehicles=${vehicle.slug}`}
            className="inline-flex items-center gap-1 mt-4 text-xs text-[#145a2c] font-medium hover:underline"
          >
            Compare with more vehicles <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      {/* Specifications Section - Grouped */}
      <section id="specs" className="bg-white border-b border-gray-200">
        <div className="max-w-[1360px] mx-auto px-4 py-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Specifications</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Performance */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Zap size={12} className="text-amber-500" /> Performance
              </h3>
              <div className="space-y-1.5">
                <SpecRow label="Range" value={`${displayValues.range_km} km`} />
                <SpecRow label="Top Speed" value={`${displayValues.top_speed_kmh} km/h`} />
                <SpecRow label="Motor Power" value={`${displayValues.motor_power_kw} kW`} />
                <SpecRow label="Acceleration" value="-" />
              </div>
            </div>

            {/* Battery */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Battery size={12} className="text-green-500" /> Battery
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
                <Gauge size={12} className="text-blue-500" /> Dimensions
              </h3>
              <div className="space-y-1.5">
                <SpecRow label="Kerb Weight" value={displayValues.kerb_weight ? `${displayValues.kerb_weight} kg` : '-'} />
                <SpecRow label="Length" value="-" />
                <SpecRow label="Width" value="-" />
                <SpecRow label="Ground Clearance" value="-" />
              </div>
            </div>

            {/* Features */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Info size={12} className="text-purple-500" /> Features
              </h3>
              <div className="space-y-1.5">
                {vehicle.features?.slice(0, 4).map((f: string) => (
                  <div key={f} className="text-[11px] text-gray-600 flex items-center gap-1">
                    <CheckCircle2 size={10} className="text-green-500" />
                    <span className="truncate">{f}</span>
                  </div>
                )) || <SpecRow label="Features" value="-" />}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pros & Cons - Compact */}
      {(vehicle.pros?.length > 0 || vehicle.cons?.length > 0) && (
        <section className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-[1360px] mx-auto px-4 py-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Pros & Cons</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {vehicle.pros?.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
                    <ThumbsUp size={12} /> Pros
                  </h3>
                  <ul className="space-y-1">
                    {vehicle.pros.slice(0, 4).map((pro: string) => (
                      <li key={pro} className="text-xs text-green-800 flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {vehicle.cons?.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <h3 className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-1">
                    <ThumbsDown size={12} /> Cons
                  </h3>
                  <ul className="space-y-1">
                    {vehicle.cons.slice(0, 4).map((con: string) => (
                      <li key={con} className="text-xs text-red-800 flex items-start gap-1.5">
                        <XCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Similar Vehicles Section */}
      <section id="similar" className="bg-white border-b border-gray-200">
        <div className="max-w-[1360px] mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Similar {getVehicleTypeLabel(vehicle.type)}s</h2>
            <Link
              href={`/vehicles?type=${vehicle.type}`}
              className="text-xs text-[#145a2c] font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredSimilar.map((v) => (
              <VehicleCard key={v.id} vehicle={v} compact />
            ))}
          </div>
        </div>
      </section>

      {/* Related News Section */}
      {news.length > 0 && (
        <section className="bg-gray-50">
          <div className="max-w-[1360px] mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Newspaper size={16} className="text-gray-400" /> Related News
              </h2>
              <Link href="/news" className="text-xs text-[#145a2c] font-medium hover:underline">
                View all news
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {news.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow"
                >
                  <div className="aspect-[16/9] bg-gray-100">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <div className="text-xs text-gray-500 mb-1">{article.category}</div>
                    <div className="text-sm font-semibold text-gray-900 line-clamp-2">{article.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowLocationModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Select Location</h3>
              <button onClick={() => setShowLocationModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={20} />
              </button>
            </div>

            <LocationSelector
              onLocationChange={(state, city) => {
                setSelectedState(state);
                setSelectedCity(city);
                setShowLocationModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function PriceRow({ label, value, info }: { label: string; value: number; info?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600">{label}</span>
        {info && (
          <span className="text-[10px] text-gray-400 cursor-help" title={info}>
            <Info size={10} />
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-gray-900">{formatPrice(value)}</span>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className="text-[11px] font-medium text-gray-900">{value}</span>
    </div>
  );
}

function LocationSelector({ onLocationChange }: { onLocationChange: (state: PricingState, city: PricingCity) => void }) {
  const [states, setStates] = useState<PricingState[]>([]);
  const [cities, setCities] = useState<PricingCity[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');

  useEffect(() => {
    const fetchStates = async () => {
      const { data } = await supabase.from('pricing_states').select('*').order('name');
      setStates((data || []) as PricingState[]);
    };
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedStateId) {
      const fetchCities = async () => {
        const { data } = await supabase
          .from('pricing_cities')
          .select('*')
          .eq('state_id', selectedStateId)
          .order('name');
        setCities((data || []) as PricingCity[]);
      };
      fetchCities();
    }
  }, [selectedStateId]);

  const handleSelect = (cityId: string) => {
    const state = states.find(s => s.id === selectedStateId);
    const city = cities.find(c => c.id === cityId);
    if (state && city) {
      onLocationChange(state, city);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">State</label>
        <select
          value={selectedStateId}
          onChange={(e) => setSelectedStateId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">Select State</option>
          {states.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {selectedStateId && cities.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">City</label>
          <div className="grid grid-cols-2 gap-2">
            {cities.map(city => (
              <button
                key={city.id}
                onClick={() => handleSelect(city.id)}
                className="p-2 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-[#145a2c] rounded-lg text-xs text-left transition-colors"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
