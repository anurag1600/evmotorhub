'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { VehicleVariant } from '@/lib/types';
import { Power, Plus, Pencil, Trash2, X, Save, Loader as Loader2, Image as ImageIcon, Copy, Star, CircleAlert as AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';

interface VariantsInlineEditorProps {
  vehicleId?: string;
  onVariantsChange?: (variants: VehicleVariant[]) => void;
  isDraft?: boolean;
}

interface VariantForm {
  name: string;
  price: string;
  range_km: string;
  battery_capacity_kwh: string;
  top_speed_kmh: string;
  motor_power_kw: string;
  charging_time_hrs: string;
  kerb_weight: string;
  image_url: string;
  colors: string[];
  color_hexes: string[];
  status: 'active' | 'discontinued' | 'upcoming';
  is_available: boolean;
  is_featured: boolean;
}

const emptyForm: VariantForm = {
  name: '',
  price: '',
  range_km: '',
  battery_capacity_kwh: '',
  top_speed_kmh: '',
  motor_power_kw: '',
  charging_time_hrs: '',
  kerb_weight: '',
  image_url: '',
  colors: [],
  color_hexes: [],
  status: 'active',
  is_available: true,
  is_featured: false,
};

export default function VariantsInlineEditor({ vehicleId, onVariantsChange, isDraft = false }: VariantsInlineEditorProps) {
  const [variants, setVariants] = useState<VehicleVariant[]>([]);
  const [loading, setLoading] = useState(!isDraft);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<VariantForm>(emptyForm);
  const [colorInput, setColorInput] = useState('');

  const onVariantsChangeRef = useRef(onVariantsChange);
  useEffect(() => { onVariantsChangeRef.current = onVariantsChange; }, [onVariantsChange]);

  // Notify parent when variants change in draft mode
  useEffect(() => {
    if (isDraft) onVariantsChangeRef.current?.(variants);
  }, [variants, isDraft]);

  // Fetch variants from database
  const fetchVariants = useCallback(async () => {
    if (!vehicleId || isDraft) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('vehicle_variants')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      const variantData = (data || []) as VehicleVariant[];
      setVariants(variantData);
      onVariantsChangeRef.current?.(variantData);
    } catch (err: any) {
      console.error('Fetch variants error:', err);
      setError(err.message);
      toast.error('Failed to load variants');
    } finally {
      setLoading(false);
    }
  }, [vehicleId, isDraft]);

  useEffect(() => { fetchVariants(); }, [fetchVariants]);

  const resetForm = () => {
    setForm(emptyForm);
    setColorInput('');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (variant: VehicleVariant) => {
    setEditingId(variant.id);
    setForm({
      name: variant.name || '',
      price: variant.price?.toString() || '',
      range_km: variant.range_km?.toString() || '',
      battery_capacity_kwh: variant.battery_capacity_kwh?.toString() || '',
      top_speed_kmh: variant.top_speed_kmh?.toString() || '',
      motor_power_kw: variant.motor_power_kw?.toString() || '',
      charging_time_hrs: variant.charging_time_hrs?.toString() || '',
      kerb_weight: variant.kerb_weight?.toString() || '',
      image_url: variant.image_url || '',
      colors: variant.colors || [],
      color_hexes: variant.color_hexes || [],
      status: (variant.status as any) || 'active',
      is_available: variant.is_available ?? true,
      is_featured: variant.is_featured ?? false,
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const addColor = () => {
    const color = colorInput.trim();
    if (color && !form.colors.includes(color)) {
      setForm(f => ({
        ...f,
        colors: [...f.colors, color],
        color_hexes: [...f.color_hexes, '#808080'],
      }));
      setColorInput('');
    }
  };

  const removeColor = (idx: number) => {
    setForm(f => ({
      ...f,
      colors: f.colors.filter((_, i) => i !== idx),
      color_hexes: f.color_hexes.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Variant name is required');
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }
    if (!vehicleId && !isDraft) {
      toast.error('Save the vehicle first before adding variants');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        vehicle_id: vehicleId || undefined,
        name: form.name.trim(),
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        price: parseFloat(form.price) || 0,
        range_km: form.range_km ? parseInt(form.range_km) : null,
        battery_capacity_kwh: form.battery_capacity_kwh ? parseFloat(form.battery_capacity_kwh) : null,
        top_speed_kmh: form.top_speed_kmh ? parseInt(form.top_speed_kmh) : null,
        motor_power_kw: form.motor_power_kw ? parseFloat(form.motor_power_kw) : null,
        charging_time_hrs: form.charging_time_hrs ? parseFloat(form.charging_time_hrs) : null,
        kerb_weight: form.kerb_weight ? parseInt(form.kerb_weight) : null,
        image_url: form.image_url || null,
        color: form.colors[0] || null,
        color_hex: form.color_hexes[0] || null,
        colors: form.colors.length > 0 ? form.colors : null,
        color_hexes: form.color_hexes.length > 0 ? form.color_hexes : null,
        status: form.status,
        is_available: form.is_available,
        is_featured: form.is_featured,
        sort_order: variants.length,
        specifications: {},
      };

      // Draft mode - store in memory only
      if (isDraft) {
        if (editingId) {
          setVariants(prev => prev.map(v =>
            v.id === editingId
              ? { ...v, ...payload, id: editingId } as VehicleVariant
              : v
          ));
          toast.success('Variant updated');
        } else {
          const newVariant = {
            ...payload,
            id: `draft-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as VehicleVariant;
          setVariants(prev => [...prev, newVariant]);
          toast.success('Variant added');
        }
        resetForm();
        return;
      }

      // Database operations for existing vehicles
      if (editingId) {
        // Update existing variant
        const { error: updateError } = await supabase
          .from('vehicle_variants')
          .update({
            name: payload.name,
            slug: payload.slug,
            price: payload.price,
            range_km: payload.range_km,
            battery_capacity_kwh: payload.battery_capacity_kwh,
            top_speed_kmh: payload.top_speed_kmh,
            motor_power_kw: payload.motor_power_kw,
            charging_time_hrs: payload.charging_time_hrs,
            kerb_weight: payload.kerb_weight,
            image_url: payload.image_url,
            color: payload.color,
            color_hex: payload.color_hex,
            colors: payload.colors,
            color_hexes: payload.color_hexes,
            status: payload.status,
            is_available: payload.is_available,
            is_featured: payload.is_featured,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
        toast.success('Variant updated');
      } else {
        // Insert new variant
        const { error: insertError } = await supabase
          .from('vehicle_variants')
          .insert([{
            vehicle_id: vehicleId,
            name: payload.name,
            slug: payload.slug,
            price: payload.price,
            range_km: payload.range_km,
            battery_capacity_kwh: payload.battery_capacity_kwh,
            top_speed_kmh: payload.top_speed_kmh,
            motor_power_kw: payload.motor_power_kw,
            charging_time_hrs: payload.charging_time_hrs,
            kerb_weight: payload.kerb_weight,
            image_url: payload.image_url,
            color: payload.color,
            color_hex: payload.color_hex,
            colors: payload.colors,
            color_hexes: payload.color_hexes,
            status: payload.status,
            is_available: payload.is_available,
            is_featured: payload.is_featured,
            sort_order: payload.sort_order,
            specifications: {},
          }]);

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
        toast.success('Variant created');
      }

      resetForm();
      fetchVariants();
    } catch (err: any) {
      console.error('Variant save error:', err);
      toast.error(err.message || 'Failed to save variant');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this variant?')) return;

    setDeleting(id);

    try {
      if (isDraft) {
        setVariants(prev => prev.filter(v => v.id !== id));
        toast.success('Variant removed');
      } else {
        const { error: deleteError } = await supabase
          .from('vehicle_variants')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        setVariants(prev => prev.filter(v => v.id !== id));
        toast.success('Variant deleted');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('Failed to delete variant');
    } finally {
      setDeleting(null);
    }
  };

  const handleDuplicate = async (variant: VehicleVariant) => {
    const duplicateData = {
      vehicle_id: isDraft ? undefined : vehicleId,
      name: `${variant.name} (Copy)`,
      slug: `${variant.slug || variant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-copy`,
      price: variant.price,
      range_km: variant.range_km,
      battery_capacity_kwh: variant.battery_capacity_kwh,
      top_speed_kmh: variant.top_speed_kmh,
      motor_power_kw: variant.motor_power_kw,
      charging_time_hrs: variant.charging_time_hrs,
      kerb_weight: variant.kerb_weight,
      image_url: variant.image_url,
      color: variant.color,
      color_hex: variant.color_hex,
      colors: variant.colors,
      color_hexes: variant.color_hexes,
      status: variant.status,
      is_available: variant.is_available,
      is_featured: false,
      sort_order: variants.length,
      specifications: variant.specifications || {},
    };

    if (isDraft) {
      const newVariant = {
        ...duplicateData,
        id: `draft-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as VehicleVariant;
      setVariants(prev => [...prev, newVariant]);
      toast.success('Variant duplicated');
    } else {
      try {
        const { error } = await supabase.from('vehicle_variants').insert([{
          ...duplicateData,
          vehicle_id: vehicleId,
        }]);
        if (error) throw error;
        toast.success('Variant duplicated');
        fetchVariants();
      } catch (err: any) {
        toast.error('Failed to duplicate');
      }
    }
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      if (isDraft) {
        setVariants(prev => prev.map(v => ({
          ...v,
          is_featured: v.id === id ? !currentFeatured : false
        })));
        return;
      }

      // Remove featured from all variants first
      await supabase
        .from('vehicle_variants')
        .update({ is_featured: false })
        .eq('vehicle_id', vehicleId);

      if (!currentFeatured) {
        await supabase
          .from('vehicle_variants')
          .update({ is_featured: true })
          .eq('id', id);
      }

      fetchVariants();
      toast.success('Featured status updated');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const moveVariant = async (id: string, direction: 'up' | 'down') => {
    const idx = variants.findIndex(v => v.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === variants.length - 1) return;

    const newVariants = [...variants];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newVariants[idx], newVariants[swapIdx]] = [newVariants[swapIdx], newVariants[idx]];

    const reordered = newVariants.map((v, i) => ({ ...v, sort_order: i }));
    setVariants(reordered);

    if (!isDraft) {
      try {
        for (const v of reordered) {
          await supabase
            .from('vehicle_variants')
            .update({ sort_order: v.sort_order })
            .eq('id', v.id);
        }
      } catch {
        fetchVariants();
      }
    }
  };

  const formatPriceLocal = (price: number) => {
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)}L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Power size={18} className="text-[#145a2c]" />
          Variants
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-normal">
            {variants.length}
          </span>
        </h2>
        {!showForm && (
          <button
            type="button"
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#145a2c] text-white rounded-lg text-xs font-semibold hover:bg-[#0f4020] transition-colors"
          >
            <Plus size={14} />
            Add Variant
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">
              {editingId ? 'Edit Variant' : 'Add New Variant'}
            </h3>
            <button type="button" onClick={resetForm} className="p-1 hover:bg-gray-200 rounded-lg">
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                placeholder="e.g., S1 Pro"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price (Rs.) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                placeholder="e.g., 139999"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Battery (kWh)</label>
              <input
                type="number"
                step="0.1"
                value={form.battery_capacity_kwh}
                onChange={(e) => setForm(f => ({ ...f, battery_capacity_kwh: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                placeholder="e.g., 3.97"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Range (km)</label>
              <input
                type="number"
                value={form.range_km}
                onChange={(e) => setForm(f => ({ ...f, range_km: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                placeholder="e.g., 195"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Top Speed (km/h)</label>
              <input
                type="number"
                value={form.top_speed_kmh}
                onChange={(e) => setForm(f => ({ ...f, top_speed_kmh: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                placeholder="e.g., 116"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Motor (kW)</label>
              <input
                type="number"
                step="0.1"
                value={form.motor_power_kw}
                onChange={(e) => setForm(f => ({ ...f, motor_power_kw: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                placeholder="e.g., 8.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Charging (hrs)</label>
              <input
                type="number"
                step="0.1"
                value={form.charging_time_hrs}
                onChange={(e) => setForm(f => ({ ...f, charging_time_hrs: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                placeholder="e.g., 5.3"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              >
                <option value="active">Active</option>
                <option value="discontinued">Discontinued</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
          </div>

          {/* Colors - Tag Input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Colors</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.colors.map((color, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs">
                  <input
                    type="color"
                    value={form.color_hexes[idx] || '#808080'}
                    onChange={(e) => setForm(f => ({
                      ...f,
                      color_hexes: f.color_hexes.map((h, i) => i === idx ? e.target.value : h)
                    }))}
                    className="w-4 h-4 rounded cursor-pointer border-0 p-0"
                  />
                  {color}
                  <button type="button" onClick={() => removeColor(idx)} className="text-gray-400 hover:text-red-600">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
                placeholder="Enter color name and press Enter"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              />
              <button type="button" onClick={addColor} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700">
                Add
              </button>
            </div>
          </div>

          {/* Image - Compact */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Variant Image</label>
            <ImageUpload
              bucket="vehicle-gallery"
              onImageUrl={(url) => setForm(f => ({ ...f, image_url: url }))}
              currentImageUrl={form.image_url}
              label=""
            />
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) => setForm(f => ({ ...f, is_available: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-[#145a2c] focus:ring-[#145a2c]"
              />
              <span className="text-xs text-gray-700">Available</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-[#145a2c] focus:ring-[#145a2c]"
              />
              <span className="text-xs text-gray-700">Featured</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#145a2c] text-white rounded-lg text-sm font-semibold hover:bg-[#0f4020] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gray-400 mr-2" />
          <span className="text-gray-500">Loading variants...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600 bg-red-50 rounded-xl border border-red-200">
          <AlertCircle size={24} className="mx-auto mb-2 text-red-400" />
          <p>{error}</p>
          <button onClick={fetchVariants} className="mt-3 text-sm underline">Retry</button>
        </div>
      ) : variants.length === 0 && !showForm ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Power size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="mb-3">No variants added yet</p>
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#145a2c] text-white rounded-lg text-sm font-semibold hover:bg-[#0f4020]"
          >
            <Plus size={14} /> Add First Variant
          </button>
        </div>
      ) : variants.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {variants.map((variant, idx) => (
            <div
              key={variant.id}
              className={cn(
                'flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors group',
                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              )}
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveVariant(variant.id, 'up')}
                  disabled={idx === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => moveVariant(variant.id, 'down')}
                  disabled={idx === variants.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDown size={12} />
                </button>
              </div>

              {/* Image */}
              {variant.image_url ? (
                <img src={variant.image_url} alt={variant.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <ImageIcon size={16} className="text-gray-300" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm truncate">{variant.name}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatPriceLocal(variant.price)}</span>
                  {variant.battery_capacity_kwh && <span>• {variant.battery_capacity_kwh}kWh</span>}
                  {variant.range_km && <span>• {variant.range_km}km</span>}
                </div>
              </div>

              {/* Colors */}
              {variant.colors && variant.colors.length > 0 && (
                <div className="flex -space-x-1">
                  {variant.colors.slice(0, 3).map((_, i) => (
                    <span
                      key={i}
                      className="w-5 h-5 rounded-full border-2 border-white"
                      style={{ backgroundColor: variant.color_hexes?.[i] || '#9ca3af' }}
                    />
                  ))}
                </div>
              )}

              {/* Status Badge */}
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                variant.status === 'active' && 'bg-green-100 text-green-700',
                variant.status === 'discontinued' && 'bg-gray-100 text-gray-600',
                variant.status === 'upcoming' && 'bg-blue-100 text-blue-700'
              )}>
                {variant.status}
              </span>

              {/* Featured Toggle */}
              <button
                type="button"
                onClick={() => toggleFeatured(variant.id, variant.is_featured)}
                className={cn(
                  'p-1 rounded transition-colors',
                  variant.is_featured ? 'text-yellow-500' : 'text-gray-300 hover:text-gray-400'
                )}
              >
                <Star size={16} fill={variant.is_featured ? 'currentColor' : 'none'} />
              </button>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => startEdit(variant)}
                  className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicate(variant)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(variant.id)}
                  disabled={deleting === variant.id}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  title="Delete"
                >
                  {deleting === variant.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
