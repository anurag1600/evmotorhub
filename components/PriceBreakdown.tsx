'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PricingState, PricingCity } from '@/lib/types';
import { MapPin, ChevronDown, Calculator, Info, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';

interface PriceBreakdownProps {
  exShowroomPrice: number;
  vehicleName: string;
}

interface PriceBreakdownResult {
  exShowroomPrice: number;
  rtoCharges: number;
  insurance: number;
  roadTax: number;
  otherCharges: number;
  onRoadPrice: number;
}

export function calculateOnRoadPrice(
  exShowroomPrice: number,
  state: PricingState | null,
  city: PricingCity | null
): PriceBreakdownResult {
  // Calculate RTO (typically a percentage of ex-showroom or flat amount from city)
  const rtoCharges = city?.rto_charge || Math.round(exShowroomPrice * (state?.rto_percentage || 8) / 100);

  // Insurance (from city or estimated at 3-5% of ex-showroom)
  const insurance = city?.insurance_charge || Math.round(exShowroomPrice * 0.04);

  // Road Tax (state-specific percentage)
  const roadTax = Math.round(exShowroomPrice * (state?.road_tax_percentage || 0) / 100);

  // Other charges (registration, handling, etc.)
  const otherCharges = city?.other_charges || state?.other_charges || 1000;

  return {
    exShowroomPrice,
    rtoCharges,
    insurance,
    roadTax,
    otherCharges,
    onRoadPrice: exShowroomPrice + rtoCharges + insurance + roadTax + otherCharges,
  };
}

export default function PriceBreakdown({ exShowroomPrice, vehicleName }: PriceBreakdownProps) {
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState<PricingState[]>([]);
  const [cities, setCities] = useState<PricingCity[]>([]);
  const [selectedState, setSelectedState] = useState<PricingState | null>(null);
  const [selectedCity, setSelectedCity] = useState<PricingCity | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdownResult | null>(null);

  // Calculate price whenever selection changes
  useEffect(() => {
    setPriceBreakdown(calculateOnRoadPrice(exShowroomPrice, selectedState, selectedCity));
  }, [exShowroomPrice, selectedState, selectedCity]);

  // Fetch states on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: statesData } = await supabase
          .from('pricing_states')
          .select('*')
          .eq('is_active', true)
          .order('name');
        setStates((statesData || []) as PricingState[]);

        // Set Delhi as default
        const delhi = (statesData || []).find((s: PricingState) => s.code === 'DL');
        if (delhi) {
          setSelectedState(delhi);
          const { data: citiesData } = await supabase
            .from('pricing_cities')
            .select('*, state:pricing_states(*)')
            .eq('state_id', delhi.id)
            .eq('is_active', true)
            .order('name');
          setCities((citiesData || []) as PricingCity[]);
          if (citiesData && citiesData.length > 0) {
            setSelectedCity(citiesData[0] as PricingCity);
          }
        }
      } catch (err) {
        console.error('Failed to fetch pricing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStateChange = async (state: PricingState) => {
    setSelectedState(state);
    setSelectedCity(null);
    const { data } = await supabase
      .from('pricing_cities')
      .select('*, state:pricing_states(*)')
      .eq('state_id', state.id)
      .eq('is_active', true)
      .order('name');
    setCities((data || []) as PricingCity[]);
    if (data && data.length > 0) {
      setSelectedCity(data[0] as PricingCity);
    }
  };

  if (loading || !priceBreakdown) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator size={16} className="text-[#145a2c]" />
            <h3 className="text-sm font-bold text-gray-900">On-Road Price</h3>
          </div>
          <button
            onClick={() => setShowLocationPicker(!showLocationPicker)}
            className="flex items-center gap-1.5 text-xs text-[#145a2c] font-medium hover:bg-green-100 px-2 py-1 rounded-lg transition-colors"
          >
            <MapPin size={12} />
            {selectedCity?.name || selectedState?.name || 'Select Location'}
            <ChevronDown size={12} className={cn('transition-transform', showLocationPicker && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Location Picker */}
      {showLocationPicker && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
              <select
                value={selectedState?.id || ''}
                onChange={(e) => {
                  const state = states.find(s => s.id === e.target.value);
                  if (state) handleStateChange(state);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c]"
              >
                {states.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <select
                value={selectedCity?.id || ''}
                onChange={(e) => {
                  const city = cities.find(c => c.id === e.target.value);
                  setSelectedCity(city || null);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c]"
              >
                {cities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="p-4">
        <div className="space-y-2">
          <PriceRow label="Ex-showroom" value={priceBreakdown.exShowroomPrice} />
          <PriceRow label="RTO Charges" value={priceBreakdown.rtoCharges} info="Registration & road tax" />
          <PriceRow label="Insurance" value={priceBreakdown.insurance} info="Comprehensive insurance" />
          {priceBreakdown.roadTax > 0 && (
            <PriceRow label="Road Tax" value={priceBreakdown.roadTax} info="State road tax" />
          )}
          <PriceRow label="Other Charges" value={priceBreakdown.otherCharges} info="Registration, handling, etc." />
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">On-Road Price</span>
            <span className="text-xl font-bold text-[#145a2c]">{formatPrice(priceBreakdown.onRoadPrice)}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            * Prices are indicative. Contact dealer for exact pricing.
          </div>
        </div>

        {/* CTA */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#145a2c] text-white rounded-lg text-sm font-semibold hover:bg-[#0f4020] transition-colors">
            <Check size={14} />
            Get Best Offer
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#145a2c] text-[#145a2c] rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors">
            <Calculator size={14} />
            EMI Calculator
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceRow({ label, value, info }: { label: string; value: number; info?: string }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex justify-between items-center py-1.5 group">
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600">{label}</span>
        {info && (
          <div className="relative">
            <button
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Info size={12} />
            </button>
            {showInfo && (
              <div className="absolute left-0 top-5 z-10 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {info}
              </div>
            )}
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-gray-800">{formatPrice(value)}</span>
    </div>
  );
}

// Export a compact version for inline use
export function PriceBreakdownCompact({ exShowroomPrice }: { exShowroomPrice: number }) {
  const [selectedState, setSelectedState] = useState<PricingState | null>(null);
  const [selectedCity, setSelectedCity] = useState<PricingCity | null>(null);
  const [breakdown, setBreakdown] = useState<PriceBreakdownResult | null>(null);

  useEffect(() => {
    const fetchDefault = async () => {
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
        setSelectedCity(city as PricingCity);
        setBreakdown(calculateOnRoadPrice(exShowroomPrice, state as PricingState, city as PricingCity));
      }
    };
    fetchDefault();
  }, [exShowroomPrice]);

  if (!breakdown) return null;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500">On-road:</span>
      <span className="font-bold text-[#145a2c]">{formatPrice(breakdown.onRoadPrice)}</span>
      <span className="text-gray-400">({selectedCity?.name || 'Delhi'})</span>
    </div>
  );
}
