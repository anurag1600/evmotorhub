'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap, Gauge, Battery, Clock, MapPin, ChevronRight, Scale, Calculator, ShoppingBag,
  ThumbsUp, ThumbsDown, Check, X, ChevronDown, Search, TrendingUp, Award, Fuel, Weight, ChevronLeft, Palette
} from 'lucide-react';
import { Vehicle, VehicleVariant, PricingState, PricingCity, NewsArticle } from '@/lib/types';
import { formatPrice, getVehicleTypeLabel, getSegmentLabel, getSegmentColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import OfferEnquiryModal from '@/components/OfferEnquiryModal';

interface VehicleDetailClientProps {
  vehicle: Vehicle & { manufacturers: any };
  variants: VehicleVariant[];
  similar: any[];
}

export default function VehicleDetailClient({ vehicle, variants, similar }: VehicleDetailClientProps) {
  const manufacturer = vehicle.manufacturers;

  // State
  const defaultVariant = variants.find(v => v.is_featured && v.status === 'active') ||
                         variants.find(v => v.status === 'active') ||
                         (variants.length > 0 ? variants[0] : null);
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(defaultVariant);
  const [selectedCity, setSelectedCity] = useState<PricingCity | null>(null);
  const [selectedState, setSelectedState] = useState<PricingState | null>(null);

  // Gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const galleryImages = useMemo(() => {
    const imgs = [vehicle.image_url, ...(vehicle.image_gallery || vehicle.gallery_urls || [])].filter(Boolean);
    return imgs.length > 0 ? imgs : ['/placeholder-vehicle.png'];
  }, [vehicle]);

  // Modals
  const [showCityModal, setShowCityModal] = useState(false);
  const [showEMIModal, setShowEMIModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Data
  const [relatedNews, setRelatedNews] = useState<NewsArticle[]>([]);
  const [adminSimilarVehicles, setAdminSimilarVehicles] = useState<any[]>([]);
  const [cities, setCities] = useState<PricingCity[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [advertisement, setAdvertisement] = useState<any>(null);

  // EMI
  const [emiDownPayment, setEmiDownPayment] = useState(0);
  const [emiInterestRate, setEmiInterestRate] = useState(9.5);
  const [emiTenure, setEmiTenure] = useState(36);

  // All colors from vehicle and variants
  const allColors = useMemo(() => {
    const colorSet = new Set<string>();
    if (vehicle.colors) vehicle.colors.forEach(c => colorSet.add(c));
    variants.forEach(v => {
      if (v.colors) v.colors.forEach(c => colorSet.add(c));
      if (v.color) colorSet.add(v.color);
    });
    return Array.from(colorSet);
  }, [vehicle, variants]);

  // Display values
  const display = useMemo(() => ({
    price: selectedVariant?.price || vehicle.price_min,
    range_km: selectedVariant?.range_km ?? vehicle.range_km,
    top_speed_kmh: selectedVariant?.top_speed_kmh ?? vehicle.top_speed_kmh,
    battery_capacity_kwh: selectedVariant?.battery_capacity_kwh ?? vehicle.battery_capacity_kwh,
    motor_power_kw: selectedVariant?.motor_power_kw ?? vehicle.motor_power_kw,
    charging_time_hrs: selectedVariant?.charging_time_hrs ?? vehicle.charging_time_hrs,
    kerb_weight: selectedVariant?.kerb_weight,
    specifications: selectedVariant?.specifications || vehicle.specifications || {},
  }), [selectedVariant, vehicle]);

  // Price calculation
  const priceBreakdown = useMemo(() => {
    const base = display.price;
    const rto = selectedCity?.rto_charge || Math.round(base * (selectedState?.rto_percentage || 8) / 100);
    const insurance = selectedCity?.insurance_charge || Math.round(base * 0.04);
    const roadTax = Math.round(base * (selectedState?.road_tax_percentage || 0) / 100);
    const other = selectedCity?.other_charges || selectedState?.other_charges || 1000;
    const subsidy = selectedState?.subsidy_amount || 0;
    const onRoadPrice = base + rto + insurance + roadTax + other - subsidy;
    return { exShowroom: base, rto, insurance, roadTax, other, subsidy, onRoadPrice };
  }, [display.price, selectedState, selectedCity]);

  // EMI calculation
  const emiResult = useMemo(() => {
    const principal = priceBreakdown.onRoadPrice - emiDownPayment;
    const monthlyRate = emiInterestRate / 12 / 100;
    const emi = principal > 0 ? Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, emiTenure)) / (Math.pow(1 + monthlyRate, emiTenure) - 1)) : 0;
    return { emi, principal, totalAmount: emi * emiTenure, totalInterest: emi * emiTenure - principal };
  }, [priceBreakdown.onRoadPrice, emiDownPayment, emiInterestRate, emiTenure]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (vehicle.related_news_ids?.length) {
        const { data } = await supabase.from('news').select('*').in('id', vehicle.related_news_ids).eq('status', 'published');
        if (data) setRelatedNews(vehicle.related_news_ids!.map(id => data.find(n => n.id === id)).filter(Boolean) as NewsArticle[]);
      } else {
        const { data } = await supabase.from('news').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(4);
        if (data) setRelatedNews(data as NewsArticle[]);
      }

      if (vehicle.similar_vehicle_ids?.length) {
        const { data } = await supabase.from('vehicles').select('*, manufacturers(name, slug)').in('id', vehicle.similar_vehicle_ids);
        if (data) setAdminSimilarVehicles(vehicle.similar_vehicle_ids!.map(id => data.find(v => v.id === id)).filter(Boolean));
      } else {
        setAdminSimilarVehicles(similar.filter(v => v.type === vehicle.type).slice(0, 4));
      }

      const { data: allCities } = await supabase.from('pricing_cities').select('*, state:pricing_states(*)').eq('is_active', true).order('is_popular', { ascending: false }).order('name');
      if (allCities) setCities(allCities as PricingCity[]);

      const { data: ads } = await supabase.from('advertisements').select('*').eq('is_active', true).eq('placement', 'sidebar').gte('end_date', new Date().toISOString()).order('created_at', { ascending: false }).limit(1);
      if (ads && ads.length > 0) setAdvertisement(ads[0]);

      const stored = typeof window !== 'undefined' ? localStorage.getItem('selectedCity') : null;
      if (stored) {
        try { const parsed = JSON.parse(stored); if (parsed?.id) { setSelectedCity(parsed); if (parsed.state) setSelectedState(parsed.state); } } catch {}
      } else {
        const { data: state } = await supabase.from('pricing_states').select('*').eq('code', 'DL').maybeSingle();
        if (state) { setSelectedState(state as PricingState); const { data: city } = await supabase.from('pricing_cities').select('*').eq('state_id', state.id).eq('is_popular', true).maybeSingle(); if (city) setSelectedCity(city as PricingCity); }
      }
    };
    fetchData();
  }, [vehicle, similar]);

  useEffect(() => { setEmiDownPayment(Math.round(priceBreakdown.onRoadPrice * 0.1)); }, [priceBreakdown.onRoadPrice]);
  useEffect(() => { if (selectedCity && typeof window !== 'undefined') localStorage.setItem('selectedCity', JSON.stringify(selectedCity)); }, [selectedCity]);

  const popularCities = useMemo(() => cities.filter(c => c.is_popular).slice(0, 8), [cities]);
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cities.slice(0, 20);
    const s = citySearch.toLowerCase();
    return cities.filter(c => c.name.toLowerCase().includes(s) || c.pincode?.includes(s) || c.state?.name?.toLowerCase().includes(s)).slice(0, 20);
  }, [cities, citySearch]);

  const activeVariants = variants.filter(v => v.status === 'active');

  const handleSelectCity = useCallback((city: PricingCity) => { setSelectedCity(city); if (city.state) setSelectedState(city.state as PricingState); setShowCityModal(false); setCitySearch(''); }, []);
  const handleSelectVariant = useCallback((v: VehicleVariant) => { setSelectedVariant(v); }, []);

  const nextImage = useCallback(() => setCurrentImageIndex(i => (i + 1) % galleryImages.length), [galleryImages.length]);
  const prevImage = useCallback(() => setCurrentImageIndex(i => (i - 1 + galleryImages.length) % galleryImages.length), [galleryImages.length]);

  const getColorHex = (name: string): string => {
    const map: Record<string, string> = { black: '#1a1a1a', white: '#f5f5f5', silver: '#c0c0c0', grey: '#808080', gray: '#808080', blue: '#1e40af', red: '#dc2626', green: '#16a34a', orange: '#ea580c', yellow: '#eab308', brown: '#78350f', gold: '#ffd700', teal: '#0d9488', purple: '#7c3aed', cyan: '#06b6d4', pink: '#ec4899' };
    const n = name.toLowerCase().trim();
    for (const [k, v] of Object.entries(map)) if (n.includes(k)) return v;
    return '#9ca3af';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500 overflow-x-auto">
            <Link href="/" className="hover:text-[#145a2c] whitespace-nowrap">Home</Link>
            <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
            <Link href="/vehicles" className="hover:text-[#145a2c] whitespace-nowrap">Vehicles</Link>
            <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
            <Link href={`/vehicles?type=${vehicle.type}`} className="hover:text-[#145a2c] whitespace-nowrap">{getVehicleTypeLabel(vehicle.type)}</Link>
            <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
            <span className="text-gray-900 font-medium truncate">{vehicle.name}</span>
          </nav>
        </div>
      </div>

      {/* HERO SECTION - Full Width */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Gallery */}
            <div className="w-full lg:w-1/2">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 group">
                <img src={galleryImages[currentImageIndex]} alt={vehicle.name} className="w-full h-full object-cover" />
                {galleryImages.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                      <ChevronLeft size={20} className="text-gray-700" />
                    </button>
                    <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                      <ChevronRight size={20} className="text-gray-700" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {galleryImages.map((_, i) => (
                        <button key={i} onClick={() => setCurrentImageIndex(i)} className={cn('w-2.5 h-2.5 rounded-full transition-all', i === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80')} />
                      ))}
                    </div>
                  </>
                )}
                {vehicle.is_upcoming && (
                  <span className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg">Upcoming</span>
                )}
                {vehicle.is_latest && !vehicle.is_upcoming && (
                  <span className="absolute top-4 left-4 bg-[#145a2c] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg">New Launch</span>
                )}
              </div>

              {/* Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                  {galleryImages.map((img, i) => (
                    <button key={i} onClick={() => setCurrentImageIndex(i)} className={cn('w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border-2 transition-all', i === currentImageIndex ? 'border-[#145a2c] ring-2 ring-green-200' : 'border-transparent hover:border-gray-300')}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="w-full lg:w-1/2 space-y-5">
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2">
                {manufacturer && (
                  <Link href={`/manufacturers/${manufacturer.slug}`} className="text-sm font-semibold text-[#145a2c] bg-green-50 px-3 py-1 rounded-full hover:bg-green-100 transition-colors">
                    {manufacturer.name}
                  </Link>
                )}
                <span className={cn('text-xs font-medium px-3 py-1 rounded-full', getSegmentColor(vehicle.segment))}>
                  {getSegmentLabel(vehicle.segment)}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {getVehicleTypeLabel(vehicle.type)}
                </span>
              </div>

              {/* Name */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{vehicle.name}</h1>

              {/* Colors displayed inline */}
              {allColors.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                  <Palette size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Colours:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {allColors.map((color, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full">
                        <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: getColorHex(color) }} />
                        <span className="text-xs font-medium text-gray-700">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variant selector if multiple variants */}
              {activeVariants.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {activeVariants.map((v) => (
                    <button key={v.id} onClick={() => handleSelectVariant(v)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', selectedVariant?.id === v.id ? 'bg-[#145a2c] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                      {v.short_name || v.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <Zap size={20} className="mx-auto text-amber-600 mb-1" />
                  <p className="text-xs text-gray-500">Range</p>
                  <p className="font-bold text-gray-900">{display.range_km} km</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <Battery size={20} className="mx-auto text-green-600 mb-1" />
                  <p className="text-xs text-gray-500">Battery</p>
                  <p className="font-bold text-gray-900">{display.battery_capacity_kwh} kWh</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <Gauge size={20} className="mx-auto text-blue-600 mb-1" />
                  <p className="text-xs text-gray-500">Top Speed</p>
                  <p className="font-bold text-gray-900">{display.top_speed_kmh} km/h</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <Clock size={20} className="mx-auto text-purple-600 mb-1" />
                  <p className="text-xs text-gray-500">Charging</p>
                  <p className="font-bold text-gray-900">{display.charging_time_hrs} hrs</p>
                </div>
              </div>

              {/* Price Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Ex-showroom Price</p>
                    <p className="text-3xl font-bold text-[#145a2c]">{formatPrice(display.price)}</p>
                    {vehicle.price_min !== vehicle.price_max && vehicle.price_max > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">{formatPrice(vehicle.price_min)} - {formatPrice(vehicle.price_max)}</p>
                    )}
                  </div>
                  <button onClick={() => setShowCityModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg text-xs font-medium border hover:shadow-sm transition-all">
                    <MapPin size={12} /> {selectedCity?.name || 'City'} <ChevronDown size={12} />
                  </button>
                </div>
                <div className="bg-white/70 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600">On-road Price</span>
                  <span className="text-xl font-bold text-gray-900">{formatPrice(priceBreakdown.onRoadPrice)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 mt-3">
                  <Calculator size={14} className="text-[#145a2c]" />
                  <span>EMI from <strong className="text-[#145a2c]">{formatPrice(emiResult.emi)}/mo</strong></span>
                  <button onClick={() => setShowEMIModal(true)} className="text-[#145a2c] hover:underline text-xs font-medium ml-auto">Calculate</button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/compare?vehicles=${vehicle.slug}`} className="flex items-center justify-center gap-2 border-2 border-[#145a2c] text-[#145a2c] rounded-xl py-3.5 font-semibold hover:bg-[#145a2c] hover:text-white transition-all">
                  <Scale size={18} /> Compare
                </Link>
                <button onClick={() => setShowOfferModal(true)} className="flex items-center justify-center gap-2 bg-orange-500 text-white rounded-xl py-3.5 font-semibold hover:bg-orange-600 transition-colors">
                  <ShoppingBag size={18} /> Get Offers
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT AREA - Two Column Layout (starts after hero) */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT COLUMN - Content Sections */}
          <div className="w-full lg:w-[65%] space-y-6">

            {/* ABOUT Section */}
            {vehicle.description && (
              <section className="bg-white rounded-2xl border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About {vehicle.name}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{vehicle.description}</p>
              </section>
            )}

            {/* SPECIFICATIONS Section */}
            <section className="bg-white rounded-2xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Award size={22} className="text-[#145a2c]" /> Specifications
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {display.range_km > 0 && (
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                    <div className="flex items-center gap-3"><Zap size={18} className="text-amber-600" /><span className="text-gray-700">Range</span></div>
                    <span className="font-bold text-gray-900">{display.range_km} km</span>
                  </div>
                )}
                {display.battery_capacity_kwh > 0 && (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-3"><Battery size={18} className="text-green-600" /><span className="text-gray-700">Battery</span></div>
                    <span className="font-bold text-gray-900">{display.battery_capacity_kwh} kWh</span>
                  </div>
                )}
                {display.top_speed_kmh > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-3"><Gauge size={18} className="text-blue-600" /><span className="text-gray-700">Top Speed</span></div>
                    <span className="font-bold text-gray-900">{display.top_speed_kmh} km/h</span>
                  </div>
                )}
                {display.motor_power_kw > 0 && (
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                    <div className="flex items-center gap-3"><Fuel size={18} className="text-orange-600" /><span className="text-gray-700">Motor Power</span></div>
                    <span className="font-bold text-gray-900">{display.motor_power_kw} kW</span>
                  </div>
                )}
                {display.charging_time_hrs > 0 && (
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center gap-3"><Clock size={18} className="text-purple-600" /><span className="text-gray-700">Charging Time</span></div>
                    <span className="font-bold text-gray-900">{display.charging_time_hrs} hrs</span>
                  </div>
                )}
                {display.kerb_weight && display.kerb_weight > 0 && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3"><Weight size={18} className="text-gray-600" /><span className="text-gray-700">Kerb Weight</span></div>
                    <span className="font-bold text-gray-900">{display.kerb_weight} kg</span>
                  </div>
                )}
                {Object.entries(display.specifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="text-gray-700">{key}</span>
                    <span className="font-bold text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
              {display.range_km === 0 && display.battery_capacity_kwh === 0 && Object.keys(display.specifications).length === 0 && (
                <p className="text-gray-500 text-center py-8">No specifications available.</p>
              )}
            </section>

            {/* FEATURES Section */}
            {vehicle.features && vehicle.features.length > 0 && (
              <section className="bg-white rounded-2xl border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Features & Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehicle.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <div className="w-6 h-6 bg-[#145a2c] rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={14} className="text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PROS & CONS Section */}
            {(vehicle.pros?.length > 0 || vehicle.cons?.length > 0) && (
              <section className="bg-white rounded-2xl border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Pros & Cons</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {vehicle.pros?.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                      <h3 className="text-sm font-semibold text-green-700 flex items-center gap-2 mb-4"><ThumbsUp size={16} /> Pros</h3>
                      <ul className="space-y-3">{vehicle.pros.map((p, i) => <li key={i} className="flex gap-2 text-sm text-gray-700"><Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />{p}</li>)}</ul>
                    </div>
                  )}
                  {vehicle.cons?.length > 0 && (
                    <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                      <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-4"><ThumbsDown size={16} /> Cons</h3>
                      <ul className="space-y-3">{vehicle.cons.map((c, i) => <li key={i} className="flex gap-2 text-sm text-gray-700"><X size={16} className="text-red-400 mt-0.5 flex-shrink-0" />{c}</li>)}</ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* VARIANTS Section */}
            <section className="bg-white rounded-2xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Variants</h2>
              {activeVariants.length > 0 ? (
                <div className="space-y-4">
                  {activeVariants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <div key={v.id} className={cn('border rounded-xl p-4 transition-all', isSelected ? 'border-[#145a2c] bg-green-50' : 'border-gray-200 hover:border-gray-300')}>
                        <div className="flex flex-col sm:flex-row gap-4">
                          {v.image_url && (
                            <img src={v.image_url} alt={v.name} className="w-full sm:w-32 h-24 rounded-lg object-cover bg-gray-100" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-bold text-gray-900">{v.short_name || v.name}</h3>
                                {v.short_name && <p className="text-xs text-gray-500">{v.name}</p>}
                              </div>
                              <p className="text-xl font-bold text-[#145a2c]">{formatPrice(v.price)}</p>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
                              {v.range_km && <span className="flex items-center gap-1"><Zap size={12} /> {v.range_km} km</span>}
                              {v.battery_capacity_kwh && <span className="flex items-center gap-1"><Battery size={12} /> {v.battery_capacity_kwh} kWh</span>}
                              {v.top_speed_kmh && <span className="flex items-center gap-1"><Gauge size={12} /> {v.top_speed_kmh} km/h</span>}
                              {v.charging_time_hrs && <span className="flex items-center gap-1"><Clock size={12} /> {v.charging_time_hrs}h</span>}
                            </div>
                            <button onClick={() => handleSelectVariant(v)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', isSelected ? 'bg-[#145a2c] text-white' : 'bg-gray-100 text-gray-700 hover:bg-[#145a2c] hover:text-white')}>
                              {isSelected ? 'Selected' : 'Select Variant'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No variants available for this vehicle.</p>
              )}
            </section>

            {/* PRICE BREAKDOWN Section */}
            <section className="bg-white rounded-2xl border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><TrendingUp size={22} className="text-[#145a2c]" /> On-Road Price Breakdown</h2>
                <button onClick={() => setShowCityModal(true)} className="flex items-center gap-1.5 text-sm text-[#145a2c] hover:underline font-medium"><MapPin size={14} />{selectedCity?.name || 'Select City'}</button>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Ex-showroom</span><span className="text-sm font-medium text-gray-900">{formatPrice(priceBreakdown.exShowroom)}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">RTO Charges</span><span className="text-sm font-medium text-gray-900">{formatPrice(priceBreakdown.rto)}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Insurance</span><span className="text-sm font-medium text-gray-900">{formatPrice(priceBreakdown.insurance)}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Road Tax</span><span className="text-sm font-medium text-gray-900">{formatPrice(priceBreakdown.roadTax)}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-600">Other Charges</span><span className="text-sm font-medium text-gray-900">{formatPrice(priceBreakdown.other)}</span></div>
                  {priceBreakdown.subsidy > 0 && <div className="flex justify-between"><span className="text-sm text-gray-600">EV Subsidy</span><span className="text-sm font-medium text-green-600">-{formatPrice(priceBreakdown.subsidy)}</span></div>}
                </div>
                <div className="mt-5 pt-4 border-t-2 border-gray-200 flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total On-Road Price</span>
                  <span className="text-2xl font-bold text-[#145a2c]">{formatPrice(priceBreakdown.onRoadPrice)}</span>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR - Sticky */}
          <div className="w-full lg:w-[35%]">
            <div className="lg:sticky lg:top-20 space-y-6">

              {/* 1. GET OFFER Card */}
              <section className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                <h3 className="font-bold text-xl mb-2">Get Best Offers</h3>
                <p className="text-sm text-orange-100 mb-4">Exclusive deals from authorized dealers in your city</p>
                <button onClick={() => setShowOfferModal(true)} className="w-full bg-white text-orange-600 rounded-xl py-3.5 font-bold hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 shadow-lg">
                  <ShoppingBag size={18} />Get Offers Now
                </button>
                <p className="text-xs text-orange-200 mt-3 text-center">Free • No commitment</p>
              </section>

              {/* 2. SIMILAR VEHICLES */}
              {adminSimilarVehicles.length > 0 && (
                <section className="bg-white rounded-2xl border p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Similar {getVehicleTypeLabel(vehicle.type)}s</h3>
                  <div className="space-y-4">
                    {adminSimilarVehicles.slice(0, 4).map((v) => (
                      <Link key={v.id} href={`/vehicles/${v.slug}`} className="block group">
                        <div className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                          {v.image_url ? (
                            <img src={v.image_url} alt={v.name} className="w-20 h-20 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Zap size={24} className="text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <p className="font-semibold text-gray-900 group-hover:text-[#145a2c] transition-colors truncate">{v.name}</p>
                            <p className="text-xs text-gray-500">{v.manufacturers?.name}</p>
                            <p className="text-base font-bold text-[#145a2c] mt-1">{formatPrice(v.price_min)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href={`/vehicles?type=${vehicle.type}`} className="block text-center text-sm text-[#145a2c] font-semibold mt-4 hover:underline py-2 border-t border-gray-100">
                    View all {getVehicleTypeLabel(vehicle.type)}s →
                  </Link>
                </section>
              )}

              {/* 3. RELATED NEWS */}
              {relatedNews.length > 0 && (
                <section className="bg-white rounded-2xl border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Related News</h3>
                    <Link href="/news" className="text-sm text-[#145a2c] font-medium hover:underline">View all</Link>
                  </div>
                  <div className="space-y-4">
                    {relatedNews.slice(0, 3).map((article) => (
                      <Link key={article.id} href={`/news/${article.slug}`} className="block group">
                        <div className="flex gap-3">
                          <img src={article.image_url} alt="" className="w-16 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">{article.category}</p>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-[#145a2c] line-clamp-2 transition-colors">{article.title}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* 4. ADVERTISEMENT (Square) */}
              {advertisement && (
                <section className="bg-white rounded-2xl border overflow-hidden">
                  <div className="text-[10px] text-gray-400 text-center py-1.5 bg-gray-50 uppercase tracking-wide">Advertisement</div>
                  {advertisement.image_url && (
                    <a href={advertisement.link_url || '#'} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={advertisement.image_url} alt={advertisement.title} className="w-full aspect-square object-cover" />
                    </a>
                  )}
                </section>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg lg:hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div><p className="text-xs text-gray-500">On-road Price</p><p className="text-lg font-bold text-[#145a2c]">{formatPrice(priceBreakdown.onRoadPrice)}</p></div>
          <div className="flex gap-2">
            <button onClick={() => setShowEMIModal(true)} className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold hover:bg-gray-200">EMI {formatPrice(emiResult.emi)}</button>
            <button onClick={() => setShowOfferModal(true)} className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600">Get Offer</button>
          </div>
        </div>
      </div>
      <div className="h-20 lg:hidden" />

      {/* Modals */}
      {showCityModal && <CityModal cities={cities} popularCities={popularCities} filteredCities={filteredCities} selectedCity={selectedCity} citySearch={citySearch} setCitySearch={setCitySearch} onSelect={handleSelectCity} onClose={() => setShowCityModal(false)} />}
      {showEMIModal && <EMIModal priceBreakdown={priceBreakdown} emiDownPayment={emiDownPayment} setEmiDownPayment={setEmiDownPayment} emiInterestRate={emiInterestRate} setEmiInterestRate={setEmiInterestRate} emiTenure={emiTenure} setEmiTenure={setEmiTenure} emiResult={emiResult} onGetOffer={() => { setShowEMIModal(false); setShowOfferModal(true); }} onClose={() => setShowEMIModal(false)} />}
      <OfferEnquiryModal vehicleId={vehicle.id} vehicleName={vehicle.name} vehiclePrice={priceBreakdown.onRoadPrice} variantName={selectedVariant?.short_name || selectedVariant?.name} selectedCity={selectedCity?.name} isOpen={showOfferModal} onClose={() => setShowOfferModal(false)} />
    </div>
  );
}

// Modal Components
function CityModal({ cities, popularCities, filteredCities, selectedCity, citySearch, setCitySearch, onSelect, onClose }: { cities: PricingCity[]; popularCities: PricingCity[]; filteredCities: PricingCity[]; selectedCity: PricingCity | null; citySearch: string; setCitySearch: (v: string) => void; onSelect: (c: PricingCity) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b"><h3 className="text-lg font-bold">Select Your City</h3><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-400" /></button></div>
        <div className="p-4">
          <div className="relative mb-4"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Enter city or pincode" className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]" autoFocus /></div>
          <div className="mb-4"><h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Popular Cities</h4><div className="flex flex-wrap gap-2">{popularCities.map((c) => <button key={c.id} onClick={() => onSelect(c)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', selectedCity?.id === c.id ? 'bg-[#145a2c] text-white' : 'bg-gray-100 hover:bg-green-50 hover:text-[#145a2c]')}>{c.name}</button>)}</div></div>
          {citySearch && <div className="max-h-48 overflow-y-auto space-y-1">{filteredCities.map((c) => <button key={c.id} onClick={() => onSelect(c)} className={cn('w-full text-left px-4 py-3 rounded-lg transition-colors flex justify-between', selectedCity?.id === c.id ? 'bg-green-50 text-[#145a2c]' : 'hover:bg-gray-50')}><div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-gray-500">{c.state?.name || c.pincode}</p></div>{selectedCity?.id === c.id && <Check size={16} className="text-[#145a2c]" />}</button>)}</div>}
        </div>
      </div>
    </div>
  );
}

function EMIModal({ priceBreakdown, emiDownPayment, setEmiDownPayment, emiInterestRate, setEmiInterestRate, emiTenure, setEmiTenure, emiResult, onGetOffer, onClose }: { priceBreakdown: any; emiDownPayment: number; setEmiDownPayment: (v: number) => void; emiInterestRate: number; setEmiInterestRate: (v: number) => void; emiTenure: number; setEmiTenure: (v: number) => void; emiResult: any; onGetOffer: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b"><h3 className="text-lg font-bold">EMI Calculator</h3><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-400" /></button></div>
        <div className="p-4 space-y-5">
          <div><p className="text-xs text-gray-600 mb-1">Vehicle Price (On-road)</p><p className="text-lg font-bold">{formatPrice(priceBreakdown.onRoadPrice)}</p></div>
          <div><label className="text-xs text-gray-600 mb-2 block">Down Payment: <strong className="text-[#145a2c]">{formatPrice(emiDownPayment)}</strong></label><input type="range" min={0} max={priceBreakdown.onRoadPrice * 0.5} step={5000} value={emiDownPayment} onChange={(e) => setEmiDownPayment(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#145a2c]" /></div>
          <div><label className="text-xs text-gray-600 mb-2 block">Interest Rate: <strong className="text-[#145a2c]">{emiInterestRate}%</strong> p.a.</label><input type="range" min={5} max={15} step={0.25} value={emiInterestRate} onChange={(e) => setEmiInterestRate(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#145a2c]" /></div>
          <div><label className="text-xs text-gray-600 mb-2 block">Loan Tenure</label><div className="grid grid-cols-4 gap-2">{[12, 24, 36, 48].map((m) => <button key={m} onClick={() => setEmiTenure(m)} className={cn('py-2.5 rounded-lg font-semibold', emiTenure === m ? 'bg-[#145a2c] text-white' : 'bg-gray-100 hover:bg-gray-200')}>{m}mo</button>)}</div></div>
          <div className="bg-gradient-to-br from-[#145a2c] to-[#0f3d1e] rounded-xl p-5 text-white"><p className="text-xs text-green-200 mb-1">Monthly EMI</p><p className="text-3xl font-bold">{formatPrice(emiResult.emi)}</p><div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20"><div><p className="text-xs text-green-200">Loan Amount</p><p className="font-semibold">{formatPrice(emiResult.principal)}</p></div><div><p className="text-xs text-green-200">Total Interest</p><p className="font-semibold">{formatPrice(emiResult.totalInterest)}</p></div></div></div>
          <button onClick={onGetOffer} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"><ShoppingBag size={18} />Get Best Offer</button>
        </div>
      </div>
    </div>
  );
}
