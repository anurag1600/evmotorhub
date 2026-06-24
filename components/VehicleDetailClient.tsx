'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Zap, Gauge, Battery, Clock, MapPin, ChevronRight, Scale, Calculator, ShoppingBag,
  ThumbsUp, ThumbsDown, Check, X, Newspaper, ChevronDown, Star, Play, Palette, Search,
  ExternalLink, TrendingUp, Award, Settings, Timer, Weight, Fuel, Users
} from 'lucide-react';
import { Vehicle, VehicleVariant, PricingState, PricingCity, NewsArticle } from '@/lib/types';
import { formatPrice, getVehicleTypeLabel, getSegmentLabel, getSegmentColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import VehicleCard from '@/components/VehicleCard';
import OfferEnquiryModal from '@/components/OfferEnquiryModal';

interface VehicleDetailClientProps {
  vehicle: Vehicle & { manufacturers: any };
  variants: VehicleVariant[];
  similar: any[];
}

type TabType = 'overview' | 'specs' | 'features' | 'variants' | 'colors';

export default function VehicleDetailClient({ vehicle, variants, similar }: VehicleDetailClientProps) {
  const manufacturer = vehicle.manufacturers;

  // State
  const defaultVariant = variants.find(v => v.is_featured && v.status === 'active') ||
                         variants.find(v => v.status === 'active') ||
                         (variants.length > 0 ? variants[0] : null);
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(defaultVariant);
  const [selectedCity, setSelectedCity] = useState<PricingCity | null>(null);
  const [selectedState, setSelectedState] = useState<PricingState | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Modals
  const [showCityModal, setShowCityModal] = useState(false);
  const [showEMIModal, setShowEMIModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);

  // Data
  const [relatedNews, setRelatedNews] = useState<NewsArticle[]>([]);
  const [adminSimilarVehicles, setAdminSimilarVehicles] = useState<any[]>([]);
  const [cities, setCities] = useState<PricingCity[]>([]);
  const [citySearch, setCitySearch] = useState('');

  // EMI
  const [emiDownPayment, setEmiDownPayment] = useState(0);
  const [emiInterestRate, setEmiInterestRate] = useState(9.5);
  const [emiTenure, setEmiTenure] = useState(36);

  // Display values from selected variant or vehicle defaults
  const display = useMemo(() => ({
    price: selectedVariant?.price || vehicle.price_min,
    range_km: selectedVariant?.range_km ?? vehicle.range_km,
    top_speed_kmh: selectedVariant?.top_speed_kmh ?? vehicle.top_speed_kmh,
    battery_capacity_kwh: selectedVariant?.battery_capacity_kwh ?? vehicle.battery_capacity_kwh,
    motor_power_kw: selectedVariant?.motor_power_kw ?? vehicle.motor_power_kw,
    charging_time_hrs: selectedVariant?.charging_time_hrs ?? vehicle.charging_time_hrs,
    kerb_weight: selectedVariant?.kerb_weight,
    specifications: selectedVariant?.specifications || vehicle.specifications || {},
    image_url: selectedVariant?.image_url || vehicle.image_url,
    variant_colors: selectedVariant?.colors || (selectedVariant?.color ? [selectedVariant.color] : []),
    variant_color_hexes: selectedVariant?.color_hexes || (selectedVariant?.color_hex ? [selectedVariant.color_hex] : []),
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

  // Fetch related content
  useEffect(() => {
    const fetchData = async () => {
      // Related news
      if (vehicle.related_news_ids?.length) {
        const { data } = await supabase.from('news').select('*').in('id', vehicle.related_news_ids).eq('status', 'published');
        if (data) setRelatedNews(vehicle.related_news_ids!.map(id => data.find(n => n.id === id)).filter(Boolean) as NewsArticle[]);
      } else {
        const { data } = await supabase.from('news').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(4);
        if (data) setRelatedNews(data as NewsArticle[]);
      }

      // Similar vehicles
      if (vehicle.similar_vehicle_ids?.length) {
        const { data } = await supabase.from('vehicles').select('*, manufacturers(name, slug)').in('id', vehicle.similar_vehicle_ids);
        if (data) setAdminSimilarVehicles(vehicle.similar_vehicle_ids!.map(id => data.find(v => v.id === id)).filter(Boolean));
      } else {
        setAdminSimilarVehicles(similar.filter(v => v.type === vehicle.type).slice(0, 4));
      }

      // Cities
      const { data: allCities } = await supabase.from('pricing_cities').select('*, state:pricing_states(*)').eq('is_active', true).order('is_popular', { ascending: false }).order('name');
      if (allCities) setCities(allCities as PricingCity[]);

      // Default city
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

  const vehicleColors = vehicle.colors || [];
  const hasVideo = vehicle.video_url && vehicle.video_url.length > 0;
  const activeVariants = variants.filter(v => v.status === 'active');

  const handleSelectCity = useCallback((city: PricingCity) => { setSelectedCity(city); if (city.state) setSelectedState(city.state as PricingState); setShowCityModal(false); setCitySearch(''); }, []);
  const handleSelectVariant = useCallback((v: VehicleVariant) => { setSelectedVariant(v); setShowVariantModal(false); }, []);

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'specs' as const, label: 'Specifications' },
    { id: 'features' as const, label: 'Features', count: vehicle.features?.length || 0 },
    { id: 'variants' as const, label: 'Variants', count: activeVariants.length },
    { id: 'colors' as const, label: 'Colours', count: vehicleColors.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 overflow-x-auto">
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

      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Gallery */}
            <div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                {display.image_url ? (
                  <img src={display.image_url} alt={vehicle.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Zap size={48} />
                  </div>
                )}
                {vehicle.is_upcoming && (
                  <span className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Upcoming</span>
                )}
                {vehicle.is_latest && !vehicle.is_upcoming && (
                  <span className="absolute top-4 left-4 bg-[#145a2c] text-white text-xs font-bold px-3 py-1.5 rounded-lg">New Launch</span>
                )}
              </div>

              {/* Gallery thumbnails */}
              {(vehicle.image_gallery?.length > 0 || vehicle.gallery_urls?.length > 0) && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {[vehicle.image_url, ...(vehicle.image_gallery || vehicle.gallery_urls || [])].filter(Boolean).slice(0, 5).map((img, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-transparent hover:border-[#145a2c] cursor-pointer transition-colors">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Quick action buttons */}
              <div className="flex flex-wrap gap-2 mt-4">
                {vehicleColors.length > 0 && (
                  <button onClick={() => setActiveTab('colors')} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:border-[#145a2c] hover:text-[#145a2c] transition-colors">
                    <Palette size={16} /> {vehicleColors.length} Colours
                  </button>
                )}
                {hasVideo && (
                  <a href={vehicle.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                    <Play size={16} /> Watch Review <ExternalLink size={12} />
                  </a>
                )}
                {activeVariants.length > 1 && (
                  <button onClick={() => setShowVariantModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    <Settings size={16} /> {activeVariants.length} Variants
                  </button>
                )}
              </div>
            </div>

            {/* Info Panel */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {manufacturer && (
                    <Link href={`/manufacturers/${manufacturer.slug}`} className="text-sm font-semibold text-[#145a2c] bg-green-50 px-3 py-1 rounded-full hover:bg-green-100 transition-colors">
                      {manufacturer.name}
                    </Link>
                  )}
                  <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', getSegmentColor(vehicle.segment))}>
                    {getSegmentLabel(vehicle.segment)}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    {getVehicleTypeLabel(vehicle.type)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{vehicle.name}</h1>
                {selectedVariant && selectedVariant.name !== vehicle.name && (
                  <p className="text-gray-500 mt-1">{selectedVariant.short_name || selectedVariant.name}</p>
                )}
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
                  <button onClick={() => setShowCityModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium border hover:shadow-sm transition-all">
                    <MapPin size={12} /> {selectedCity?.name || 'Select City'} <ChevronDown size={12} />
                  </button>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">On-road Price</span>
                    <span className="text-xl font-bold text-gray-900">{formatPrice(priceBreakdown.onRoadPrice)}</span>
                  </div>
                  <button onClick={() => setShowCityModal(true)} className="text-xs text-[#145a2c] hover:underline mt-1">View price breakup</button>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 mt-3">
                  <Calculator size={14} className="text-[#145a2c]" />
                  <span>EMI from <strong className="text-[#145a2c]">{formatPrice(emiResult.emi)}/mo</strong></span>
                  <button onClick={() => setShowEMIModal(true)} className="text-[#145a2c] hover:underline text-xs font-medium">Calculate</button>
                </div>
              </div>

              {/* Variant Selector */}
              {activeVariants.length > 1 && (
                <button onClick={() => setShowVariantModal(true)} className="w-full flex items-center justify-between px-4 py-3.5 bg-white border-2 rounded-xl hover:border-[#145a2c] hover:bg-green-50/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center">
                      <Settings size={18} className="text-[#145a2c]" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500">Selected Variant</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedVariant?.short_name || selectedVariant?.name || 'Select'}</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className="text-gray-400 group-hover:text-[#145a2c] transition-colors" />
                </button>
              )}

              {/* Quick Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SpecCard icon={<Zap size={18} className="text-amber-600" />} label="Range" value={`${display.range_km} km`} bg="bg-amber-50" />
                <SpecCard icon={<Battery size={18} className="text-green-600" />} label="Battery" value={`${display.battery_capacity_kwh} kWh`} bg="bg-green-50" />
                <SpecCard icon={<Gauge size={18} className="text-blue-600" />} label="Top Speed" value={`${display.top_speed_kmh} km/h`} bg="bg-blue-50" />
                <SpecCard icon={<Clock size={18} className="text-purple-600" />} label="Charging" value={`${display.charging_time_hrs} hrs`} bg="bg-purple-50" />
              </div>

              {/* CTA Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/compare?vehicles=${vehicle.slug}`} className="flex items-center justify-center gap-2 border-2 border-[#145a2c] text-[#145a2c] rounded-xl py-3 font-semibold hover:bg-[#145a2c] hover:text-white transition-all">
                  <Scale size={18} /> Compare
                </Link>
                <button onClick={() => setShowOfferModal(true)} className="flex items-center justify-center gap-2 bg-orange-500 text-white rounded-xl py-3 font-semibold hover:bg-orange-600 transition-colors">
                  <ShoppingBag size={18} /> Get Offers
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all', activeTab === tab.id ? 'border-[#145a2c] text-[#145a2c]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && <span className={cn('text-xs px-1.5 py-0.5 rounded-full', activeTab === tab.id ? 'bg-green-100 text-[#145a2c]' : 'bg-gray-100')}>{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              {vehicle.description && (
                <section className="bg-white rounded-2xl border p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">About {vehicle.name}</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{vehicle.description}</p>
                </section>
              )}

              {/* Key Specs Grid */}
              <section className="bg-white rounded-2xl border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Award size={20} className="text-[#145a2c]" /> Key Specifications</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <SpecItem icon={<Zap size={20} className="text-amber-500" />} label="Range" value={`${display.range_km} km`} />
                  <SpecItem icon={<Gauge size={20} className="text-blue-500" />} label="Top Speed" value={`${display.top_speed_kmh} km/h`} />
                  <SpecItem icon={<Battery size={20} className="text-green-500" />} label="Battery" value={`${display.battery_capacity_kwh} kWh`} />
                  <SpecItem icon={<Clock size={20} className="text-purple-500" />} label="Charging" value={`${display.charging_time_hrs} hrs`} />
                  {display.motor_power_kw > 0 && <SpecItem icon={<Fuel size={20} className="text-orange-500" />} label="Motor" value={`${display.motor_power_kw} kW`} />}
                  {display.kerb_weight && <SpecItem icon={<Weight size={20} className="text-gray-500" />} label="Kerb Weight" value={`${display.kerb_weight} kg`} />}
                </div>
              </section>

              {/* Pros & Cons */}
              {(vehicle.pros?.length > 0 || vehicle.cons?.length > 0) && (
                <section className="bg-white rounded-2xl border p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Pros & Cons</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {vehicle.pros?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-green-700 flex items-center gap-2 mb-3"><ThumbsUp size={16} /> Pros</h3>
                        <ul className="space-y-2">{vehicle.pros.map((p, i) => <li key={i} className="flex gap-2 text-sm text-gray-700"><Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />{p}</li>)}</ul>
                      </div>
                    )}
                    {vehicle.cons?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-3"><ThumbsDown size={16} /> Cons</h3>
                        <ul className="space-y-2">{vehicle.cons.map((c, i) => <li key={i} className="flex gap-2 text-sm text-gray-700"><X size={16} className="text-red-400 mt-0.5 flex-shrink-0" />{c}</li>)}</ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Price Breakdown */}
              <section className="bg-white rounded-2xl border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp size={20} className="text-[#145a2c]" /> On-Road Price Breakdown</h2>
                  <button onClick={() => setShowCityModal(true)} className="flex items-center gap-1.5 text-sm text-[#145a2c] hover:underline"><MapPin size={14} />{selectedCity?.name || 'Select City'}</button>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="space-y-3">
                    <PriceRow label="Ex-showroom" value={priceBreakdown.exShowroom} />
                    <PriceRow label="RTO Charges" value={priceBreakdown.rto} />
                    <PriceRow label="Insurance" value={priceBreakdown.insurance} />
                    <PriceRow label="Road Tax" value={priceBreakdown.roadTax} />
                    <PriceRow label="Other Charges" value={priceBreakdown.other} />
                    {priceBreakdown.subsidy > 0 && <PriceRow label="EV Subsidy" value={-priceBreakdown.subsidy} isNegative />}
                  </div>
                  <div className="mt-4 pt-4 border-t-2 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Total On-Road Price</span>
                    <span className="text-2xl font-bold text-[#145a2c]">{formatPrice(priceBreakdown.onRoadPrice)}</span>
                  </div>
                </div>
              </section>

              {/* Related News */}
              {relatedNews.length > 0 && (
                <section className="bg-white rounded-2xl border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Newspaper size={20} className="text-gray-400" /> Related News</h2>
                    <Link href="/news" className="text-sm text-[#145a2c] font-medium hover:underline">View all</Link>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">{relatedNews.slice(0, 4).map((a) => <Link key={a.id} href={`/news/${a.slug}`} className="group flex gap-3 p-2 rounded-lg hover:bg-gray-50"><img src={a.image_url} alt="" className="w-20 h-14 rounded-lg object-cover bg-gray-100 flex-shrink-0" /><div className="min-w-0"><p className="text-[10px] text-gray-500 uppercase">{a.category}</p><p className="text-sm font-medium text-gray-900 group-hover:text-[#145a2c] line-clamp-2">{a.title}</p></div></Link>)}</div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Get Offer */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
                <h3 className="font-bold text-lg mb-2">Get Best Offers</h3>
                <p className="text-sm text-orange-100 mb-4">Exclusive deals from authorized dealers</p>
                <button onClick={() => setShowOfferModal(true)} className="w-full bg-white text-orange-600 rounded-xl py-3 font-bold hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"><ShoppingBag size={18} />Get Offers</button>
              </div>

              {/* Similar Vehicles */}
              {adminSimilarVehicles.length > 0 && (
                <section className="bg-white rounded-2xl border p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Similar {getVehicleTypeLabel(vehicle.type)}s</h3>
                  <div className="space-y-3">{adminSimilarVehicles.slice(0, 3).map((v) => <Link key={v.id} href={`/vehicles/${v.slug}`} className="block group"><VehicleCard vehicle={v} compact /></Link>)}</div>
                  <Link href={`/vehicles?type=${vehicle.type}`} className="block text-center text-sm text-[#145a2c] font-medium mt-4 hover:underline">View all {getVehicleTypeLabel(vehicle.type)}s</Link>
                </section>
              )}
            </div>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="max-w-4xl mx-auto">
            <section className="bg-white rounded-2xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Full Specifications</h2>

              {/* Performance */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2"><Gauge size={16} className="text-blue-500" />Performance</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <SpecBar label="Range" value={display.range_km} unit="km" max={500} color="amber" />
                  <SpecBar label="Top Speed" value={display.top_speed_kmh} unit="km/h" max={200} color="blue" />
                  {display.motor_power_kw > 0 && <SpecBar label="Motor Power" value={display.motor_power_kw} unit="kW" max={20} color="green" />}
                  {display.kerb_weight && <SpecBar label="Kerb Weight" value={display.kerb_weight} unit="kg" max={200} color="gray" />}
                </div>
              </div>

              {/* Battery */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2"><Battery size={16} className="text-green-500" />Battery & Charging</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <SpecBar label="Battery Capacity" value={display.battery_capacity_kwh} unit="kWh" max={10} color="green" />
                  <SpecBar label="Charging Time" value={display.charging_time_hrs} unit="hrs" max={10} color="purple" reverse />
                </div>
              </div>

              {/* Additional Specs */}
              {Object.keys(display.specifications).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2"><Settings size={16} className="text-gray-500" />Additional Specifications</h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">{Object.entries(display.specifications).map(([k, v]) => <div key={k} className="flex justify-between py-2.5 px-4 bg-gray-50 rounded-lg"><span className="text-sm text-gray-600">{k}</span><span className="text-sm font-medium text-gray-900">{String(v)}</span></div>)}</div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="max-w-4xl mx-auto">
            <section className="bg-white rounded-2xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Key Features</h2>
              {vehicle.features?.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{vehicle.features.map((f, i) => <div key={i} className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100"><div className="w-8 h-8 bg-[#145a2c] rounded-lg flex items-center justify-center flex-shrink-0"><Check size={16} className="text-white" /></div><span className="text-sm font-medium text-gray-700">{f}</span></div>)}</div>
              ) : <p className="text-gray-500 text-center py-8">No features listed.</p>}
            </section>
          </div>
        )}

        {activeTab === 'variants' && (
          <div className="max-w-4xl mx-auto">
            <section className="bg-white rounded-2xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{vehicle.name} Variants</h2>
              {activeVariants.length > 0 ? (
                <div className="space-y-4">{activeVariants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button key={v.id} onClick={() => handleSelectVariant(v)} className={cn('w-full text-left p-5 rounded-xl border-2 transition-all', isSelected ? 'border-[#145a2c] bg-green-50' : 'border-gray-100 hover:border-gray-200')}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {v.image_url && <img src={v.image_url} alt={v.name} className="w-full sm:w-24 h-20 sm:h-16 rounded-lg object-cover bg-gray-100" />}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{v.short_name || v.name}</h3>
                          <p className="text-xl font-bold text-[#145a2c]">{formatPrice(v.price)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          {v.range_km && <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><Zap size={12} /> {v.range_km} km</span>}
                          {v.battery_capacity_kwh && <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><Battery size={12} /> {v.battery_capacity_kwh} kWh</span>}
                          {v.top_speed_kmh && <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><Gauge size={12} /> {v.top_speed_kmh} km/h</span>}
                          {v.colors && v.colors.length > 0 && <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><Palette size={12} /> {v.colors.length} colours</span>}
                        </div>
                        {isSelected && <span className="flex items-center gap-1 text-sm font-medium text-[#145a2c]"><Check size={16} /> Selected</span>}
                      </div>
                    </button>
                  );
                })}</div>
              ) : <p className="text-gray-500 text-center py-8">No variants available.</p>}
            </section>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Vehicle Colors */}
            {vehicleColors.length > 0 && (
              <section className="bg-white rounded-2xl border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Available Colours</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{vehicleColors.map((c) => <div key={c} className="flex items-center gap-3 p-4 rounded-xl border hover:border-gray-200 transition-colors"><div className="w-12 h-12 rounded-xl border-2 border-gray-200 shadow-inner" style={{ backgroundColor: getColorHex(c) }} /><div><p className="font-medium text-gray-900">{c}</p><p className="text-xs text-gray-500">Available</p></div></div>)}</div>
              </section>
            )}

            {/* Variant Colors */}
            {selectedVariant?.colors && selectedVariant.colors.length > 0 && (
              <section className="bg-white rounded-2xl border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedVariant.short_name || selectedVariant.name} Colours</h2>
                <div className="flex flex-wrap gap-4">{selectedVariant.colors.map((c, i) => <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50"><div className="w-8 h-8 rounded-lg border border-gray-200" style={{ backgroundColor: selectedVariant.color_hexes?.[i] || getColorHex(c) }} /><span className="text-sm font-medium">{c}</span></div>)}</div>
              </section>
            )}
          </div>
        )}
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
      {showVariantModal && activeVariants.length > 0 && <VariantModal variants={activeVariants} selectedVariant={selectedVariant} onSelect={handleSelectVariant} onClose={() => setShowVariantModal(false)} />}
      <OfferEnquiryModal vehicleId={vehicle.id} vehicleName={vehicle.name} vehiclePrice={priceBreakdown.onRoadPrice} variantName={selectedVariant?.short_name || selectedVariant?.name} selectedCity={selectedCity?.name} isOpen={showOfferModal} onClose={() => setShowOfferModal(false)} />
    </div>
  );
}

// Helper Components
function SpecCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-2', bg)}>{icon}</div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">{icon}</div>
      <div><p className="text-xs text-gray-500">{label}</p><p className="text-sm font-bold text-gray-900">{value}</p></div>
    </div>
  );
}

function SpecBar({ label, value, unit, max, color, reverse = false }: { label: string; value: number; unit: string; max: number; color: string; reverse?: boolean }) {
  const percentage = Math.min(100, (value / max) * 100);
  const colors: Record<string, string> = { amber: 'bg-amber-500', blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500', gray: 'bg-gray-500' };
  return (
    <div>
      <div className="flex justify-between mb-2"><span className="text-sm text-gray-600">{label}</span><span className="text-sm font-bold text-gray-900">{value} <span className="font-normal text-gray-500">{unit}</span></span></div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className={cn('h-full rounded-full transition-all', colors[color])} style={{ width: `${reverse ? 100 - percentage : percentage}%` }} /></div>
    </div>
  );
}

function PriceRow({ label, value, isNegative = false }: { label: string; value: number; isNegative?: boolean }) {
  return <div className="flex justify-between"><span className="text-sm text-gray-600">{label}</span><span className={cn('text-sm font-medium', isNegative ? 'text-green-600' : 'text-gray-900')}>{isNegative ? '-' : ''}{formatPrice(Math.abs(value))}</span></div>;
}

function getColorHex(name: string): string {
  const map: Record<string, string> = { black: '#1a1a1a', midnight: '#0a0a0a', white: '#f5f5f5', pearl: '#f0ebe3', silver: '#c0c0c0', grey: '#808080', gray: '#808080', graphite: '#4a4a4a', blue: '#1e40af', navy: '#1e3a5f', red: '#dc2626', crimson: '#b91c1c', green: '#16a34a', olive: '#556b2f', teal: '#0d9488', bronze: '#cd7f32', gold: '#ffd700', orange: '#ea580c', amber: '#d97706', yellow: '#eab308', purple: '#7c3aed', brown: '#78350f' };
  const n = name.toLowerCase().trim();
  for (const [k, v] of Object.entries(map)) if (n.includes(k)) return v;
  return '#9ca3af';
}

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

function VariantModal({ variants, selectedVariant, onSelect, onClose }: { variants: VehicleVariant[]; selectedVariant: VehicleVariant | null; onSelect: (v: VehicleVariant) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b"><h3 className="text-lg font-bold">Select Variant</h3><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-400" /></button></div>
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]"><div className="grid grid-cols-2 gap-4">{variants.map((v) => <button key={v.id} onClick={() => onSelect(v)} className={cn('text-left p-4 rounded-xl border-2 transition-all', selectedVariant?.id === v.id ? 'border-[#145a2c] bg-green-50' : 'border-gray-200 hover:border-gray-300')}>{v.image_url && <img src={v.image_url} alt={v.name} className="w-full h-24 rounded-lg object-cover bg-gray-100 mb-3" />}<p className="font-semibold">{v.short_name || v.name}</p><p className="text-lg font-bold text-[#145a2c]">{formatPrice(v.price)}</p><div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600">{v.range_km && <span className="flex items-center gap-1"><Zap size={10} />{v.range_km} km</span>}{v.battery_capacity_kwh && <span className="flex items-center gap-1"><Battery size={10} />{v.battery_capacity_kwh} kWh</span>}</div>{selectedVariant?.id === v.id && <p className="mt-2 text-xs font-semibold text-[#145a2c] flex items-center gap-1"><Check size={12} />Selected</p>}</button>)}</div></div>
      </div>
    </div>
  );
}
