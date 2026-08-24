'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Zap, Gauge, Battery, Clock, MapPin, ChevronRight, Scale, Calculator, ShoppingBag,
  ThumbsUp, ThumbsDown, Check, X, ChevronDown, Search, TrendingUp, Palette, ChevronLeft, FileText
} from 'lucide-react';
import { Vehicle, VehicleVariant, PricingState, PricingCity, NewsArticle, VehiclePricingCategory, OnRoadPriceBreakdown } from '@/lib/types';
import { formatPrice, getVehicleTypeLabel, getSegmentLabel, getSegmentColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { findPricingProfile, calculateOnRoadPrice, PriceBreakdown as ProfilePriceBreakdown } from '@/lib/pricingCalculator';
import OfferEnquiryModal from '@/components/OfferEnquiryModal';

interface VehicleDetailClientProps {
  vehicle: Vehicle & { manufacturers: any };
  variants: VehicleVariant[];
  similar: any[];
}

export default function VehicleDetailClient({ vehicle, variants, similar }: VehicleDetailClientProps) {
  const manufacturer = vehicle.manufacturers;
  const searchParams = useSearchParams();
  const router = useRouter();

  // State - initialize from URL param if present
  const getDefaultVariant = useCallback(() => {
    const variantParam = searchParams.get('variant');
    if (variantParam) {
      // Try to find by ID first, then by slug
      const byId = variants.find(v => v.id === variantParam);
      if (byId) return byId;
      const bySlug = variants.find(v => v.slug === variantParam);
      if (bySlug) return bySlug;
    }
    return variants.find(v => v.id === vehicle.default_variant_id) ||
           variants.find(v => v.is_featured && v.status === 'active') ||
           variants.find(v => v.status === 'active') ||
           (variants.length > 0 ? variants[0] : null);
  }, [searchParams, variants, vehicle.default_variant_id]);

  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(getDefaultVariant);
  const [selectedCity, setSelectedCity] = useState<PricingCity | null>(null);
  const [selectedState, setSelectedState] = useState<PricingState | null>(null);

  // Gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const galleryImages = useMemo(() => {
    // Use variant gallery if available, otherwise fall back to vehicle gallery
    const variantGallery = selectedVariant?.gallery_urls && selectedVariant.gallery_urls.length > 0
      ? selectedVariant.gallery_urls
      : null;
    const primaryImage = selectedVariant?.image_url || vehicle.image_url;
    const imgs = variantGallery
      ? variantGallery
      : [primaryImage, ...(vehicle.image_gallery || vehicle.gallery_urls || [])].filter(Boolean);
    return imgs.length > 0 ? imgs : ['/placeholder-vehicle.png'];
  }, [vehicle, selectedVariant]);

  // Reset image index when variant changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedVariant?.id]);

  // Modals
  const [showCityModal, setShowCityModal] = useState(false);
  const [showEMIModal, setShowEMIModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Data
  const [relatedNews, setRelatedNews] = useState<NewsArticle[]>([]);
  const [adminSimilarVehicles, setAdminSimilarVehicles] = useState<any[]>([]);
  const [cities, setCities] = useState<PricingCity[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [profileBreakdown, setProfileBreakdown] = useState<ProfilePriceBreakdown | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
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

  // Display values - merge vehicle specs with variant specs, variant takes priority
  const display = useMemo(() => {
    const baseSpecs = {
      range_km: vehicle.range_km,
      top_speed_kmh: vehicle.top_speed_kmh,
      battery_capacity_kwh: vehicle.battery_capacity_kwh,
      motor_power_kw: vehicle.motor_power_kw,
      charging_time_hrs: vehicle.charging_time_hrs,
      specifications: vehicle.specifications || {},
    };

    // Override with variant values if they exist
    if (selectedVariant) {
      if (selectedVariant.range_km != null) baseSpecs.range_km = selectedVariant.range_km;
      if (selectedVariant.top_speed_kmh != null) baseSpecs.top_speed_kmh = selectedVariant.top_speed_kmh;
      if (selectedVariant.battery_capacity_kwh != null) baseSpecs.battery_capacity_kwh = selectedVariant.battery_capacity_kwh;
      if (selectedVariant.motor_power_kw != null) baseSpecs.motor_power_kw = selectedVariant.motor_power_kw;
      if (selectedVariant.charging_time_hrs != null) baseSpecs.charging_time_hrs = selectedVariant.charging_time_hrs;
      if (selectedVariant.specifications && Object.keys(selectedVariant.specifications).length > 0) {
        baseSpecs.specifications = { ...baseSpecs.specifications, ...selectedVariant.specifications };
      }
    }

    return {
      price: selectedVariant?.price || vehicle.price_min,
      kerb_weight: selectedVariant?.kerb_weight,
      ...baseSpecs
    };
  }, [selectedVariant, vehicle]);

  // Get vehicle category for pricing
  const vehiclePricingCategory: VehiclePricingCategory = useMemo(() => {
    if (vehicle.type === 'car') return 'electric_car';
    if (vehicle.type === 'scooter') return 'electric_scooter';
    return 'electric_bike';
  }, [vehicle.type]);

  // Price calculation using pricing profiles from Supabase
  const priceBreakdown: OnRoadPriceBreakdown = useMemo(() => {
    const exShowroom = display.price;

    if (!profileBreakdown) {
      // No profile matched — show ex-showroom only, no fake charges
      return {
        ex_showroom: exShowroom,
        rto: 0,
        rto_percentage: 0,
        insurance: 0,
        insurance_percentage: 0,
        registration: 0,
        hsrp: 0,
        fastag: 0,
        other: 0,
        subsidy: 0,
        subsidy_description: null,
        on_road: exShowroom,
        breakdown: {
          show_rto: false,
          show_insurance: false,
          show_registration: false,
          show_hsrp: false,
          show_fastag: false,
          show_other: false,
        },
      };
    }

    return {
      ex_showroom: profileBreakdown.ex_showroom,
      rto: profileBreakdown.rto,
      rto_percentage: profileBreakdown.rto_percentage,
      insurance: profileBreakdown.insurance,
      insurance_percentage: profileBreakdown.insurance_percentage,
      registration: profileBreakdown.registration,
      hsrp: profileBreakdown.hsrp,
      fastag: profileBreakdown.fastag,
      other: profileBreakdown.other + profileBreakdown.handling + profileBreakdown.dealer + profileBreakdown.delivery + profileBreakdown.accessories + profileBreakdown.misc,
      subsidy: profileBreakdown.subsidy,
      subsidy_description: profileBreakdown.subsidy_description,
      on_road: profileBreakdown.on_road,
      breakdown: {
        show_rto: profileBreakdown.breakdown.show_rto,
        show_insurance: profileBreakdown.breakdown.show_insurance,
        show_registration: profileBreakdown.breakdown.show_registration,
        show_hsrp: profileBreakdown.breakdown.show_hsrp,
        show_fastag: profileBreakdown.breakdown.show_fastag,
        show_other: profileBreakdown.breakdown.show_other || profileBreakdown.breakdown.show_handling || profileBreakdown.breakdown.show_dealer || profileBreakdown.breakdown.show_delivery || profileBreakdown.breakdown.show_accessories || profileBreakdown.breakdown.show_misc,
      },
    };
  }, [profileBreakdown, display.price]);

  // Legacy compatibility for EMI calculator
  const legacyPriceBreakdown = useMemo(() => ({
    exShowroom: priceBreakdown.ex_showroom,
    rto: priceBreakdown.rto,
    insurance: priceBreakdown.insurance,
    roadTax: 0, // Included in RTO now
    other: priceBreakdown.registration + priceBreakdown.hsrp + priceBreakdown.fastag + priceBreakdown.other,
    subsidy: priceBreakdown.subsidy,
    onRoadPrice: priceBreakdown.on_road,
  }), [priceBreakdown]);

  // EMI calculation
  const emiResult = useMemo(() => {
    const principal = legacyPriceBreakdown.onRoadPrice - emiDownPayment;
    const monthlyRate = emiInterestRate / 12 / 100;
    const emi = principal > 0 ? Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, emiTenure)) / (Math.pow(1 + monthlyRate, emiTenure) - 1)) : 0;
    return { emi, principal, totalAmount: emi * emiTenure, totalInterest: emi * emiTenure - principal };
  }, [legacyPriceBreakdown.onRoadPrice, emiDownPayment, emiInterestRate, emiTenure]);

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
        const { data } = await supabase.from('vehicles').select('*, manufacturers(name, slug)').in('id', vehicle.similar_vehicle_ids).eq('status', 'published');
        if (data) setAdminSimilarVehicles(vehicle.similar_vehicle_ids!.map(id => data.find(v => v.id === id)).filter(Boolean));
      } else {
        setAdminSimilarVehicles(similar.filter(v => v.type === vehicle.type).slice(0, 4));
      }

      const allCitiesRes = await supabase.from('pricing_cities').select('*, state:pricing_states(*)').eq('is_active', true).order('is_popular', { ascending: false }).order('name');
      if (allCitiesRes.data) setCities(allCitiesRes.data as PricingCity[]);

      const today = new Date().toISOString().split('T')[0];
      const { data: ads } = await supabase.from('advertisements').select('*').eq('is_active', true).eq('ad_position', 'vehicle_sidebar').or(`end_date.is.null,end_date.gte.${today}`).order('sort_order', { ascending: true }).limit(1);
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

  useEffect(() => { setEmiDownPayment(Math.round(legacyPriceBreakdown.onRoadPrice * 0.1)); }, [legacyPriceBreakdown.onRoadPrice]);
  useEffect(() => { if (selectedCity && typeof window !== 'undefined') localStorage.setItem('selectedCity', JSON.stringify(selectedCity)); }, [selectedCity]);

  const popularCities = useMemo(() => cities.filter(c => c.is_popular).slice(0, 8), [cities]);
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cities.slice(0, 20);
    const s = citySearch.toLowerCase();
    return cities.filter(c => c.name.toLowerCase().includes(s) || c.pincode?.includes(s) || c.state?.name?.toLowerCase().includes(s)).slice(0, 20);
  }, [cities, citySearch]);

  const activeVariants = variants.filter(v => v.status === 'active');

  const handleSelectCity = useCallback((city: PricingCity) => { setSelectedCity(city); if (city.state) setSelectedState(city.state as PricingState); setShowCityModal(false); setCitySearch(''); }, []);
  const handleSelectVariant = useCallback((v: VehicleVariant) => {
    setSelectedVariant(v);
    // Update URL with variant slug for SEO-friendly sharing
    const variantSlug = v.slug || v.id;
    const url = new URL(window.location.href);
    url.searchParams.set('variant', String(variantSlug));
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  const nextImage = useCallback(() => setCurrentImageIndex(i => (i + 1) % galleryImages.length), [galleryImages.length]);
  const prevImage = useCallback(() => setCurrentImageIndex(i => (i - 1 + galleryImages.length) % galleryImages.length), [galleryImages.length]);

  const getColorHex = (name: string): string => {
    const map: Record<string, string> = { black: '#1a1a1a', white: '#f5f5f5', silver: '#c0c0c0', grey: '#808080', gray: '#808080', blue: '#1e40af', red: '#dc2626', green: '#16a34a', orange: '#ea580c', yellow: '#eab308', brown: '#78350f', gold: '#ffd700', teal: '#0d9488', purple: '#7c3aed', cyan: '#06b6d4', pink: '#ec4899' };
    const n = name.toLowerCase().trim();
    for (const [k, v] of Object.entries(map)) if (n.includes(k)) return v;
    return '#9ca3af';
  };

  // Build specifications list in admin order (specifications object preserves insertion order in modern JS)
  const specItems: { label: string; value: string }[] = useMemo(() => {
    const items: { label: string; value: string }[] = [];
    // Add core specs first if they have values
    if (display.range_km > 0) items.push({ label: 'Range', value: `${display.range_km} km` });
    if (display.battery_capacity_kwh > 0) items.push({ label: 'Battery Capacity', value: `${display.battery_capacity_kwh} kWh` });
    if (display.top_speed_kmh > 0) items.push({ label: 'Top Speed', value: `${display.top_speed_kmh} km/h` });
    if (display.motor_power_kw > 0) items.push({ label: 'Motor Power', value: `${display.motor_power_kw} kW` });
    if (display.charging_time_hrs > 0) items.push({ label: 'Charging Time', value: `${display.charging_time_hrs} hrs` });
    if (display.kerb_weight && display.kerb_weight > 0) items.push({ label: 'Kerb Weight', value: `${display.kerb_weight} kg` });
    // Then add additional specifications from the specifications object (preserves admin order)
    Object.entries(display.specifications).forEach(([key, value]) => {
      items.push({ label: key, value: String(value) });
    });
    return items;
  }, [display]);

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
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Gallery - Compact */}
            <div className="w-full lg:w-[45%]">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 group">
                <img src={galleryImages[currentImageIndex]} alt={vehicle.name} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = '/images/placeholders/image.png'; }} />
                {galleryImages.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                      <ChevronLeft size={18} className="text-gray-700" />
                    </button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                      <ChevronRight size={18} className="text-gray-700" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {galleryImages.map((_, i) => (
                        <button key={i} onClick={() => setCurrentImageIndex(i)} className={cn('w-2 h-2 rounded-full transition-all', i === currentImageIndex ? 'bg-white w-5' : 'bg-white/50 hover:bg-white/80')} />
                      ))}
                    </div>
                  </>
                )}
                {vehicle.is_upcoming && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">Upcoming</span>
                )}
                {vehicle.is_latest && !vehicle.is_upcoming && (
                  <span className="absolute top-3 left-3 bg-[#145a2c] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">New Launch</span>
                )}
              </div>

              {/* Thumbnails - Compact */}
              {galleryImages.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {galleryImages.map((img, i) => (
                    <button key={i} onClick={() => setCurrentImageIndex(i)} className={cn('w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border-2 transition-all', i === currentImageIndex ? 'border-[#145a2c] ring-1 ring-green-200' : 'border-transparent hover:border-gray-300')}>
                      <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/images/placeholders/image.png'; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info - Wider */}
            <div className="w-full lg:w-[55%] space-y-4">
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{vehicle.name}</h1>

              {/* Colors inline */}
              {allColors.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Palette size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Colours:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {allColors.map((color, i) => (
                      <div key={i} className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
                        <span className="w-2.5 h-2.5 rounded-full border border-gray-200" style={{ backgroundColor: getColorHex(color) }} />
                        <span className="text-xs text-gray-700">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variant selector */}
              {activeVariants.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {activeVariants.map((v) => (
                    <button key={v.id} onClick={() => handleSelectVariant(v)} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all', selectedVariant?.id === v.id ? 'bg-[#145a2c] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                      {v.short_name || v.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <Zap size={16} className="mx-auto text-amber-600 mb-1" />
                  <p className="text-[10px] text-gray-500">Range</p>
                  <p className="text-sm font-bold text-gray-900">{display.range_km} km</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <Battery size={16} className="mx-auto text-green-600 mb-1" />
                  <p className="text-[10px] text-gray-500">Battery</p>
                  <p className="text-sm font-bold text-gray-900">{display.battery_capacity_kwh} kWh</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <Gauge size={16} className="mx-auto text-blue-600 mb-1" />
                  <p className="text-[10px] text-gray-500">Speed</p>
                  <p className="text-sm font-bold text-gray-900">{display.top_speed_kmh} km/h</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <Clock size={16} className="mx-auto text-purple-600 mb-1" />
                  <p className="text-[10px] text-gray-500">Charge</p>
                  <p className="text-sm font-bold text-gray-900">{display.charging_time_hrs}h</p>
                </div>
              </div>

              {/* Price Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Ex-showroom Price</p>
                    <p className="text-2xl font-bold text-[#145a2c]">{formatPrice(priceBreakdown.ex_showroom)}</p>
                    {vehicle.price_min !== vehicle.price_max && vehicle.price_max > 0 && (
                      <p className="text-[10px] text-gray-500">{formatPrice(vehicle.price_min)} - {formatPrice(vehicle.price_max)}</p>
                    )}
                  </div>
                  <button onClick={() => setShowCityModal(true)} className="flex items-center gap-1 px-2.5 py-1.5 bg-white rounded-lg text-xs font-medium border hover:shadow-sm transition-all">
                    <MapPin size={11} /> {selectedCity?.name || 'City'} <ChevronDown size={11} />
                  </button>
                </div>
                <div className="bg-white/70 rounded-lg p-2.5 flex justify-between items-center">
                  <span className="text-sm text-gray-600">On-road Price</span>
                  <span className="text-lg font-bold text-gray-900">{formatPrice(priceBreakdown.on_road)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700 mt-2">
                  <Calculator size={12} className="text-[#145a2c]" />
                  <span>EMI from <strong className="text-[#145a2c]">{formatPrice(emiResult.emi)}/mo</strong></span>
                  <button onClick={() => setShowEMIModal(true)} className="text-[#145a2c] hover:underline text-[10px] font-medium ml-auto">Calculate</button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/compare?vehicles=${vehicle.slug}`} className="flex items-center justify-center gap-2 border-2 border-[#145a2c] text-[#145a2c] rounded-xl py-3 font-semibold hover:bg-[#145a2c] hover:text-white transition-all text-sm">
                  <Scale size={16} /> Compare
                </Link>
                <button onClick={() => setShowOfferModal(true)} className="flex items-center justify-center gap-2 bg-orange-500 text-white rounded-xl py-3 font-semibold hover:bg-orange-600 transition-colors text-sm">
                  <ShoppingBag size={16} /> Get Offers
                </button>
              </div>

              {/* Brochure Download */}
              {selectedVariant?.brochure_url && (
                <a href={selectedVariant.brochure_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 rounded-xl py-2.5 font-medium hover:bg-gray-50 transition-colors text-sm">
                  <FileText size={16} /> Download Brochure
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT AREA - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT COLUMN - Content Sections */}
          <div className="w-full lg:w-[65%] space-y-5">

            {/* ABOUT Section */}
            {vehicle.description && (
              <section className="bg-white rounded-xl border p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About {vehicle.name}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{vehicle.description}</p>
              </section>
            )}

            {/* SPECIFICATIONS Section - Uniform gray cards */}
            <section className="bg-white rounded-xl border p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Specifications</h2>
              {specItems.length > 0 ? (
                <div className="space-y-2">
                  {specItems.map((spec, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{spec.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{spec.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6 text-sm">No specifications available.</p>
              )}
            </section>

            {/* FEATURES Section */}
            {(() => {
              const displayFeatures = selectedVariant?.features && selectedVariant.features.length > 0
                ? selectedVariant.features
                : vehicle.features;
              return displayFeatures && displayFeatures.length > 0 ? (
                <section className="bg-white rounded-xl border p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Features & Details</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {displayFeatures.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                        <div className="w-5 h-5 bg-[#145a2c] rounded-full flex items-center justify-center flex-shrink-0">
                          <Check size={12} className="text-white" />
                        </div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null;
            })()}

            {/* PROS & CONS Section - variant-level with vehicle fallback */}
            {(() => {
              const displayPros = (selectedVariant?.pros?.length ?? 0) > 0 ? selectedVariant!.pros : vehicle.pros;
              const displayCons = (selectedVariant?.cons?.length ?? 0) > 0 ? selectedVariant!.cons : vehicle.cons;
              if (!displayPros?.length && !displayCons?.length) return null;
              return (
                <section className="bg-white rounded-xl border p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Pros & Cons</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {displayPros?.length > 0 && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <h3 className="text-sm font-semibold text-green-700 flex items-center gap-2 mb-3"><ThumbsUp size={14} /> Pros</h3>
                        <ul className="space-y-2">{displayPros.map((p, i) => <li key={i} className="flex gap-2 text-sm text-gray-700"><Check size={14} className="text-green-500 mt-0.5 flex-shrink-0" />{p}</li>)}</ul>
                      </div>
                    )}
                    {displayCons?.length > 0 && (
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-3"><ThumbsDown size={14} /> Cons</h3>
                        <ul className="space-y-2">{displayCons.map((c, i) => <li key={i} className="flex gap-2 text-sm text-gray-700"><X size={14} className="text-red-400 mt-0.5 flex-shrink-0" />{c}</li>)}</ul>
                      </div>
                    )}
                  </div>
                </section>
              );
            })()}

            {/* VARIANTS Section */}
            <section className="bg-white rounded-xl border p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Variants</h2>
              {activeVariants.length > 0 ? (
                <div className="space-y-3">
                  {activeVariants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <div key={v.id} className={cn('border rounded-lg p-3 transition-all', isSelected ? 'border-[#145a2c] bg-green-50' : 'border-gray-200 hover:border-gray-300')}>
                        <div className="flex flex-col sm:flex-row gap-3">
                          {v.image_url && (
                            <img src={v.image_url} alt={v.name} className="w-full sm:w-24 h-20 rounded-lg object-cover bg-gray-100" onError={(e) => { e.currentTarget.src = '/images/placeholders/image.png'; }} />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{v.short_name || v.name}</h3>
                                {v.short_name && <p className="text-xs text-gray-500 truncate">{v.name}</p>}
                              </div>
                              <p className="text-lg font-bold text-[#145a2c] whitespace-nowrap">{formatPrice(v.price)}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600 mb-2">
                              {v.range_km && <span className="flex items-center gap-1"><Zap size={10} />{v.range_km} km</span>}
                              {v.battery_capacity_kwh && <span className="flex items-center gap-1"><Battery size={10} />{v.battery_capacity_kwh} kWh</span>}
                              {v.top_speed_kmh && <span className="flex items-center gap-1"><Gauge size={10} />{v.top_speed_kmh} km/h</span>}
                              {v.charging_time_hrs && <span className="flex items-center gap-1"><Clock size={10} />{v.charging_time_hrs}h</span>}
                            </div>
                            <button onClick={() => handleSelectVariant(v)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', isSelected ? 'bg-[#145a2c] text-white' : 'bg-gray-100 text-gray-700 hover:bg-[#145a2c] hover:text-white')}>
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6 text-sm">No variants available.</p>
              )}
            </section>

            {/* PRICE BREAKDOWN Section */}
            <section className="bg-white rounded-xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp size={18} className="text-[#145a2c]" /> On-Road Price Breakdown</h2>
                <button onClick={() => setShowCityModal(true)} className="flex items-center gap-1 text-xs text-[#145a2c] hover:underline font-medium"><MapPin size={12} />{selectedCity?.name || 'Select City'}</button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ex-showroom</span>
                    <span className="text-sm font-medium text-gray-900">{formatPrice(priceBreakdown.ex_showroom)}</span>
                  </div>
                  {priceBreakdown.breakdown.show_rto && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">RTO / Road Tax ({priceBreakdown.rto_percentage}%)</span>
                      <span className="text-sm font-medium text-gray-900">{formatPrice(priceBreakdown.rto)}</span>
                    </div>
                  )}
                  {priceBreakdown.breakdown.show_insurance && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Insurance ({priceBreakdown.insurance_percentage}%)</span>
                      <span className="text-sm font-medium text-gray-900">{formatPrice(priceBreakdown.insurance)}</span>
                    </div>
                  )}
                  {priceBreakdown.breakdown.show_registration && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Registration Fee</span>
                      <span className="text-sm font-medium text-gray-900">{formatPrice(priceBreakdown.registration)}</span>
                    </div>
                  )}
                  {priceBreakdown.breakdown.show_hsrp && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">HSRP</span>
                      <span className="text-sm font-medium text-gray-900">{formatPrice(priceBreakdown.hsrp)}</span>
                    </div>
                  )}
                  {priceBreakdown.breakdown.show_fastag && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">FASTag</span>
                      <span className="text-sm font-medium text-gray-900">{formatPrice(priceBreakdown.fastag)}</span>
                    </div>
                  )}
                  {priceBreakdown.breakdown.show_other && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Other Charges</span>
                      <span className="text-sm font-medium text-gray-900">{formatPrice(priceBreakdown.other)}</span>
                    </div>
                  )}
                  {priceBreakdown.subsidy > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        {priceBreakdown.subsidy_description || 'EV Subsidy'}
                      </span>
                      <span className="text-sm font-medium text-green-600">-{formatPrice(priceBreakdown.subsidy)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <span className="font-semibold text-gray-700 text-sm">Total On-Road Price</span>
                  <span className="text-xl font-bold text-[#145a2c]">{formatPrice(priceBreakdown.on_road)}</span>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR - Sticky */}
          <div className="w-full lg:w-[35%]">
            <div className="lg:sticky lg:top-20 space-y-5">

              {/* 1. GET OFFER Card */}
              <section className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
                <h3 className="font-bold text-lg mb-1">Get Best Offers</h3>
                <p className="text-sm text-orange-100 mb-3">Exclusive deals from dealers</p>
                <button onClick={() => setShowOfferModal(true)} className="w-full bg-white text-orange-600 rounded-lg py-2.5 font-bold hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 text-sm">
                  <ShoppingBag size={16} />Get Offers
                </button>
              </section>

              {/* 2. SIMILAR VEHICLES */}
              {adminSimilarVehicles.length > 0 && (
                <section className="bg-white rounded-xl border p-4">
                  <h3 className="text-base font-bold text-gray-900 mb-3">Similar {getVehicleTypeLabel(vehicle.type)}s</h3>
                  <div className="space-y-3">
                    {adminSimilarVehicles.slice(0, 4).map((v) => (
                      <Link key={v.id} href={`/vehicles/${v.slug}`} className="block group">
                        <div className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                          {v.image_url ? (
                            <img src={v.image_url} alt={v.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100 flex-shrink-0" onError={(e) => { e.currentTarget.src = '/images/placeholders/image.png'; }} />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Zap size={20} className="text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <p className="font-medium text-gray-900 group-hover:text-[#145a2c] transition-colors text-sm truncate">{v.name}</p>
                            <p className="text-xs text-gray-500">{v.manufacturers?.name}</p>
                            <p className="text-sm font-bold text-[#145a2c]">{formatPrice(v.price_min)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href={`/vehicles?type=${vehicle.type}`} className="block text-center text-xs text-[#145a2c] font-medium mt-3 hover:underline py-2 border-t border-gray-100">
                    View all →
                  </Link>
                </section>
              )}

              {/* 3. RELATED NEWS */}
              {relatedNews.length > 0 && (
                <section className="bg-white rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-gray-900">Related News</h3>
                    <Link href="/news" className="text-xs text-[#145a2c] font-medium hover:underline">View all</Link>
                  </div>
                  <div className="space-y-3">
                    {relatedNews.slice(0, 3).map((article) => (
                      <Link key={article.id} href={`/news/${article.slug}`} className="block group">
                        <div className="flex gap-2.5">
                          <img src={article.image_url} alt="" className="w-14 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0" onError={(e) => { e.currentTarget.src = '/images/placeholders/image.png'; }} />
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

              {/* 4. ADVERTISEMENT */}
              {advertisement && (
                <section className="bg-white rounded-xl border overflow-hidden">
                  <div className="text-[10px] text-gray-400 text-center py-1.5 bg-gray-50 uppercase tracking-wide">Advertisement</div>
                  {advertisement.image_url && (
                    <a href={advertisement.link_url || '#'} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={advertisement.image_url} alt={advertisement.title} className="w-full aspect-square object-cover" onError={(e) => { e.currentTarget.src = '/images/placeholders/image.png'; }} />
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
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div><p className="text-[10px] text-gray-500">On-road Price</p><p className="text-base font-bold text-[#145a2c]">{formatPrice(priceBreakdown.on_road)}</p></div>
          <div className="flex gap-2">
            <button onClick={() => setShowEMIModal(true)} className="px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold hover:bg-gray-200">EMI {formatPrice(emiResult.emi)}</button>
            <button onClick={() => setShowOfferModal(true)} className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600">Get Offer</button>
          </div>
        </div>
      </div>
      <div className="h-16 lg:hidden" />

      {/* Modals */}
      {showCityModal && <CityModal cities={cities} popularCities={popularCities} filteredCities={filteredCities} selectedCity={selectedCity} citySearch={citySearch} setCitySearch={setCitySearch} onSelect={handleSelectCity} onClose={() => setShowCityModal(false)} />}
      {showEMIModal && <EMIModal priceBreakdown={legacyPriceBreakdown} emiDownPayment={emiDownPayment} setEmiDownPayment={setEmiDownPayment} emiInterestRate={emiInterestRate} setEmiInterestRate={setEmiInterestRate} emiTenure={emiTenure} setEmiTenure={setEmiTenure} emiResult={emiResult} onGetOffer={() => { setShowEMIModal(false); setShowOfferModal(true); }} onClose={() => setShowEMIModal(false)} />}
      <OfferEnquiryModal vehicleId={vehicle.id} vehicleName={vehicle.name} vehiclePrice={priceBreakdown.on_road} variantName={selectedVariant?.short_name || selectedVariant?.name} selectedCity={selectedCity?.name} isOpen={showOfferModal} onClose={() => setShowOfferModal(false)} />
    </div>
  );
}

// Modal Components
function CityModal({ cities, popularCities, filteredCities, selectedCity, citySearch, setCitySearch, onSelect, onClose }: { cities: PricingCity[]; popularCities: PricingCity[]; filteredCities: PricingCity[]; selectedCity: PricingCity | null; citySearch: string; setCitySearch: (v: string) => void; onSelect: (c: PricingCity) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#145a2c] flex items-center justify-center animate-in zoom-in-50 duration-300">
              <MapPin size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Select Your City</h3>
              <p className="text-xs text-gray-500">Choose your location for accurate pricing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200/50 rounded-lg transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <div className="p-5">
          <div className="relative mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Search city or pincode..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c] transition-all"
              autoFocus
            />
          </div>
          {!citySearch && (
            <div className="mb-4 animate-in fade-in duration-300 delay-75">
              <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={12} className="text-[#145a2c]" /> Popular Cities
              </h4>
              <div className="flex flex-wrap gap-2">
                {popularCities.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c)}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md animate-in fade-in zoom-in-75',
                      selectedCity?.id === c.id
                        ? 'bg-[#145a2c] text-white shadow-md'
                        : 'bg-gray-50 hover:bg-green-50 hover:text-[#145a2c] border border-gray-100'
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {citySearch && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredCities.length === 0 && <p className="text-center text-sm text-gray-400 py-4">No cities found</p>}
              {filteredCities.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl transition-all duration-150 flex justify-between items-center animate-in fade-in slide-in-from-left-2',
                    selectedCity?.id === c.id ? 'bg-green-50 text-[#145a2c] border border-green-200' : 'hover:bg-gray-50 border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin size={15} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.state?.name || c.pincode}</p>
                    </div>
                  </div>
                  {selectedCity?.id === c.id && <Check size={16} className="text-[#145a2c]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EMIModal({ priceBreakdown, emiDownPayment, setEmiDownPayment, emiInterestRate, setEmiInterestRate, emiTenure, setEmiTenure, emiResult, onGetOffer, onClose }: { priceBreakdown: any; emiDownPayment: number; setEmiDownPayment: (v: number) => void; emiInterestRate: number; setEmiInterestRate: (v: number) => void; emiTenure: number; setEmiTenure: (v: number) => void; emiResult: any; onGetOffer: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b"><h3 className="text-lg font-bold">EMI Calculator</h3><button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} className="text-gray-400" /></button></div>
        <div className="p-4 space-y-4">
          <div><p className="text-xs text-gray-600 mb-1">Vehicle Price (On-road)</p><p className="text-base font-bold">{formatPrice(priceBreakdown.onRoadPrice)}</p></div>
          <div><label className="text-xs text-gray-600 mb-2 block">Down Payment: <strong className="text-[#145a2c]">{formatPrice(emiDownPayment)}</strong></label><input type="range" min={0} max={priceBreakdown.onRoadPrice} step={Math.max(100, Math.round(priceBreakdown.onRoadPrice / 1000))} value={emiDownPayment} onChange={(e) => setEmiDownPayment(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#145a2c]" /><div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>₹0</span><span>{formatPrice(priceBreakdown.onRoadPrice)}</span></div></div>
          <div><label className="text-xs text-gray-600 mb-2 block">Interest Rate: <strong className="text-[#145a2c]">{emiInterestRate}%</strong> p.a.</label><input type="range" min={5} max={15} step={0.25} value={emiInterestRate} onChange={(e) => setEmiInterestRate(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#145a2c]" /></div>
          <div><label className="text-xs text-gray-600 mb-2 block">Loan Tenure</label><div className="grid grid-cols-4 gap-2">{[12, 24, 36, 48].map((m) => <button key={m} onClick={() => setEmiTenure(m)} className={cn('py-2 rounded-lg text-sm font-semibold', emiTenure === m ? 'bg-[#145a2c] text-white' : 'bg-gray-100 hover:bg-gray-200')}>{m}mo</button>)}</div></div>
          <div className="bg-gradient-to-br from-[#145a2c] to-[#0f3d1e] rounded-lg p-4 text-white"><p className="text-xs text-green-200 mb-1">Monthly EMI</p><p className="text-2xl font-bold">{formatPrice(emiResult.emi)}</p><div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/20 text-sm"><div><p className="text-xs text-green-200">Loan Amount</p><p className="font-semibold">{formatPrice(emiResult.principal)}</p></div><div><p className="text-xs text-green-200">Total Interest</p><p className="font-semibold">{formatPrice(emiResult.totalInterest)}</p></div></div></div>
          <button onClick={onGetOffer} className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors text-sm"><ShoppingBag size={16} />Get Best Offer</button>
        </div>
      </div>
    </div>
  );
}
