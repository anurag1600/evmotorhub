'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { VehicleVariant } from '@/lib/types';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function uniqueSlug(base: string, existing: string[] = []): string {
  let slug = slugify(base) || 'variant';
  let suffix = 1;
  while (existing.includes(slug)) {
    slug = `${slugify(base)}-${suffix}`;
    suffix++;
  }
  return slug;
}

export interface VariantInput {
  name: string;
  short_name?: string | null;
  short_description?: string | null;
  price: number;
  range_km?: number | null;
  battery_capacity_kwh?: number | null;
  top_speed_kmh?: number | null;
  motor_power_kw?: number | null;
  charging_time_hrs?: number | null;
  kerb_weight?: number | null;
  image_url?: string | null;
  gallery_urls?: string[];
  brochure_url?: string | null;
  colors?: string[] | null;
  color_hexes?: string[] | null;
  features?: string[];
  specifications?: Record<string, string>;
  status?: string;
  is_available?: boolean;
  is_featured?: boolean;
  sort_order?: number;
}

export function useVariants(vehicleId: string | null | undefined) {
  const [variants, setVariants] = useState<VehicleVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const fetchVariants = useCallback(async () => {
    if (!vehicleId) { setVariants([]); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('vehicle_variants')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('sort_order', { ascending: true });
      if (err) throw err;
      if (mountedRef.current) setVariants((data || []) as VehicleVariant[]);
    } catch (e: any) {
      if (mountedRef.current) { setError(e.message); }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => { fetchVariants(); }, [fetchVariants]);

  const createVariant = useCallback(async (input: VariantInput): Promise<VehicleVariant | null> => {
    if (!vehicleId) throw new Error('Vehicle ID is required');
    const existingSlugs = variants.map(v => v.slug).filter(Boolean) as string[];
    const slug = uniqueSlug(input.name, existingSlugs);
    const sortOrder = input.sort_order ?? variants.length;

    const payload = {
      vehicle_id: vehicleId,
      name: input.name.trim(),
      slug,
      short_name: input.short_name || null,
      short_description: input.short_description || null,
      price: input.price,
      range_km: input.range_km ?? null,
      battery_capacity_kwh: input.battery_capacity_kwh ?? null,
      top_speed_kmh: input.top_speed_kmh ?? null,
      motor_power_kw: input.motor_power_kw ?? null,
      charging_time_hrs: input.charging_time_hrs ?? null,
      kerb_weight: input.kerb_weight ?? null,
      image_url: input.image_url || null,
      gallery_urls: input.gallery_urls || [],
      brochure_url: input.brochure_url || null,
      color: input.colors?.[0] || null,
      color_hex: input.color_hexes?.[0] || null,
      colors: input.colors || null,
      color_hexes: input.color_hexes || null,
      features: input.features || [],
      specifications: input.specifications || {},
      status: input.status || 'active',
      is_available: input.is_available ?? true,
      is_featured: input.is_featured ?? false,
      sort_order: sortOrder,
    };

    const { data, error: err } = await supabase
      .from('vehicle_variants')
      .insert([payload])
      .select('*')
      .single();

    if (err) throw new Error(err.message);
    const newVariant = data as VehicleVariant;

    if (input.is_featured) {
      await supabase.from('vehicle_variants').update({ is_featured: false }).eq('vehicle_id', vehicleId).neq('id', newVariant.id);
      await supabase.from('vehicles').update({ default_variant_id: newVariant.id }).eq('id', vehicleId);
    }

    await fetchVariants();
    return newVariant;
  }, [vehicleId, variants, fetchVariants]);

  const updateVariant = useCallback(async (id: string, input: Partial<VariantInput>): Promise<VehicleVariant | null> => {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.short_name !== undefined) updateData.short_name = input.short_name || null;
    if (input.short_description !== undefined) updateData.short_description = input.short_description || null;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.range_km !== undefined) updateData.range_km = input.range_km;
    if (input.battery_capacity_kwh !== undefined) updateData.battery_capacity_kwh = input.battery_capacity_kwh;
    if (input.top_speed_kmh !== undefined) updateData.top_speed_kmh = input.top_speed_kmh;
    if (input.motor_power_kw !== undefined) updateData.motor_power_kw = input.motor_power_kw;
    if (input.charging_time_hrs !== undefined) updateData.charging_time_hrs = input.charging_time_hrs;
    if (input.kerb_weight !== undefined) updateData.kerb_weight = input.kerb_weight;
    if (input.image_url !== undefined) updateData.image_url = input.image_url || null;
    if (input.gallery_urls !== undefined) updateData.gallery_urls = input.gallery_urls || [];
    if (input.brochure_url !== undefined) updateData.brochure_url = input.brochure_url || null;
    if (input.colors !== undefined) { updateData.colors = input.colors || null; updateData.color = input.colors?.[0] || null; }
    if (input.color_hexes !== undefined) { updateData.color_hexes = input.color_hexes || null; updateData.color_hex = input.color_hexes?.[0] || null; }
    if (input.features !== undefined) updateData.features = input.features || [];
    if (input.specifications !== undefined) updateData.specifications = input.specifications || {};
    if (input.status !== undefined) updateData.status = input.status;
    if (input.is_available !== undefined) updateData.is_available = input.is_available;
    if (input.is_featured !== undefined) updateData.is_featured = input.is_featured;

    const { data, error: err } = await supabase
      .from('vehicle_variants')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (err) throw new Error(err.message);
    const updated = data as VehicleVariant;

    if (input.is_featured && vehicleId) {
      await supabase.from('vehicle_variants').update({ is_featured: false }).eq('vehicle_id', vehicleId).neq('id', id);
      await supabase.from('vehicles').update({ default_variant_id: id }).eq('id', vehicleId);
    }

    await fetchVariants();
    return updated;
  }, [vehicleId, fetchVariants]);

  const deleteVariant = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('vehicle_variants').delete().eq('id', id);
    if (err) throw new Error(err.message);
    if (vehicleId) {
      await supabase.from('vehicles').update({ default_variant_id: null }).eq('id', vehicleId).eq('default_variant_id', id);
    }
    await fetchVariants();
  }, [vehicleId, fetchVariants]);

  const duplicateVariant = useCallback(async (variant: VehicleVariant): Promise<VehicleVariant | null> => {
    if (!vehicleId) throw new Error('Vehicle ID is required');
    const existingSlugs = variants.map(v => v.slug).filter(Boolean) as string[];
    const baseSlug = variant.slug || slugify(variant.name);
    let dupSlug = `${baseSlug}-copy`;
    let suffix = 1;
    while (existingSlugs.includes(dupSlug)) { dupSlug = `${baseSlug}-copy-${suffix}`; suffix++; }

    const payload = {
      vehicle_id: vehicleId,
      name: `${variant.name} (Copy)`,
      slug: dupSlug,
      short_name: variant.short_name,
      short_description: variant.short_description,
      price: variant.price,
      range_km: variant.range_km,
      battery_capacity_kwh: variant.battery_capacity_kwh,
      top_speed_kmh: variant.top_speed_kmh,
      motor_power_kw: variant.motor_power_kw,
      charging_time_hrs: variant.charging_time_hrs,
      kerb_weight: variant.kerb_weight,
      image_url: variant.image_url,
      gallery_urls: variant.gallery_urls || [],
      brochure_url: variant.brochure_url,
      color: variant.color, color_hex: variant.color_hex,
      colors: variant.colors, color_hexes: variant.color_hexes,
      features: variant.features || [],
      specifications: variant.specifications || {},
      status: variant.status, is_available: variant.is_available,
      is_featured: false, sort_order: variants.length,
    };

    const { data, error: err } = await supabase
      .from('vehicle_variants')
      .insert([payload])
      .select('*')
      .single();

    if (err) throw new Error(err.message);
    await fetchVariants();
    return data as VehicleVariant;
  }, [vehicleId, variants, fetchVariants]);

  const setDefaultVariant = useCallback(async (id: string): Promise<void> => {
    if (!vehicleId) return;
    await supabase.from('vehicle_variants').update({ is_featured: false }).eq('vehicle_id', vehicleId).neq('id', id);
    await supabase.from('vehicle_variants').update({ is_featured: true }).eq('id', id);
    await supabase.from('vehicles').update({ default_variant_id: id }).eq('id', vehicleId);
    await fetchVariants();
  }, [vehicleId, fetchVariants]);

  const reorderVariants = useCallback(async (orderedIds: string[]): Promise<void> => {
    const updates = orderedIds.map((id, index) =>
      supabase.from('vehicle_variants').update({ sort_order: index }).eq('id', id)
    );
    await Promise.all(updates);
    await fetchVariants();
  }, [fetchVariants]);

  return {
    variants,
    loading,
    error,
    fetchVariants,
    createVariant,
    updateVariant,
    deleteVariant,
    duplicateVariant,
    setDefaultVariant,
    reorderVariants,
  };
}
