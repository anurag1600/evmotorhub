'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Zap, Gauge, Battery, Clock, MapPin, ChevronRight, Scale, Calculator, ShoppingBag, ArrowRight,
  ThumbsUp, ThumbsDown, Check, X, Newspaper, ChevronDown, Star, Play, Palette, Search,
  Loader as Loader2, Info, ExternalLink
} from 'lucide-react';
import { Vehicle, VehicleVariant, PricingState, PricingCity, NewsArticle } from '@/lib/types';
import { formatPrice, getVehicleTypeLabel, getSegmentLabel, getSegmentColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import VehicleGallery from '@/components/VehicleGallery';
import VehicleCard from '@/components/VehicleCard';

interface VehicleDetailClientProps {
  vehicle: Vehicle & { manufacturers: any };
  variants: VehicleVariant[];
  similar: any[];
}

// Popular cities for quick selection
const POPULAR_CITIES = [
  { name: 'Delhi', pincode: '110001' },
  { name: 'Gurgaon', pincode: '122001' },
  { name: 'Noida', pincode: '201301' },
  { name: 'Bengaluru', pincode: '560001' },
  { name: 'Mumbai', pincode: '400001' },
  { name: 'Pune', pincode: '411001' },
  { name: 'Hyderabad', pincode: '500001' },
  { name: 'Chennai', pincode: '600001' },
];

export default function VehicleDetailClient({ vehicle, variants, similar }: VehicleDetailClientProps) {
  const manufacturer = vehicle.manufacturers;

  // State - Core
  const defaultVariant = variants.find(v => v.is_featured && v.status === 'active') ||
                         variants.find(v => v.status === 'active') ||
                         (variants.length > 0 ? variants[0] : null);
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(defaultVariant);
  const [selectedCity, setSelectedCity] = useState<PricingCity | null>(null);
  const [selectedState, setSelectedState] = useState<PricingState | null>(null);

  // Modal state
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showEMIModal, setShowEMIModal] = useState(false);
  const [showColorsModal, setShowColorsModal] = useState(false);

  // Data state
  const [relatedNews, setRelatedNews] = useState<NewsArticle[]>([]);
  const [adminSimilarVehicles, setAdminSimilarVehicles] = useState<any[]>([]);
  const [cities, setCities] = useState<PricingCity[]>([]);
  const [citySearch, setCitySearch] = useState('');

  // EMI state
  const [emiDownPayment, setEmiDownPayment] = useState(0);
  const [emiInterestRate, setEmiInterestRate] = useState(9.5);
  const [emiTenure, setEmiTenure] = useState(36);

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
    image_url: selectedVariant?.image_url || vehicle.image_url,
  }), [selectedVariant, vehicle]);

  // On-road price calculation
  const priceBreakdown = useMemo(() => {
    const rto = selectedCity?.rto_charge || Math.round(displayValues.price * (selectedState?.rto_percentage || 8) / 100);
    const insurance = selectedCity?.insurance_charge || Math.round(displayValues.price * 0.04);
    const roadTax = Math.round(displayValues.price * (selectedState?.road_tax_percentage || 0) / 100);
    const other = selectedCity?.other_charges || selectedState?.other_charges || 1000;
    const subsidy = selectedState?.subsidy_amount || 0;
    const onRoadPrice = displayValues.price + rto + insurance + roadTax + other - subsidy;
    return { exShowroom: displayValues.price, rto, insurance, roadTax, other, subsidy, onRoadPrice };
  }, [displayValues.price, selectedState, selectedCity]);

  // EMI calculation
  const emiResult = useMemo(() => {
    const principal = priceBreakdown.onRoadPrice - emiDownPayment;
    const monthlyRate = emiInterestRate / 12 / 100;
    const emi = principal > 0 ? Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, emiTenure)) / (Math.pow(1 + monthlyRate, emiTenure) - 1)) : 0;
    const totalAmount = emi * emiTenure;
    const totalInterest = totalAmount - principal;
    return { emi, principal, totalInterest, totalAmount };
  }, [priceBreakdown.onRoadPrice, emiDownPayment, emiInterestRate, emiTenure]);

  // Fetch related news (admin-controlled or latest)
  useEffect(() => {
    const fetchRelatedNews = async () => {
      if (vehicle.related_news_ids && vehicle.related_news_ids.length > 0) {
        const { data } = await supabase.from('news').select('*').in('id', vehicle.related_news_ids).eq('status', 'published');
        if (data) {
          const ordered = vehicle.related_news_ids!.map(id => data.find(n => n.id === id)).filter(Boolean);
          setRelatedNews(ordered as NewsArticle[]);
        }
      } else {
        const { data } = await supabase.from('news').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(4);
        setRelatedNews((data || []) as NewsArticle[]);
      }
    };
    fetchRelatedNews();
  }, [vehicle.related_news_ids]);

  // Fetch similar vehicles (admin-controlled or same type)
  useEffect(() => {
    const fetchSimilarVehicles = async () => {
      if (vehicle.similar_vehicle_ids && vehicle.similar_vehicle_ids.length > 0) {
        const { data } = await supabase.from('vehicles').select('*, manufacturers(name, slug)').in('id', vehicle.similar_vehicle_ids);
        if (data) {
          const ordered = vehicle.similar_vehicle_ids!.map(id => data.find(v => v.id === id)).filter(Boolean);
          setAdminSimilarVehicles(ordered);
        }
      } else {
        setAdminSimilarVehicles(similar.filter(v => v.type === vehicle.type).slice(0, 4));
      }
    };
    fetchSimilarVehicles();
  }, [vehicle.similar_vehicle_ids, vehicle.type, similar]);

  // Load default location
  useEffect(() => {
    const loadDefaultLocation = async () => {
      const { data: state } = await supabase.from('pricing_states').select('*').eq('code', 'DL').maybeSingle();
      if (state) {
        setSelectedState(state as PricingState);
        const { data: city } = await supabase.from('pricing_cities').select('*').eq('state_id', state.id).maybeSingle();
        if (city) setSelectedCity(city as PricingCity);
      }
      const { data: allCities } = await supabase.from('pricing_cities').select('*, state:pricing_states(*)').eq('is_active', true).order('name');
      setCities((allCities || []) as PricingCity[]);
    };
    loadDefaultLocation();
  }, []);

  // Update EMI down payment when price changes
  useEffect(() => {
    setEmiDownPayment(Math.round(priceBreakdown.onRoadPrice * 0.1));
  }, [priceBreakdown.onRoadPrice]);

  // City search/filter
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cities.slice(0, 20);
    const searchLower = citySearch.toLowerCase();
    return cities.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.pincode?.includes(citySearch) ||
      c.state?.name?.toLowerCase().includes(searchLower)
    ).slice(0, 20);
  }, [cities, citySearch]);

  const handleSelectCity = useCallback((city: PricingCity) => {
    setSelectedCity(city);
    if (city.state) setSelectedState(city.state as PricingState);
    setShowCityModal(false);
    setCitySearch('');
  }, []);

  const handleSelectVariant = useCallback((variant: VehicleVariant) => {
    setSelectedVariant(variant);
    setShowVariantModal(false);
  }, []);

  // Colors from vehicle data
  const vehicleColors = vehicle.colors || [];
  const hasVideo = vehicle.video_url && vehicle.video_url.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5">
          <nav className="flex items-center gap-1 text-xs text-gray-500 overflow-x-auto">
            <Link href="/" className="hover:text-[#145a2c] whitespace-nowrap">Home</Link>
            <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
            <Link href="/vehicles" className="hover:text-[#145a2c] whitespace-nowrap">Vehicles</Link>
            <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
            <Link href={`/vehicles?type=${vehicle.type}`} className="hover:text-[#145a2c] whitespace-nowrap">{getVehicleTypeLabel(vehicle.type)}</Link>
            <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
            <span className="text-gray-900 font-medium truncate">{vehicle.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section - 2 Column */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Left - Gallery */}
            <div className="lg:col-span-3">
              <VehicleGallery
                mainImage={displayValues.image_url || vehicle.image_url}
                galleryImages={vehicle.image_gallery || vehicle.gallery_urls || []}
                vehicleName={vehicle.name}
                isUpcoming={vehicle.is_upcoming}
                isLatest={vehicle.is_latest}
              />
              {/* Colors & Video buttons */}
              <div className="flex gap-2 mt-3">
                {vehicleColors.length > 0 && (
                  <button
                    onClick={() => setShowColorsModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
                  >
                    <Palette size={14} />
                    {vehicleColors.length} {vehicleColors.length === 1 ? 'Colour' : 'Colours'}
                  </button>
                )}
                {hasVideo && (
                  <a
                    href={vehicle.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Play size={14} />
                    Watch Video
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>

            {/* Right - Info Panel */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {/* Brand & Title */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {manufacturer && (
                    <Link href={`/manufacturers/${manufacturer.slug}`} className="text-xs font-semibold text-[#145a2c] bg-green-50 px-2.5 py-1 rounded hover:bg-green-100 transition-colors">
                      {manufacturer.name}
                    </Link>
                  )}
                  <span className="text-xs text-gray-500">{getVehicleTypeLabel(vehicle.type)}</span>
                  <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded', getSegmentColor(vehicle.segment))}>
                    {getSegmentLabel(vehicle.segment)}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                  {vehicle.name}
                </h1>
              </div>

              {/* Single Price Display */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 border border-green-100">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Ex-showroom Price</div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#145a2c]">{formatPrice(displayValues.price)}</div>
                  </div>
                  <div className="sm:text-right">
                    <button onClick={() => setShowCityModal(true)} className="text-xs text-[#145a2c] hover:underline flex items-center gap-0.5 mb-0.5">
                      <MapPin size={10} />
                      {selectedCity?.name || 'Select City'}
                    </button>
                    <div className="text-xs text-gray-500">On-road: <span className="font-semibold text-gray-900">{formatPrice(priceBreakdown.onRoadPrice)}</span></div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  EMI starts from <span className="font-bold text-[#145a2c]">{formatPrice(emiResult.emi)}/month</span>
                  <button onClick={() => setShowEMIModal(true)} className="ml-1 text-[#145a2c] hover:underline">Calculate</button>
                </div>
              </div>

              {/* Variant Selector Button */}
              {variants.length > 1 && (
                <button onClick={() => setShowVariantModal(true)} className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl hover:border-[#145a2c] hover:bg-green-50/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-[#145a2c]" />
                    <div className="text-left">
                      <div className="text-xs text-gray-500">Variant</div>
                      <div className="text-sm font-semibold text-gray-900">{selectedVariant?.short_name || selectedVariant?.name || 'Select'}</div>
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
              )}

              {/* Quick Specs */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                <div className="bg-gray-50 rounded-lg p-2 sm:p-2.5 text-center">
                  <Zap size={14} className="mx-auto text-amber-500 mb-1" />
                  <div className="text-xs sm:text-sm font-bold text-gray-900">{displayValues.range_km}<span className="text-[10px] font-normal text-gray-500 hidden sm:inline">km</span></div>
                  <div className="text-[10px] text-gray-500">Range</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 sm:p-2.5 text-center">
                  <Battery size={14} className="mx-auto text-green-500 mb-1" />
                  <div className="text-xs sm:text-sm font-bold text-gray-900">{displayValues.battery_capacity_kwh}<span className="text-[10px] font-normal text-gray-500 hidden sm:inline">kWh</span></div>
                  <div className="text-[10px] text-gray-500">Battery</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 sm:p-2.5 text-center">
                  <Gauge size={14} className="mx-auto text-blue-500 mb-1" />
                  <div className="text-xs sm:text-sm font-bold text-gray-900">{displayValues.top_speed_kmh}<span className="text-[10px] font-normal text-gray-500 hidden sm:inline">km/h</span></div>
                  <div className="text-[10px] text-gray-500">Speed</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 sm:p-2.5 text-center">
                  <Clock size={14} className="mx-auto text-purple-500 mb-1" />
                  <div className="text-xs sm:text-sm font-bold text-gray-900">{displayValues.charging_time_hrs}<span className="text-[10px] font-normal text-gray-500 hidden sm:inline">hrs</span></div>
                  <div className="text-[10px] text-gray-500">Charge</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Link href={`/compare?vehicles=${vehicle.slug}${selectedVariant ? `&variants=${selectedVariant.id}` : ''}`} className="flex items-center justify-center gap-1 sm:gap-1.5 border border-[#145a2c] text-[#145a2c] rounded-lg py-2 sm:py-2.5 text-xs font-semibold hover:bg-green-50 transition-colors">
                  <Scale size={14} /> <span className="hidden sm:inline">Compare</span><span className="sm:hidden">Compare</span>
                </Link>
                <button onClick={() => setShowEMIModal(true)} className="flex items-center justify-center gap-1 sm:gap-1.5 bg-gray-100 text-gray-700 rounded-lg py-2 sm:py-2.5 text-xs font-semibold hover:bg-gray-200 transition-colors">
                  <Calculator size={14} /> EMI
                </button>
                <button className="flex items-center justify-center gap-1 sm:gap-1.5 bg-orange-500 text-white rounded-lg py-2 sm:py-2.5 text-xs font-semibold hover:bg-orange-600 transition-colors shadow-sm">
                  <ShoppingBag size={14} /> <span className="hidden sm:inline">Get Offer</span><span className="sm:hidden">Offer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price Breakdown Section - Single, Clean */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calculator size={16} className="text-[#145a2c]" />
              On-Road Price in <button onClick={() => setShowCityModal(true)} className="text-[#145a2c] hover:underline">{selectedCity?.name || 'Delhi'}</button>
            </h2>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <div className="flex justify-between sm:block">
                <span className="text-xs text-gray-500">Ex-showroom</span>
                <span className="text-sm font-semibold text-gray-900 sm:mt-1 sm:block">{formatPrice(priceBreakdown.exShowroom)}</span>
              </div>
              <div className="flex justify-between sm:block">
                <span className="text-xs text-gray-500">RTO</span>
                <span className="text-sm font-semibold text-gray-900 sm:mt-1 sm:block">{formatPrice(priceBreakdown.rto)}</span>
              </div>
              <div className="flex justify-between sm:block">
                <span className="text-xs text-gray-500">Insurance</span>
                <span className="text-sm font-semibold text-gray-900 sm:mt-1 sm:block">{formatPrice(priceBreakdown.insurance)}</span>
              </div>
              <div className="flex justify-between sm:block">
                <span className="text-xs text-gray-500">Other & Reg.</span>
                <span className="text-sm font-semibold text-gray-900 sm:mt-1 sm:block">{formatPrice(priceBreakdown.other)}</span>
              </div>
            </div>
            {priceBreakdown.subsidy > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-green-600">
                EV Subsidy: -{formatPrice(priceBreakdown.subsidy)}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Total On-Road Price</span>
              <span className="text-xl sm:text-2xl font-bold text-[#145a2c]">{formatPrice(priceBreakdown.onRoadPrice)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-5">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left - 2 columns */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            {/* About */}
            {vehicle.description && (
              <section className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
                <h2 className="text-base font-bold text-gray-900 mb-2 sm:mb-3">About {vehicle.name}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{vehicle.description}</p>
              </section>
            )}

            {/* Specifications */}
            <section className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
              <h2 className="text-base font-bold text-gray-900 mb-3 sm:mb-4">Specifications</h2>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
                  <h3 className="text-xs font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5"><Gauge size={12} className="text-blue-500" /> Performance</h3>
                  <div className="space-y-1">
                    <SpecRow label="Range" value={`${displayValues.range_km} km`} />
                    <SpecRow label="Top Speed" value={`${displayValues.top_speed_kmh} km/h`} />
                    <SpecRow label="Motor Power" value={displayValues.motor_power_kw ? `${displayValues.motor_power_kw} kW` : '-'} />
                    <SpecRow label="Kerb Weight" value={displayValues.kerb_weight ? `${displayValues.kerb_weight} kg` : '-'} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 sm:p-3">
                  <h3 className="text-xs font-semibold text-gray-700 mb-1.5 sm:mb-2 flex items-center gap-1.5"><Battery size={12} className="text-green-500" /> Battery</h3>
                  <div className="space-y-1">
                    <SpecRow label="Capacity" value={`${displayValues.battery_capacity_kwh} kWh`} />
                    <SpecRow label="Charging Time" value={`${displayValues.charging_time_hrs} hrs`} />
                    <SpecRow label="Type" value="Li-ion" />
                  </div>
                </div>
              </div>
              {/* Additional specs */}
              {Object.keys(displayValues.specifications).length > 0 && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2">Additional Specs</h3>
                  <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(displayValues.specifications).map(([key, value]) => (
                      <SpecRow key={key} label={key} value={String(value)} />
                    ))}
                  </div>
                </div>
              )}
              {/* Features */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2">Key Features</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {vehicle.features.map((f: string) => (
                      <span key={f} className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        <Check size={10} />{f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Pros & Cons */}
            {(vehicle.pros?.length > 0 || vehicle.cons?.length > 0) && (
              <section className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
                <h2 className="text-base font-bold text-gray-900 mb-3 sm:mb-4">Pros & Cons</h2>
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  {vehicle.pros?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1"><ThumbsUp size={12} /> Pros</h3>
                      <ul className="space-y-1">
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
                      <h3 className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1"><ThumbsDown size={12} /> Cons</h3>
                      <ul className="space-y-1">
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

            {/* Compare Similar */}
            {adminSimilarVehicles.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
                <h2 className="text-base font-bold text-gray-900 mb-3 sm:mb-4">Compare with Similar {getVehicleTypeLabel(vehicle.type)}s</h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                  {adminSimilarVehicles.slice(0, 4).map((v) => (
                    <Link key={v.id} href={`/compare?vehicles=${vehicle.slug},${v.slug}`} className="group flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-gray-100 hover:border-[#145a2c] hover:bg-green-50/50 transition-colors">
                      <div className="w-12 sm:w-14 h-8 sm:h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate group-hover:text-[#145a2c]">{v.name}</div>
                        <div className="text-xs text-gray-500">{formatPrice(v.price_min)}</div>
                      </div>
                      <Scale size={14} className="text-gray-300 group-hover:text-[#145a2c] flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Related News */}
            {relatedNews.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><Newspaper size={16} className="text-gray-400" /> Related News</h2>
                  <Link href="/news" className="text-xs text-[#145a2c] font-medium hover:underline">View all</Link>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {relatedNews.map((article) => (
                    <Link key={article.id} href={`/news/${article.slug}`} className="group flex flex-col gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] text-gray-500 uppercase">{article.category}</div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-[#145a2c]">{article.title}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar - Similar Vehicles only */}
          {adminSimilarVehicles.length > 0 && (
            <div className="space-y-4 sm:space-y-5">
              <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Similar {getVehicleTypeLabel(vehicle.type)}s</h3>
                <div className="space-y-2 sm:space-y-3">
                  {adminSimilarVehicles.slice(0, 3).map((v) => (
                    <Link key={v.id} href={`/vehicles/${v.slug}`} className="block group">
                      <VehicleCard vehicle={v} compact />
                    </Link>
                  ))}
                </div>
                <Link href={`/vehicles?type=${vehicle.type}`} className="block text-center text-xs text-[#145a2c] font-medium mt-3 hover:underline">
                  View all {getVehicleTypeLabel(vehicle.type)}s
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Variant Selection Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50" onClick={() => setShowVariantModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Select Variant</h3>
              <button onClick={() => setShowVariantModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-3 sm:p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {variants.filter(v => v.status === 'active').map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button key={variant.id} onClick={() => handleSelectVariant(variant)} className={cn('text-left p-3 sm:p-4 rounded-xl border-2 transition-all', isSelected ? 'border-[#145a2c] bg-green-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm')}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        {variant.image_url ? <img src={variant.image_url} alt={variant.name} className="w-full h-16 sm:h-20 rounded-lg object-cover bg-gray-100" /> : <div className="w-full h-16 sm:h-20 rounded-lg bg-gray-100 flex items-center justify-center"><Zap size={20} className="text-gray-300" /></div>}
                      </div>
                      <div className="font-semibold text-gray-900 text-sm">{variant.short_name || variant.name}</div>
                      <div className="text-lg font-bold text-[#145a2c]">{formatPrice(variant.price)}</div>
                      <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-gray-600">
                        {variant.range_km && <div className="flex items-center gap-1"><Zap size={10} />{variant.range_km} km</div>}
                        {variant.battery_capacity_kwh && <div className="flex items-center gap-1"><Battery size={10} />{variant.battery_capacity_kwh} kWh</div>}
                      </div>
                      {isSelected && <div className="mt-2 text-xs font-semibold text-[#145a2c] flex items-center gap-1"><Check size={10} /> Selected</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* City Selection Modal */}
      {showCityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50" onClick={() => setShowCityModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Select Your City</h3>
              <button onClick={() => setShowCityModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-3 sm:p-4">
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Enter your city or pincode" className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]" autoFocus />
              </div>
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Popular Cities</h4>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_CITIES.map((city) => {
                    const cityData = cities.find(c => c.name.toLowerCase() === city.name.toLowerCase() || c.pincode === city.pincode);
                    return (
                      <button key={city.name} onClick={() => cityData && handleSelectCity(cityData)} className="px-3 py-1.5 bg-gray-100 hover:bg-green-50 rounded-lg text-xs font-medium text-gray-700 hover:text-[#145a2c] transition-colors">
                        {city.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              {citySearch && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Search Results</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filteredCities.length === 0 ? <div className="text-sm text-gray-500 text-center py-4">No cities found</div> : filteredCities.map((city) => (
                      <button key={city.id} onClick={() => handleSelectCity(city)} className={cn('w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between', selectedCity?.id === city.id ? 'bg-green-50 text-[#145a2c]' : 'hover:bg-gray-50')}>
                        <div>
                          <div className="text-sm font-medium">{city.name}</div>
                          <div className="text-xs text-gray-500">{city.state?.name || city.pincode}</div>
                        </div>
                        {selectedCity?.id === city.id && <Check size={16} className="text-[#145a2c]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EMI Calculator Modal */}
      {showEMIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50" onClick={() => setShowEMIModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">EMI Calculator</h3>
              <button onClick={() => setShowEMIModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-3 sm:p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Price</label>
                <div className="text-lg font-bold text-gray-900">{formatPrice(priceBreakdown.onRoadPrice)}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Down Payment: {formatPrice(emiDownPayment)}</label>
                <input type="range" min={0} max={priceBreakdown.onRoadPrice * 0.5} step={5000} value={emiDownPayment} onChange={(e) => setEmiDownPayment(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#145a2c]" />
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>0</span><span>{formatPrice(Math.round(priceBreakdown.onRoadPrice * 0.5))}</span></div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Interest Rate: {emiInterestRate}% p.a.</label>
                <input type="range" min={5} max={15} step={0.25} value={emiInterestRate} onChange={(e) => setEmiInterestRate(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#145a2c]" />
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>5%</span><span>15%</span></div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Loan Tenure</label>
                <div className="grid grid-cols-4 gap-2">
                  {[12, 24, 36, 48].map((months) => (
                    <button key={months} onClick={() => setEmiTenure(months)} className={cn('py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors', emiTenure === months ? 'bg-[#145a2c] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                      {months} mo
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-r from-[#145a2c] to-[#0a2e14] rounded-xl p-4 text-white">
                <div className="text-xs text-green-200 mb-1">Monthly EMI</div>
                <div className="text-2xl sm:text-3xl font-bold">{formatPrice(emiResult.emi)}</div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20 text-sm">
                  <div><div className="text-green-200">Loan Amount</div><div className="font-semibold">{formatPrice(emiResult.principal)}</div></div>
                  <div><div className="text-green-200">Total Interest</div><div className="font-semibold">{formatPrice(emiResult.totalInterest)}</div></div>
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors">
                <ShoppingBag size={16} />Get Best Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Colors Modal */}
      {showColorsModal && vehicleColors.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50" onClick={() => setShowColorsModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Available Colours</h3>
              <button onClick={() => setShowColorsModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {vehicleColors.map((color) => (
                  <div key={color} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: getColorHex(color) }}></div>
                    <span className="text-sm font-medium text-gray-700">{color}</span>
                  </div>
                ))}
              </div>
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

function getColorHex(colorName: string): string {
  const colorSwatchMap: Record<string, string> = {
    black: '#1a1a1a', midnight: '#0a0a0a', obsidian: '#1c1c1c',
    white: '#f5f5f5', pearl: '#f0ebe3', glacier: '#e8f4f8',
    silver: '#c0c0c0', metallic: '#a8a8a8', grey: '#808080', gray: '#808080',
    graphite: '#4a4a4a', slate: '#708090',
    blue: '#1e40af', navy: '#1e3a5f', ocean: '#0077b6', celestial: '#4a90d9',
    red: '#dc2626', crimson: '#b91c1c', scarlet: '#ff2400', maroon: '#800000',
    green: '#16a34a', olive: '#556b2f', forest: '#228b22', emerald: '#047857',
    teal: '#0d9488', bronze: '#cd7f32', copper: '#b87333', gold: '#ffd700',
    champagne: '#f7e7ce', orange: '#ea580c', amber: '#d97706', yellow: '#eab308',
    purple: '#7c3aed', violet: '#8b5cf6', brown: '#78350f', tan: '#d2b48c', beige: '#f5f5dc',
  };
  const normalized = colorName.toLowerCase().trim();
  for (const [key, hex] of Object.entries(colorSwatchMap)) {
    if (normalized.includes(key)) return hex;
  }
  return '#9ca3af';
}
