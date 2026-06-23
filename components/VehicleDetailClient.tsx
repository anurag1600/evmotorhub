'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Zap, Gauge, Battery, Clock, MapPin, ChevronRight, Scale, Calculator, ShoppingBag,
  ThumbsUp, ThumbsDown, Check, X, Newspaper, ChevronDown, Star, Play, Palette, Search,
  Info, ExternalLink, TrendingUp, Award, Shield, Settings, Fuel, Users, Timer, Ruler, Weight
} from 'lucide-react';
import { Vehicle, VehicleVariant, PricingState, PricingCity, NewsArticle } from '@/lib/types';
import { formatPrice, getVehicleTypeLabel, getSegmentLabel, getSegmentColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import VehicleGallery from '@/components/VehicleGallery';
import VehicleCard from '@/components/VehicleCard';
import OfferEnquiryModal from '@/components/OfferEnquiryModal';

interface VehicleDetailClientProps {
  vehicle: Vehicle & { manufacturers: any };
  variants: VehicleVariant[];
  similar: any[];
}

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

type TabType = 'overview' | 'specs' | 'features' | 'variants' | 'colors';

export default function VehicleDetailClient({ vehicle, variants, similar }: VehicleDetailClientProps) {
  const manufacturer = vehicle.manufacturers;

  // State - Core
  const defaultVariant = variants.find(v => v.is_featured && v.status === 'active') ||
                         variants.find(v => v.status === 'active') ||
                         (variants.length > 0 ? variants[0] : null);
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(defaultVariant);
  const [selectedCity, setSelectedCity] = useState<PricingCity | null>(null);
  const [selectedState, setSelectedState] = useState<PricingState | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Modal state
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showEMIModal, setShowEMIModal] = useState(false);
  const [showColorsModal, setShowColorsModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Data state
  const [relatedNews, setRelatedNews] = useState<NewsArticle[]>([]);
  const [adminSimilarVehicles, setAdminSimilarVehicles] = useState<any[]>([]);
  const [cities, setCities] = useState<PricingCity[]>([]);
  const [citySearch, setCitySearch] = useState('');

  // EMI state
  const [emiDownPayment, setEmiDownPayment] = useState(0);
  const [emiInterestRate, setEmiInterestRate] = useState(9.5);
  const [emiTenure, setEmiTenure] = useState(36);

  // Refs
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isTabsSticky, setIsTabsSticky] = useState(false);

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
    // Use explicit ex_showroom_price from vehicle, fall back to variant/vehicle price
    const exShowroomBase = vehicle.ex_showroom_price || displayValues.price;
    const rto = selectedCity?.rto_charge || Math.round(exShowroomBase * (selectedState?.rto_percentage || 8) / 100);
    const insurance = selectedCity?.insurance_charge || Math.round(exShowroomBase * 0.04);
    const roadTax = Math.round(exShowroomBase * (selectedState?.road_tax_percentage || 0) / 100);
    const other = selectedCity?.other_charges || selectedState?.other_charges || 1000;
    const subsidy = selectedState?.subsidy_amount || 0;
    const onRoadPrice = exShowroomBase + rto + insurance + roadTax + other - subsidy;
    return { exShowroom: exShowroomBase, rto, insurance, roadTax, other, subsidy, onRoadPrice };
  }, [displayValues.price, vehicle.ex_showroom_price, selectedState, selectedCity]);

  // EMI calculation
  const emiResult = useMemo(() => {
    const principal = priceBreakdown.onRoadPrice - emiDownPayment;
    const monthlyRate = emiInterestRate / 12 / 100;
    const emi = principal > 0 ? Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, emiTenure)) / (Math.pow(1 + monthlyRate, emiTenure) - 1)) : 0;
    const totalAmount = emi * emiTenure;
    const totalInterest = totalAmount - principal;
    return { emi, principal, totalInterest, totalAmount };
  }, [priceBreakdown.onRoadPrice, emiDownPayment, emiInterestRate, emiTenure]);

  // Fetch related news
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

  // Fetch similar vehicles
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
      // Check if user has a stored city preference
      if (typeof window !== 'undefined') {
        const storedCity = localStorage.getItem('selectedCity');
        if (storedCity) {
          try {
            const parsed = JSON.parse(storedCity);
            if (parsed && parsed.id) {
              setSelectedCity(parsed);
              if (parsed.state) setSelectedState(parsed.state as PricingState);
            }
          } catch {
            // Invalid stored data, proceed with default
          }
        }
      }

      // Set default Delhi if no stored preference
      if (!selectedCity) {
        const { data: state } = await supabase.from('pricing_states').select('*').eq('code', 'DL').maybeSingle();
        if (state) {
          setSelectedState(state as PricingState);
          const { data: city } = await supabase.from('pricing_cities').select('*').eq('state_id', state.id).eq('is_popular', true).maybeSingle();
          if (city) setSelectedCity(city as PricingCity);
        }
      }

      // Load all cities, popular first
      const { data: allCities } = await supabase
        .from('pricing_cities')
        .select('*, state:pricing_states(*)')
        .eq('is_active', true)
        .order('is_popular', { ascending: false })
        .order('name', { ascending: true });
      setCities((allCities || []) as PricingCity[]);
    };
    loadDefaultLocation();
  }, []);

  // Persist city selection
  useEffect(() => {
    if (selectedCity && typeof window !== 'undefined') {
      localStorage.setItem('selectedCity', JSON.stringify(selectedCity));
    }
  }, [selectedCity]);

  // Update EMI down payment
  useEffect(() => {
    setEmiDownPayment(Math.round(priceBreakdown.onRoadPrice * 0.1));
  }, [priceBreakdown.onRoadPrice]);

  // Popular cities from database (is_popular = true)
  const popularCities = useMemo(() => {
    return cities.filter(c => c.is_popular).slice(0, 8);
  }, [cities]);

  // City filter - improved search
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cities.slice(0, 20);
    const searchLower = citySearch.toLowerCase().trim();
    return cities.filter(c => {
      const nameMatch = c.name.toLowerCase().includes(searchLower);
      const pincodeMatch = c.pincode?.includes(searchLower);
      const stateNameMatch = c.state?.name?.toLowerCase().includes(searchLower);
      const stateCodeMatch = c.state?.code?.toLowerCase() === searchLower;
      return nameMatch || pincodeMatch || stateNameMatch || stateCodeMatch;
    }).slice(0, 20);
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

  const vehicleColors = vehicle.colors || [];
  const hasVideo = vehicle.video_url && vehicle.video_url.length > 0;

  // Tab configuration
  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'specs', label: 'Specifications' },
    { id: 'features', label: 'Features', count: vehicle.features?.length || 0 },
    { id: 'variants', label: 'Variants', count: variants.length },
    { id: 'colors', label: 'Colours', count: vehicleColors.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#145a2c] transition-colors">Home</Link>
            <ChevronRight size={14} className="text-gray-300" />
            <Link href="/vehicles" className="hover:text-[#145a2c] transition-colors">Vehicles</Link>
            <ChevronRight size={14} className="text-gray-300" />
            <Link href={`/vehicles?type=${vehicle.type}`} className="hover:text-[#145a2c] transition-colors">{getVehicleTypeLabel(vehicle.type)}</Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-900 font-medium">{vehicle.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left - Gallery */}
            <div className="lg:col-span-3">
              <VehicleGallery
                mainImage={displayValues.image_url || vehicle.image_url}
                galleryImages={vehicle.image_gallery || vehicle.gallery_urls || []}
                vehicleName={vehicle.name}
                isUpcoming={vehicle.is_upcoming}
                isLatest={vehicle.is_latest}
              />
              {/* Action buttons below gallery */}
              <div className="flex flex-wrap gap-2 mt-4">
                {vehicleColors.length > 0 && (
                  <button
                    onClick={() => { setActiveTab('colors'); setShowColorsModal(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-[#145a2c] hover:text-[#145a2c] transition-all"
                  >
                    <Palette size={16} />
                    <span>{vehicleColors.length} Colours</span>
                  </button>
                )}
                {hasVideo && (
                  <a
                    href={vehicle.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Play size={16} />
                    <span>Watch Review</span>
                    <ExternalLink size={12} />
                  </a>
                )}
                {variants.length > 0 && (
                  <button
                    onClick={() => setActiveTab('variants')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    <Settings size={16} />
                    <span>{variants.length} Variants</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right - Info Panel */}
            <div className="lg:col-span-2">
              {/* Brand & Title */}
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {manufacturer && (
                    <Link href={`/manufacturers/${manufacturer.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#145a2c] bg-green-50 px-3 py-1 rounded-full hover:bg-green-100 transition-colors">
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {vehicle.name}
                </h1>
                {selectedVariant && selectedVariant.name !== vehicle.name && (
                  <p className="text-sm text-gray-500 mt-1">{selectedVariant.short_name || selectedVariant.name}</p>
                )}
              </div>

              {/* Price Card */}
              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 rounded-2xl p-5 border border-green-200/60 mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ex-showroom Price</p>
                    <p className="text-3xl font-bold text-[#145a2c]">{formatPrice(displayValues.price)}</p>
                  </div>
                  <button
                    onClick={() => setShowCityModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-600 hover:text-[#145a2c] hover:shadow-sm transition-all border border-gray-200"
                  >
                    <MapPin size={12} />
                    {selectedCity?.name || 'Select City'}
                    <ChevronDown size={12} />
                  </button>
                </div>

                <div className="bg-white/60 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">On-road Price</span>
                    <span className="text-xl font-bold text-gray-900">{formatPrice(priceBreakdown.onRoadPrice)}</span>
                  </div>
                  <button
                    onClick={() => setShowCityModal(true)}
                    className="text-xs text-[#145a2c] hover:underline mt-1"
                  >
                    View price breakup
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calculator size={14} className="text-[#145a2c]" />
                  <span>EMI starts at <strong className="text-[#145a2c]">{formatPrice(emiResult.emi)}/mo</strong></span>
                  <button onClick={() => setShowEMIModal(true)} className="text-[#145a2c] hover:underline text-xs font-medium">
                    Calculate
                  </button>
                </div>
              </div>

              {/* Variant Selector */}
              {variants.length > 1 && (
                <button
                  onClick={() => setShowVariantModal(true)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:border-[#145a2c] hover:bg-green-50/30 transition-all mb-4 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-50 rounded-lg flex items-center justify-center">
                      <Settings size={18} className="text-[#145a2c]" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500">Selected Variant</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedVariant?.short_name || selectedVariant?.name || 'Select Variant'}</p>
                    </div>
                  </div>
                  <ChevronDown size={18} className="text-gray-400 group-hover:text-[#145a2c] transition-colors" />
                </button>
              )}

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Zap size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Range</p>
                      <p className="text-lg font-bold text-gray-900">{displayValues.range_km}<span className="text-xs font-normal text-gray-500 ml-0.5">km</span></p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <Battery size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Battery</p>
                      <p className="text-lg font-bold text-gray-900">{displayValues.battery_capacity_kwh}<span className="text-xs font-normal text-gray-500 ml-0.5">kWh</span></p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Gauge size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Top Speed</p>
                      <p className="text-lg font-bold text-gray-900">{displayValues.top_speed_kmh}<span className="text-xs font-normal text-gray-500 ml-0.5">km/h</span></p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Clock size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Charging</p>
                      <p className="text-lg font-bold text-gray-900">{displayValues.charging_time_hrs}<span className="text-xs font-normal text-gray-500 ml-0.5">hrs</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={`/compare?vehicles=${vehicle.slug}${selectedVariant ? `&variants=${selectedVariant.id}` : ''}`}
                  className="flex items-center justify-center gap-2 border-2 border-[#145a2c] text-[#145a2c] rounded-xl py-3 font-semibold hover:bg-[#145a2c] hover:text-white transition-all"
                >
                  <Scale size={18} />
                  Compare
                </Link>
                <button
                  onClick={() => setShowEMIModal(true)}
                  className="flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-3 font-semibold hover:bg-gray-800 transition-colors"
                >
                  <Calculator size={18} />
                  EMI Calculator
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div ref={tabsRef} className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all',
                  activeTab === tab.id
                    ? 'border-[#145a2c] text-[#145a2c]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    activeTab === tab.id ? 'bg-green-100 text-[#145a2c]' : 'bg-gray-100 text-gray-600'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              {vehicle.description && (
                <section className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">About {vehicle.name}</h2>
                  <p className="text-gray-600 leading-relaxed">{vehicle.description}</p>
                </section>
              )}

              {/* Key Highlights */}
              <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award size={20} className="text-[#145a2c]" />
                  Key Highlights
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <HighlightCard
                    icon={<Zap size={20} className="text-amber-500" />}
                    label="Range"
                    value={`${displayValues.range_km} km`}
                    subtitle="Per full charge"
                  />
                  <HighlightCard
                    icon={<Gauge size={20} className="text-blue-500" />}
                    label="Top Speed"
                    value={`${displayValues.top_speed_kmh} km/h`}
                    subtitle="Maximum speed"
                  />
                  <HighlightCard
                    icon={<Battery size={20} className="text-green-500" />}
                    label="Battery"
                    value={`${displayValues.battery_capacity_kwh} kWh`}
                    subtitle="Li-ion capacity"
                  />
                  <HighlightCard
                    icon={<Clock size={20} className="text-purple-500" />}
                    label="Charging"
                    value={`${displayValues.charging_time_hrs} hrs`}
                    subtitle="0-100% charge"
                  />
                </div>
              </section>

              {/* Pros & Cons */}
              {(vehicle.pros?.length > 0 || vehicle.cons?.length > 0) && (
                <section className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Pros & Cons</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {vehicle.pros?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                          <ThumbsUp size={16} /> Pros
                        </h3>
                        <ul className="space-y-2">
                          {vehicle.pros.map((pro: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {vehicle.cons?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                          <ThumbsDown size={16} /> Cons
                        </h3>
                        <ul className="space-y-2">
                          {vehicle.cons.map((con: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <X size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* On-Road Price Breakdown */}
              <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-[#145a2c]" />
                    On-Road Price
                  </h2>
                  <button
                    onClick={() => setShowCityModal(true)}
                    className="flex items-center gap-1.5 text-sm text-[#145a2c] hover:underline"
                  >
                    <MapPin size={14} />
                    {selectedCity?.name || 'Select City'}
                  </button>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="space-y-3">
                    <PriceRow label="Ex-showroom" value={priceBreakdown.exShowroom} />
                    <PriceRow label="RTO Charges" value={priceBreakdown.rto} />
                    <PriceRow label="Insurance" value={priceBreakdown.insurance} />
                    <PriceRow label="Road Tax" value={priceBreakdown.roadTax} />
                    <PriceRow label="Other Charges" value={priceBreakdown.other} />
                    {priceBreakdown.subsidy > 0 && (
                      <PriceRow label="EV Subsidy" value={-priceBreakdown.subsidy} isNegative />
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t-2 border-gray-200 flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Total On-Road Price</span>
                    <span className="text-2xl font-bold text-[#145a2c]">{formatPrice(priceBreakdown.onRoadPrice)}</span>
                  </div>
                </div>
              </section>

              {/* Related News */}
              {relatedNews.length > 0 && (
                <section className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Newspaper size={20} className="text-gray-400" />
                      Related News
                    </h2>
                    <Link href="/news" className="text-sm text-[#145a2c] font-medium hover:underline">
                      View all
                    </Link>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {relatedNews.slice(0, 4).map((article) => (
                      <Link
                        key={article.id}
                        href={`/news/${article.slug}`}
                        className="group flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-500 uppercase mb-1">{article.category}</p>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-[#145a2c] transition-colors">
                            {article.title}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Compare Similar */}
              {adminSimilarVehicles.length > 0 && (
                <section className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Compare with Similar</h3>
                  <div className="space-y-3">
                    {adminSimilarVehicles.slice(0, 4).map((v) => (
                      <Link
                        key={v.id}
                        href={`/compare?vehicles=${vehicle.slug},${v.slug}`}
                        className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#145a2c] hover:bg-green-50/50 transition-all"
                      >
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-[#145a2c] truncate">
                            {v.name}
                          </p>
                          <p className="text-xs text-gray-500">{formatPrice(v.price_min)}</p>
                        </div>
                        <Scale size={16} className="text-gray-300 group-hover:text-[#145a2c] flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/vehicles?type=${vehicle.type}`}
                    className="block text-center text-sm text-[#145a2c] font-medium mt-4 hover:underline"
                  >
                    View all {getVehicleTypeLabel(vehicle.type)}s
                  </Link>
                </section>
              )}

              {/* Get Offer CTA */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
                <h3 className="font-bold text-lg mb-2">Get Best Offers</h3>
                <p className="text-sm text-orange-100 mb-4">Get exclusive deals from authorized dealers</p>
                <button
                  onClick={() => setShowOfferModal(true)}
                  className="w-full bg-white text-orange-600 rounded-xl py-3 font-bold hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={18} />
                  Get Offers
                </button>
              </div>

              {/* Similar Vehicles */}
              {adminSimilarVehicles.length > 0 && (
                <section className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Similar {getVehicleTypeLabel(vehicle.type)}s</h3>
                  <div className="space-y-3">
                    {adminSimilarVehicles.slice(0, 3).map((v) => (
                      <Link key={v.id} href={`/vehicles/${v.slug}`} className="block group">
                        <VehicleCard vehicle={v} compact />
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {/* Specs Tab */}
        {activeTab === 'specs' && (
          <div className="max-w-4xl mx-auto">
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Full Specifications</h2>

              {/* Performance */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Gauge size={16} className="text-blue-500" />
                  Performance
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <SpecBar label="Range" value={displayValues.range_km} unit="km" max={500} color="amber" />
                  <SpecBar label="Top Speed" value={displayValues.top_speed_kmh} unit="km/h" max={200} color="blue" />
                  <SpecBar label="Motor Power" value={displayValues.motor_power_kw || 0} unit="kW" max={20} color="green" />
                  {displayValues.kerb_weight && (
                    <SpecBar label="Kerb Weight" value={displayValues.kerb_weight} unit="kg" max={200} color="gray" />
                  )}
                </div>
              </div>

              {/* Battery & Charging */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Battery size={16} className="text-green-500" />
                  Battery & Charging
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <SpecBar label="Battery Capacity" value={displayValues.battery_capacity_kwh} unit="kWh" max={10} color="green" />
                  <SpecBar label="Charging Time" value={displayValues.charging_time_hrs} unit="hrs" max={10} color="purple" reverse />
                </div>
              </div>

              {/* Additional Specs */}
              {Object.keys(displayValues.specifications).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Settings size={16} className="text-gray-500" />
                    Additional Specifications
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {Object.entries(displayValues.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 px-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">{key}</span>
                        <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="max-w-4xl mx-auto">
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Key Features</h2>
              {vehicle.features && vehicle.features.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicle.features.map((feature: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100"
                    >
                      <div className="w-8 h-8 bg-[#145a2c] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check size={16} className="text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No features listed yet.</p>
              )}
            </section>
          </div>
        )}

        {/* Variants Tab */}
        {activeTab === 'variants' && (
          <div className="max-w-4xl mx-auto">
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{vehicle.name} Variants</h2>
              {variants.length > 0 ? (
                <div className="space-y-4">
                  {variants.filter(v => v.status === 'active').map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    return (
                      <button
                        key={variant.id}
                        onClick={() => handleSelectVariant(variant)}
                        className={cn(
                          'w-full text-left p-5 rounded-xl border-2 transition-all',
                          isSelected
                            ? 'border-[#145a2c] bg-green-50'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            {variant.image_url && (
                              <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <img src={variant.image_url} alt={variant.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900">{variant.short_name || variant.name}</h3>
                              <p className="text-xl font-bold text-[#145a2c] mt-1">{formatPrice(variant.price)}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                            {variant.range_km && (
                              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                <Zap size={12} /> {variant.range_km} km
                              </span>
                            )}
                            {variant.battery_capacity_kwh && (
                              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                <Battery size={12} /> {variant.battery_capacity_kwh} kWh
                              </span>
                            )}
                            {variant.top_speed_kmh && (
                              <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                <Gauge size={12} /> {variant.top_speed_kmh} km/h
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="mt-3 flex items-center gap-2 text-sm font-medium text-[#145a2c]">
                            <Check size={16} />
                            Currently Selected
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No variants available.</p>
              )}
            </section>
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="max-w-4xl mx-auto">
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Available Colours</h2>
              {vehicleColors.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicleColors.map((color) => (
                    <div
                      key={color}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div
                        className="w-12 h-12 rounded-xl border-2 border-gray-200 shadow-inner"
                        style={{ backgroundColor: getColorHex(color) }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{color}</p>
                        <p className="text-xs text-gray-500">Available</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No colours listed yet.</p>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg lg:hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">On-road Price</p>
            <p className="text-lg font-bold text-[#145a2c]">{formatPrice(priceBreakdown.onRoadPrice)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEMIModal(true)}
              className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
            >
              EMI {formatPrice(emiResult.emi)}/mo
            </button>
            <button
              onClick={() => setShowOfferModal(true)}
              className="px-4 py-2.5 bg-orange-500 rounded-xl text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Get Offer
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowVariantModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Select Variant</h3>
              <button onClick={() => setShowVariantModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
              <div className="grid grid-cols-2 gap-4">
                {variants.filter(v => v.status === 'active').map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => handleSelectVariant(variant)}
                      className={cn(
                        'text-left p-4 rounded-xl border-2 transition-all',
                        isSelected ? 'border-[#145a2c] bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      {variant.image_url && (
                        <img src={variant.image_url} alt={variant.name} className="w-full h-24 rounded-lg object-cover bg-gray-100 mb-3" />
                      )}
                      <p className="font-semibold text-gray-900">{variant.short_name || variant.name}</p>
                      <p className="text-lg font-bold text-[#145a2c] mt-1">{formatPrice(variant.price)}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600">
                        {variant.range_km && <span className="flex items-center gap-1"><Zap size={10} /> {variant.range_km} km</span>}
                        {variant.battery_capacity_kwh && <span className="flex items-center gap-1"><Battery size={10} /> {variant.battery_capacity_kwh} kWh</span>}
                      </div>
                      {isSelected && (
                        <p className="mt-2 text-xs font-semibold text-[#145a2c] flex items-center gap-1">
                          <Check size={12} /> Selected
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* City Modal */}
      {showCityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCityModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Select Your City</h3>
              <button onClick={() => setShowCityModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Enter city or pincode"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Popular Cities</h4>
                <div className="flex flex-wrap gap-2">
                  {popularCities.length > 0 ? (
                    popularCities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => handleSelectCity(city)}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                          selectedCity?.id === city.id
                            ? 'bg-[#145a2c] text-white'
                            : 'bg-gray-100 hover:bg-green-50 hover:text-[#145a2c] text-gray-700'
                        )}
                      >
                        {city.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">Loading popular cities...</p>
                  )}
                </div>
              </div>
              {citySearch && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Search Results</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filteredCities.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No cities found</p>
                    ) : (
                      filteredCities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => handleSelectCity(city)}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between',
                            selectedCity?.id === city.id ? 'bg-green-50 text-[#145a2c]' : 'hover:bg-gray-50'
                          )}
                        >
                          <div>
                            <p className="text-sm font-medium">{city.name}</p>
                            <p className="text-xs text-gray-500">{city.state?.name || city.pincode}</p>
                          </div>
                          {selectedCity?.id === city.id && <Check size={16} className="text-[#145a2c]" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EMI Modal */}
      {showEMIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowEMIModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">EMI Calculator</h3>
              <button onClick={() => setShowEMIModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-5">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Vehicle Price (On-road)</label>
                <p className="text-lg font-bold text-gray-900">{formatPrice(priceBreakdown.onRoadPrice)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  Down Payment: <span className="font-bold text-[#145a2c]">{formatPrice(emiDownPayment)}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={priceBreakdown.onRoadPrice * 0.5}
                  step={5000}
                  value={emiDownPayment}
                  onChange={(e) => setEmiDownPayment(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#145a2c]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>{formatPrice(Math.round(priceBreakdown.onRoadPrice * 0.5))}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  Interest Rate: <span className="font-bold text-[#145a2c]">{emiInterestRate}%</span> p.a.
                </label>
                <input
                  type="range"
                  min={5}
                  max={15}
                  step={0.25}
                  value={emiInterestRate}
                  onChange={(e) => setEmiInterestRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#145a2c]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5%</span>
                  <span>15%</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Loan Tenure</label>
                <div className="grid grid-cols-4 gap-2">
                  {[12, 24, 36, 48].map((months) => (
                    <button
                      key={months}
                      onClick={() => setEmiTenure(months)}
                      className={cn(
                        'py-2.5 rounded-lg font-semibold transition-colors',
                        emiTenure === months
                          ? 'bg-[#145a2c] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      {months}mo
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#145a2c] to-[#0f3d1e] rounded-xl p-5 text-white">
                <p className="text-xs text-green-200 mb-1">Monthly EMI</p>
                <p className="text-3xl font-bold">{formatPrice(emiResult.emi)}</p>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
                  <div>
                    <p className="text-xs text-green-200">Loan Amount</p>
                    <p className="font-semibold">{formatPrice(emiResult.principal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-200">Total Interest</p>
                    <p className="font-semibold">{formatPrice(emiResult.totalInterest)}</p>
                  </div>
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors">
                <ShoppingBag size={18} />
                Get Best Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Colors Modal */}
      {showColorsModal && vehicleColors.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowColorsModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Available Colours</h3>
              <button onClick={() => setShowColorsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {vehicleColors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div
                      className="w-10 h-10 rounded-xl border-2 border-gray-200"
                      style={{ backgroundColor: getColorHex(color) }}
                    />
                    <span className="text-sm font-medium text-gray-700">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacing for mobile CTA bar */}
      <div className="h-20 lg:hidden" />

      {/* Offer Enquiry Modal */}
      <OfferEnquiryModal
        vehicleId={vehicle.id}
        vehicleName={vehicle.name}
        vehiclePrice={priceBreakdown.onRoadPrice}
        variantName={selectedVariant?.short_name || selectedVariant?.name || undefined}
        selectedCity={selectedCity?.name}
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
      />
    </div>
  );
}

// Helper Components
function HighlightCard({ icon, label, value, subtitle }: { icon: React.ReactNode; label: string; value: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function SpecBar({ label, value, unit, max, color, reverse = false }: {
  label: string;
  value: number;
  unit: string;
  max: number;
  color: 'amber' | 'blue' | 'green' | 'purple' | 'gray';
  reverse?: boolean;
}) {
  const percentage = Math.min(100, (value / max) * 100);
  const colorClasses = {
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-500',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-bold text-gray-900">{value} <span className="font-normal text-gray-500">{unit}</span></span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colorClasses[color])}
          style={{ width: `${reverse ? 100 - percentage : percentage}%` }}
        />
      </div>
    </div>
  );
}

function PriceRow({ label, value, isNegative = false }: { label: string; value: number; isNegative?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={cn(
        'text-sm font-medium',
        isNegative ? 'text-green-600' : 'text-gray-900'
      )}>
        {isNegative ? '-' : ''}{formatPrice(Math.abs(value))}
      </span>
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
