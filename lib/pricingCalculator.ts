import { supabase } from '@/lib/supabase';
import { VehiclePricingCategory } from '@/lib/types';

export interface PricingProfileMatch {
  id: string;
  name: string;
  city_id: string;
  vehicle_category: VehiclePricingCategory;
  rto_percentage: number;
  insurance_percentage: number;
  registration_fee: number;
  hsrp_fee: number;
  fastag_fee: number;
  handling_charges: number;
  dealer_charges: number;
  delivery_charges: number;
  accessories_charges: number;
  other_charges: number;
  misc_charges: number;
  show_rto: boolean;
  show_insurance: boolean;
  show_registration: boolean;
  show_hsrp: boolean;
  show_fastag: boolean;
  show_handling: boolean;
  show_dealer: boolean;
  show_delivery: boolean;
  show_accessories: boolean;
  show_other: boolean;
  show_misc: boolean;
  calculation_order: string[];
  has_subsidy: boolean;
  subsidy_type: 'fixed' | 'percentage';
  subsidy_value: number;
  subsidy_title: string | null;
  subsidy_badge_text: string | null;
  subsidy_description: string | null;
  subsidy_start_date: string | null;
  subsidy_end_date: string | null;
  slabs?: {
    min_price: number;
    max_price: number | null;
    tax_percentage: number;
    is_active: boolean;
  }[];
  priority: number;
}

export interface PriceBreakdown {
  ex_showroom: number;
  rto: number;
  rto_percentage: number;
  insurance: number;
  insurance_percentage: number;
  registration: number;
  hsrp: number;
  fastag: number;
  handling: number;
  dealer: number;
  delivery: number;
  accessories: number;
  other: number;
  misc: number;
  subsidy: number;
  subsidy_title: string | null;
  subsidy_badge_text: string | null;
  subsidy_description: string | null;
  on_road: number;
  breakdown: {
    show_rto: boolean;
    show_insurance: boolean;
    show_registration: boolean;
    show_hsrp: boolean;
    show_fastag: boolean;
    show_handling: boolean;
    show_dealer: boolean;
    show_delivery: boolean;
    show_accessories: boolean;
    show_other: boolean;
    show_misc: boolean;
  };
  profile_name: string | null;
}

export interface OnRoadPriceParams {
  cityId: string;
  exShowroomPrice: number;
  vehicleCategory: VehiclePricingCategory;
  vehicleType?: 'scooter' | 'bike' | 'car';
  batteryCapacityKwh?: number;
  brandId?: string;
  vehicleId?: string;
  variantId?: string;
}

/**
 * Find the best matching pricing profile for the given parameters.
 * Priority order: Specific overrides > City > Default
 */
export async function findPricingProfile(params: OnRoadPriceParams): Promise<PricingProfileMatch | null> {
  const { cityId, exShowroomPrice, vehicleCategory, vehicleType, batteryCapacityKwh, brandId, vehicleId, variantId } = params;

  // Query all applicable profiles for this city/category combination
  const { data: profiles, error } = await supabase
    .from('pricing_profiles')
    .select(`
      *,
      slabs:pricing_profile_slabs(min_price, max_price, tax_percentage, is_active)
    `)
    .eq('city_id', cityId)
    .eq('vehicle_category', vehicleCategory)
    .eq('status', 'published')
    .order('priority', { ascending: false });

  if (error || !profiles || profiles.length === 0) {
    // Fallback: try to find a default profile (no city) for this category
    const { data: defaultProfiles } = await supabase
      .from('pricing_profiles')
      .select(`
        *,
        slabs:pricing_profile_slabs(min_price, max_price, tax_percentage, is_active)
      `)
      .is('city_id', null)
      .eq('vehicle_category', vehicleCategory)
      .eq('status', 'published')
      .order('priority', { ascending: false })
      .limit(1);

    if (defaultProfiles && defaultProfiles.length > 0) {
      return filterAndMatchProfile(defaultProfiles, params);
    }
    return null;
  }

  return filterAndMatchProfile(profiles, params);
}

function filterAndMatchProfile(profiles: any[], params: OnRoadPriceParams): PricingProfileMatch | null {
  const { exShowroomPrice, vehicleType, batteryCapacityKwh, brandId, vehicleId, variantId } = params;

  // Filter profiles by conditions
  const matchingProfiles = profiles.filter(profile => {
    // Check vehicle type condition
    if (profile.vehicle_type && profile.vehicle_type !== vehicleType) return false;

    // Check brand condition
    if (profile.brand_id && profile.brand_id !== brandId) return false;

    // Check vehicle condition
    if (profile.vehicle_id && profile.vehicle_id !== vehicleId) return false;

    // Check variant condition
    if (profile.variant_id && profile.variant_id !== variantId) return false;

    // Check battery capacity range
    if (profile.battery_min_kwh && batteryCapacityKwh !== undefined) {
      if (batteryCapacityKwh < profile.battery_min_kwh) return false;
    }
    if (profile.battery_max_kwh && batteryCapacityKwh !== undefined) {
      if (batteryCapacityKwh > profile.battery_max_kwh) return false;
    }

    // Check price range
    if (profile.price_range_min && exShowroomPrice < profile.price_range_min) return false;
    if (profile.price_range_max && exShowroomPrice > profile.price_range_max) return false;

    // Check effective date
    if (profile.effective_date) {
      const today = new Date().toISOString().split('T')[0];
      if (today < profile.effective_date) return false;
    }

    return true;
  });

  // Return highest priority match
  if (matchingProfiles.length > 0) {
    // Sort by priority (already sorted from query, but ensure)
    matchingProfiles.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return matchingProfiles[0] as PricingProfileMatch;
  }

  // If no specific matches, return the first profile (highest priority without conditions)
  return profiles[0] as PricingProfileMatch || null;
}

/**
 * Find applicable tax slab for a given price
 */
function findApplicableSlab(slabs: PricingProfileMatch['slabs'], price: number): { tax_percentage: number } | null {
  if (!slabs || slabs.length === 0) return null;

  const activeSlabs = slabs.filter(s => s.is_active !== false);
  for (const slab of activeSlabs) {
    if (price >= slab.min_price) {
      if (slab.max_price === null || price <= slab.max_price) {
        return { tax_percentage: slab.tax_percentage };
      }
    }
  }
  return null;
}

/**
 * Check if subsidy is currently active
 */
function isSubsidyActive(profile: PricingProfileMatch): boolean {
  if (!profile.has_subsidy) return false;

  const today = new Date().toISOString().split('T')[0];
  if (profile.subsidy_start_date && today < profile.subsidy_start_date) return false;
  if (profile.subsidy_end_date && today > profile.subsidy_end_date) return false;

  return true;
}

/**
 * Calculate on-road price breakdown using a pricing profile
 */
export function calculateOnRoadPrice(
  exShowroomPrice: number,
  profile: PricingProfileMatch
): PriceBreakdown {
  // Find applicable tax slab for RTO override
  const applicableSlab = findApplicableSlab(profile.slabs, exShowroomPrice);
  const rtoPercentage = applicableSlab?.tax_percentage ?? profile.rto_percentage;

  // Calculate percentage-based charges
  const rto = profile.show_rto ? Math.round((exShowroomPrice * rtoPercentage) / 100) : 0;
  const insurance = profile.show_insurance ? Math.round((exShowroomPrice * profile.insurance_percentage) / 100) : 0;

  // Fixed charges
  const registration = profile.show_registration ? profile.registration_fee : 0;
  const hsrp = profile.show_hsrp ? profile.hsrp_fee : 0;
  const fastag = profile.show_fastag ? profile.fastag_fee : 0;
  const handling = profile.show_handling ? profile.handling_charges : 0;
  const dealer = profile.show_dealer ? profile.dealer_charges : 0;
  const delivery = profile.show_delivery ? profile.delivery_charges : 0;
  const accessories = profile.show_accessories ? profile.accessories_charges : 0;
  const other = profile.show_other ? profile.other_charges : 0;
  const misc = profile.show_misc ? profile.misc_charges : 0;

  // Calculate total before subsidy
  const totalBeforeSubsidy = exShowroomPrice + rto + insurance + registration + hsrp + fastag +
    handling + dealer + delivery + accessories + other + misc;

  // Calculate subsidy
  let subsidy = 0;
  let subsidyActive = isSubsidyActive(profile);
  if (subsidyActive && profile.subsidy_value > 0) {
    subsidy = profile.subsidy_type === 'percentage'
      ? Math.round((exShowroomPrice * profile.subsidy_value) / 100)
      : profile.subsidy_value;
  }

  const on_road = totalBeforeSubsidy - subsidy;

  return {
    ex_showroom: exShowroomPrice,
    rto,
    rto_percentage: rtoPercentage,
    insurance,
    insurance_percentage: profile.insurance_percentage,
    registration,
    hsrp,
    fastag,
    handling,
    dealer,
    delivery,
    accessories,
    other,
    misc,
    subsidy,
    subsidy_title: subsidyActive ? profile.subsidy_title : null,
    subsidy_badge_text: subsidyActive ? profile.subsidy_badge_text : null,
    subsidy_description: subsidyActive ? profile.subsidy_description : null,
    on_road,
    breakdown: {
      show_rto: profile.show_rto,
      show_insurance: profile.show_insurance,
      show_registration: profile.show_registration,
      show_hsrp: profile.show_hsrp,
      show_fastag: profile.show_fastag,
      show_handling: profile.show_handling,
      show_dealer: profile.show_dealer,
      show_delivery: profile.show_delivery,
      show_accessories: profile.show_accessories,
      show_other: profile.show_other,
      show_misc: profile.show_misc,
    },
    profile_name: profile.name,
  };
}

/**
 * Get on-road price for a vehicle in a specific city
 */
export async function getOnRoadPrice(params: OnRoadPriceParams): Promise<PriceBreakdown | null> {
  const profile = await findPricingProfile(params);
  if (!profile) {
    // Fallback to old pricing system if available
    return getLegacyOnRoadPrice(params);
  }

  return calculateOnRoadPrice(params.exShowroomPrice, profile);
}

/**
 * Fallback to legacy pricing_rules table for backward compatibility
 */
async function getLegacyOnRoadPrice(params: OnRoadPriceParams): Promise<PriceBreakdown | null> {
  const { cityId, exShowroomPrice, vehicleCategory } = params;

  const { data: rule } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('city_id', cityId)
    .eq('vehicle_category', vehicleCategory)
    .eq('is_active', true)
    .single();

  if (!rule) return null;

  // Find applicable slab
  const { data: slabs } = await supabase
    .from('pricing_slabs')
    .select('*')
    .eq('rule_id', rule.id)
    .eq('is_active', true)
    .lte('min_price', exShowroomPrice)
    .or(`max_price.is.null,max_price.gte.${exShowroomPrice}`)
    .order('sort_order')
    .limit(1);

  const rtoPercentage = slabs?.[0]?.tax_percentage ?? rule.rto_percentage;

  const rto = rule.show_rto ? Math.round((exShowroomPrice * rtoPercentage) / 100) : 0;
  const insurance = rule.show_insurance ? Math.round((exShowroomPrice * rule.insurance_percentage) / 100) : 0;
  const registration = rule.show_registration ? rule.registration_fee : 0;
  const hsrp = rule.show_hsrp ? rule.hsrp_fee : 0;
  const fastag = rule.show_fastag ? rule.fastag_fee : 0;
  const other = rule.show_other ? rule.other_charges : 0;

  // Check for subsidy
  const { data: subsidy } = await supabase
    .from('pricing_subsidies')
    .select('*')
    .eq('city_id', cityId)
    .eq('vehicle_category', vehicleCategory)
    .eq('is_active', true)
    .single();

  let subsidyAmount = 0;
  let subsidyDescription = null;
  if (subsidy) {
    subsidyAmount = subsidy.subsidy_type === 'percentage'
      ? Math.round((exShowroomPrice * subsidy.value) / 100)
      : subsidy.value;
    subsidyDescription = subsidy.description;
  }

  const on_road = exShowroomPrice + rto + insurance + registration + hsrp + fastag + other - subsidyAmount;

  return {
    ex_showroom: exShowroomPrice,
    rto,
    rto_percentage: rtoPercentage,
    insurance,
    insurance_percentage: rule.insurance_percentage,
    registration,
    hsrp,
    fastag,
    handling: 0,
    dealer: 0,
    delivery: 0,
    accessories: 0,
    other,
    misc: 0,
    subsidy: subsidyAmount,
    subsidy_title: null,
    subsidy_badge_text: null,
    subsidy_description: subsidyDescription,
    on_road,
    breakdown: {
      show_rto: rule.show_rto,
      show_insurance: rule.show_insurance,
      show_registration: rule.show_registration,
      show_hsrp: rule.show_hsrp,
      show_fastag: rule.show_fastag,
      show_handling: false,
      show_dealer: false,
      show_delivery: false,
      show_accessories: false,
      show_other: rule.show_other,
      show_misc: false,
    },
    profile_name: null,
  };
}

/**
 * Get pricing profiles for multiple cities (for comparison)
 */
export async function getPricingForCities(
  exShowroomPrice: number,
  vehicleCategory: VehiclePricingCategory,
  cityIds: string[],
  vehicleType?: 'scooter' | 'bike' | 'car',
  batteryCapacityKwh?: number
): Promise<Map<string, PriceBreakdown>> {
  const results = new Map<string, PriceBreakdown>();

  await Promise.all(cityIds.map(async cityId => {
    const breakdown = await getOnRoadPrice({
      cityId,
      exShowroomPrice,
      vehicleCategory,
      vehicleType,
      batteryCapacityKwh,
    });
    if (breakdown) {
      results.set(cityId, breakdown);
    }
  }));

  return results;
}
