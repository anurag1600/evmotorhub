'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { PricingProfile, PricingProfileSlab, PricingProfileVersion, VehiclePricingCategory } from '@/lib/types';

export interface ProfileInput {
  name: string;
  description?: string | null;
  city_id?: string | null;
  vehicle_category: VehiclePricingCategory;
  status?: 'draft' | 'published' | 'archived';
  rto_percentage?: number;
  insurance_percentage?: number;
  registration_fee?: number;
  hsrp_fee?: number;
  fastag_fee?: number;
  handling_charges?: number;
  dealer_charges?: number;
  delivery_charges?: number;
  accessories_charges?: number;
  other_charges?: number;
  misc_charges?: number;
  show_rto?: boolean;
  show_insurance?: boolean;
  show_registration?: boolean;
  show_hsrp?: boolean;
  show_fastag?: boolean;
  show_handling?: boolean;
  show_dealer?: boolean;
  show_delivery?: boolean;
  show_accessories?: boolean;
  show_other?: boolean;
  show_misc?: boolean;
  calculation_order?: string[];
  brand_id?: string | null;
  vehicle_id?: string | null;
  variant_id?: string | null;
  vehicle_type?: 'scooter' | 'bike' | 'car' | null;
  battery_min_kwh?: number | null;
  battery_max_kwh?: number | null;
  price_range_min?: number | null;
  price_range_max?: number | null;
  priority?: number;
  effective_date?: string | null;
  has_subsidy?: boolean;
  subsidy_type?: 'fixed' | 'percentage';
  subsidy_value?: number;
  subsidy_title?: string | null;
  subsidy_badge_text?: string | null;
  subsidy_description?: string | null;
  subsidy_start_date?: string | null;
  subsidy_end_date?: string | null;
}

export interface SlabInput {
  min_price: number;
  max_price: number | null;
  tax_percentage: number;
  sort_order?: number;
  is_active?: boolean;
}

export function usePricingProfiles() {
  const [profiles, setProfiles] = useState<PricingProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchProfiles = useCallback(async (filters?: {
    city_id?: string;
    vehicle_category?: VehiclePricingCategory;
    status?: 'draft' | 'published' | 'archived';
  }) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('pricing_profiles')
        .select(`
          *,
          city:pricing_cities(id, name, state_id, is_active, is_popular, state:pricing_states(id, name, code)),
          slabs:pricing_profile_slabs(*)
        `)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.city_id) query = query.eq('city_id', filters.city_id);
      if (filters?.vehicle_category) query = query.eq('vehicle_category', filters.vehicle_category);
      if (filters?.status) query = query.eq('status', filters.status);

      const { data, error: err } = await query;
      if (err) throw err;
      if (mountedRef.current) setProfiles((data || []) as PricingProfile[]);
    } catch (e: any) {
      if (mountedRef.current) setError(e.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const createProfile = useCallback(async (input: ProfileInput): Promise<PricingProfile | null> => {
    const payload = {
      name: input.name.trim(),
      description: input.description || null,
      city_id: input.city_id || null,
      vehicle_category: input.vehicle_category,
      status: input.status || 'draft',
      rto_percentage: input.rto_percentage ?? 0,
      insurance_percentage: input.insurance_percentage ?? 0,
      registration_fee: input.registration_fee ?? 0,
      hsrp_fee: input.hsrp_fee ?? 0,
      fastag_fee: input.fastag_fee ?? 0,
      handling_charges: input.handling_charges ?? 0,
      dealer_charges: input.dealer_charges ?? 0,
      delivery_charges: input.delivery_charges ?? 0,
      accessories_charges: input.accessories_charges ?? 0,
      other_charges: input.other_charges ?? 0,
      misc_charges: input.misc_charges ?? 0,
      show_rto: input.show_rto ?? true,
      show_insurance: input.show_insurance ?? true,
      show_registration: input.show_registration ?? true,
      show_hsrp: input.show_hsrp ?? true,
      show_fastag: input.show_fastag ?? true,
      show_handling: input.show_handling ?? false,
      show_dealer: input.show_dealer ?? false,
      show_delivery: input.show_delivery ?? false,
      show_accessories: input.show_accessories ?? false,
      show_other: input.show_other ?? true,
      show_misc: input.show_misc ?? false,
      calculation_order: input.calculation_order ?? ['rto', 'insurance', 'registration', 'hsrp', 'fastag', 'handling', 'dealer', 'delivery', 'accessories', 'other', 'misc'],
      brand_id: input.brand_id || null,
      vehicle_id: input.vehicle_id || null,
      variant_id: input.variant_id || null,
      vehicle_type: input.vehicle_type || null,
      battery_min_kwh: input.battery_min_kwh || null,
      battery_max_kwh: input.battery_max_kwh || null,
      price_range_min: input.price_range_min || null,
      price_range_max: input.price_range_max || null,
      priority: input.priority ?? 0,
      effective_date: input.effective_date || null,
      has_subsidy: input.has_subsidy ?? false,
      subsidy_type: input.subsidy_type || 'fixed',
      subsidy_value: input.subsidy_value ?? 0,
      subsidy_title: input.subsidy_title || null,
      subsidy_badge_text: input.subsidy_badge_text || null,
      subsidy_description: input.subsidy_description || null,
      subsidy_start_date: input.subsidy_start_date || null,
      subsidy_end_date: input.subsidy_end_date || null,
    };

    const { data, error: err } = await supabase
      .from('pricing_profiles')
      .insert([payload])
      .select(`
        *,
        city:pricing_cities(id, name, state_id, is_active, is_popular, state:pricing_states(id, name, code)),
        slabs:pricing_profile_slabs(*)
      `)
      .single();

    if (err) throw new Error(err.message);
    const newProfile = data as PricingProfile;

    // Create initial version
    await supabase.from('pricing_profile_versions').insert([{
      profile_id: newProfile.id,
      version_number: 1,
      snapshot: payload,
      change_description: 'Initial creation',
    }]);

    await fetchProfiles();
    return newProfile;
  }, [fetchProfiles]);

  const updateProfile = useCallback(async (id: string, input: Partial<ProfileInput>): Promise<PricingProfile | null> => {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    // Map all editable fields
    const fields = [
      'name', 'description', 'city_id', 'vehicle_category', 'status',
      'rto_percentage', 'insurance_percentage',
      'registration_fee', 'hsrp_fee', 'fastag_fee', 'handling_charges', 'dealer_charges',
      'delivery_charges', 'accessories_charges', 'other_charges', 'misc_charges',
      'show_rto', 'show_insurance', 'show_registration', 'show_hsrp', 'show_fastag',
      'show_handling', 'show_dealer', 'show_delivery', 'show_accessories', 'show_other', 'show_misc',
      'calculation_order',
      'brand_id', 'vehicle_id', 'variant_id', 'vehicle_type',
      'battery_min_kwh', 'battery_max_kwh', 'price_range_min', 'price_range_max',
      'priority', 'effective_date',
      'has_subsidy', 'subsidy_type', 'subsidy_value', 'subsidy_title',
      'subsidy_badge_text', 'subsidy_description', 'subsidy_start_date', 'subsidy_end_date',
    ];

    for (const field of fields) {
      if ((input as any)[field] !== undefined) {
        updateData[field] = (input as any)[field];
      }
    }
    if (input.name !== undefined) updateData.name = input.name.trim();

    const { data, error: err } = await supabase
      .from('pricing_profiles')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        city:pricing_cities(id, name, state_id, is_active, is_popular, state:pricing_states(id, name, code)),
        slabs:pricing_profile_slabs(*)
      `)
      .single();

    if (err) throw new Error(err.message);
    const updated = data as PricingProfile;

    // Create version snapshot
    const { data: versions } = await supabase
      .from('pricing_profile_versions')
      .select('version_number')
      .eq('profile_id', id)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = (versions?.[0]?.version_number || 0) + 1;
    await supabase.from('pricing_profile_versions').insert([{
      profile_id: id,
      version_number: nextVersion,
      snapshot: updated,
      change_description: 'Profile updated',
    }]);

    await fetchProfiles();
    return updated;
  }, [fetchProfiles]);

  const deleteProfile = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('pricing_profiles').delete().eq('id', id);
    if (err) throw new Error(err.message);
    await fetchProfiles();
  }, [fetchProfiles]);

  const duplicateProfile = useCallback(async (profile: PricingProfile): Promise<PricingProfile | null> => {
    const input: ProfileInput = {
      name: `${profile.name} (Copy)`,
      description: profile.description,
      city_id: profile.city_id,
      vehicle_category: profile.vehicle_category,
      status: 'draft',
      rto_percentage: profile.rto_percentage,
      insurance_percentage: profile.insurance_percentage,
      registration_fee: profile.registration_fee,
      hsrp_fee: profile.hsrp_fee,
      fastag_fee: profile.fastag_fee,
      handling_charges: profile.handling_charges,
      dealer_charges: profile.dealer_charges,
      delivery_charges: profile.delivery_charges,
      accessories_charges: profile.accessories_charges,
      other_charges: profile.other_charges,
      misc_charges: profile.misc_charges,
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
      calculation_order: profile.calculation_order,
      brand_id: profile.brand_id,
      vehicle_id: profile.vehicle_id,
      variant_id: profile.variant_id,
      vehicle_type: profile.vehicle_type,
      battery_min_kwh: profile.battery_min_kwh,
      battery_max_kwh: profile.battery_max_kwh,
      price_range_min: profile.price_range_min,
      price_range_max: profile.price_range_max,
      priority: profile.priority,
      effective_date: profile.effective_date,
      has_subsidy: profile.has_subsidy,
      subsidy_type: profile.subsidy_type,
      subsidy_value: profile.subsidy_value,
      subsidy_title: profile.subsidy_title,
      subsidy_badge_text: profile.subsidy_badge_text,
      subsidy_description: profile.subsidy_description,
      subsidy_start_date: profile.subsidy_start_date,
      subsidy_end_date: profile.subsidy_end_date,
    };

    const newProfile = await createProfile(input);

    // Copy slabs
    if (newProfile && profile.slabs) {
      for (const slab of profile.slabs) {
        await supabase.from('pricing_profile_slabs').insert([{
          profile_id: newProfile.id,
          min_price: slab.min_price,
          max_price: slab.max_price,
          tax_percentage: slab.tax_percentage,
          sort_order: slab.sort_order,
          is_active: slab.is_active,
        }]);
      }
    }

    return newProfile;
  }, [createProfile]);

  const publishProfile = useCallback(async (id: string): Promise<void> => {
    await updateProfile(id, { status: 'published' });
  }, [updateProfile]);

  const archiveProfile = useCallback(async (id: string): Promise<void> => {
    await updateProfile(id, { status: 'archived' });
  }, [updateProfile]);

  // Slab management
  const addSlab = useCallback(async (profileId: string, input: SlabInput): Promise<PricingProfileSlab | null> => {
    const { data, error: err } = await supabase
      .from('pricing_profile_slabs')
      .insert([{
        profile_id: profileId,
        min_price: input.min_price,
        max_price: input.max_price,
        tax_percentage: input.tax_percentage,
        sort_order: input.sort_order ?? 0,
        is_active: input.is_active ?? true,
      }])
      .select('*')
      .single();

    if (err) throw new Error(err.message);
    await fetchProfiles();
    return data as PricingProfileSlab;
  }, [fetchProfiles]);

  const updateSlab = useCallback(async (slabId: string, input: Partial<SlabInput>): Promise<void> => {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (input.min_price !== undefined) updateData.min_price = input.min_price;
    if (input.max_price !== undefined) updateData.max_price = input.max_price;
    if (input.tax_percentage !== undefined) updateData.tax_percentage = input.tax_percentage;
    if (input.sort_order !== undefined) updateData.sort_order = input.sort_order;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const { error: err } = await supabase.from('pricing_profile_slabs').update(updateData).eq('id', slabId);
    if (err) throw new Error(err.message);
    await fetchProfiles();
  }, [fetchProfiles]);

  const deleteSlab = useCallback(async (slabId: string): Promise<void> => {
    const { error: err } = await supabase.from('pricing_profile_slabs').delete().eq('id', slabId);
    if (err) throw new Error(err.message);
    await fetchProfiles();
  }, [fetchProfiles]);

  // Version management
  const getVersions = useCallback(async (profileId: string): Promise<PricingProfileVersion[]> => {
    const { data, error: err } = await supabase
      .from('pricing_profile_versions')
      .select('*')
      .eq('profile_id', profileId)
      .order('version_number', { ascending: false });

    if (err) throw new Error(err.message);
    return (data || []) as PricingProfileVersion[];
  }, []);

  const restoreVersion = useCallback(async (profileId: string, versionNumber: number): Promise<void> => {
    const { data: version, error: err } = await supabase
      .from('pricing_profile_versions')
      .select('snapshot')
      .eq('profile_id', profileId)
      .eq('version_number', versionNumber)
      .single();

    if (err) throw new Error(err.message);
    if (!version) throw new Error('Version not found');

    const snapshot = version.snapshot as Record<string, any>;
    delete snapshot.id;
    delete snapshot.created_at;
    delete snapshot.updated_at;

    await updateProfile(profileId, snapshot as Partial<ProfileInput>);
  }, [updateProfile]);

  // Copy profile to multiple cities
  const copyToCities = useCallback(async (profileId: string, cityIds: string[]): Promise<void> => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) throw new Error('Profile not found');

    for (const cityId of cityIds) {
      const input: ProfileInput = {
        name: profile.name,
        description: profile.description,
        city_id: cityId,
        vehicle_category: profile.vehicle_category,
        status: 'draft',
        rto_percentage: profile.rto_percentage,
        insurance_percentage: profile.insurance_percentage,
        registration_fee: profile.registration_fee,
        hsrp_fee: profile.hsrp_fee,
        fastag_fee: profile.fastag_fee,
        handling_charges: profile.handling_charges,
        dealer_charges: profile.dealer_charges,
        delivery_charges: profile.delivery_charges,
        accessories_charges: profile.accessories_charges,
        other_charges: profile.other_charges,
        misc_charges: profile.misc_charges,
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
        calculation_order: profile.calculation_order,
        brand_id: profile.brand_id,
        vehicle_id: profile.vehicle_id,
        variant_id: profile.variant_id,
        vehicle_type: profile.vehicle_type,
        battery_min_kwh: profile.battery_min_kwh,
        battery_max_kwh: profile.battery_max_kwh,
        price_range_min: profile.price_range_min,
        price_range_max: profile.price_range_max,
        priority: profile.priority,
        effective_date: profile.effective_date,
        has_subsidy: profile.has_subsidy,
        subsidy_type: profile.subsidy_type,
        subsidy_value: profile.subsidy_value,
        subsidy_title: profile.subsidy_title,
        subsidy_badge_text: profile.subsidy_badge_text,
        subsidy_description: profile.subsidy_description,
        subsidy_start_date: profile.subsidy_start_date,
        subsidy_end_date: profile.subsidy_end_date,
      };

      const newProfile = await createProfile(input);

      if (newProfile && profile.slabs) {
        for (const slab of profile.slabs) {
          await supabase.from('pricing_profile_slabs').insert([{
            profile_id: newProfile.id,
            min_price: slab.min_price,
            max_price: slab.max_price,
            tax_percentage: slab.tax_percentage,
            sort_order: slab.sort_order,
            is_active: slab.is_active,
          }]);
        }
      }
    }

    await fetchProfiles();
  }, [profiles, createProfile, fetchProfiles]);

  return {
    profiles,
    loading,
    error,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    duplicateProfile,
    publishProfile,
    archiveProfile,
    addSlab,
    updateSlab,
    deleteSlab,
    getVersions,
    restoreVersion,
    copyToCities,
  };
}
