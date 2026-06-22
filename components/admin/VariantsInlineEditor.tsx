'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { VehicleVariant } from '@/lib/types';
import { Power, Plus, Pencil, Trash2, X, Save, Loader as Loader2, Image as ImageIcon, GripVertical, Copy, Star, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';

interface VariantsInlineEditorProps {
  vehicleId: string;
  onVariantsChange?: (variants: VehicleVariant[]) => void;
}

const emptyForm = {
  name: '',
  slug: '',
  short_name: '',
  price: '',
  range_km: '',
  battery_capacity_kwh: '',
  motor_power_kw: '',
  top_speed_kmh: '',
  charging_time_hrs: '',
  kerb_weight: '',
  image_url: '',
  color: '',
  color_hex: '',
  sort_order: '0',
  is_available: true,
  is_featured: false,
  status: 'active' as 'active' | 'discontinued' | 'upcoming',
  specifications: '{}' as string,
};

const statusOptions = ['active', 'discontinued', 'upcoming'] as const;

export default function VariantsInlineEditor({ vehicleId, onVariantsChange }: VariantsInlineEditorProps) {
  const [variants, setVariants] = useState<VehicleVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchVariants = useCallback(async () => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('vehicle_variants')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('sort_order');
    const variantData = (data || []) as VehicleVariant[];
    setVariants(variantData);
    onVariantsChange?.(variantData);
    setLoading(false);
  }, [vehicleId, onVariantsChange]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const resetForm = () => {
    setForm(emptyForm);
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (variant: VehicleVariant) => {
    setEditingId(variant.id);
    setIsAdding(false);
    setForm({
      name: variant.name || '',
      slug: variant.slug || '',
      short_name: variant.short_name || '',
      price: variant.price?.toString() || '',
      range_km: variant.range_km?.toString() || '',
      battery_capacity_kwh: variant.battery_capacity_kwh?.toString() || '',
      motor_power_kw: variant.motor_power_kw?.toString() || '',
      top_speed_kmh: variant.top_speed_kmh?.toString() || '',
      charging_time_hrs: variant.charging_time_hrs?.toString() || '',
      kerb_weight: variant.kerb_weight?.toString() || '',
      image_url: variant.image_url || '',
      color: variant.color || '',
      color_hex: variant.color_hex || '',
      sort_order: variant.sort_order?.toString() || '0',
      is_available: variant.is_available ?? true,
      is_featured: variant.is_featured ?? false,
      status: variant.status || 'active',
      specifications: JSON.stringify(variant.specifications || {}),
    });
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingId(null);
    const nextOrder = variants.length > 0 ? Math.max(...variants.map(v => v.sort_order || 0)) + 1 : 1;
    setForm({ ...emptyForm, sort_order: nextOrder.toString() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) return;

    setSaving(true);
    try {
      let specifications = {};
      try {
        specifications = JSON.parse(form.specifications || '{}');
      } catch {
        specifications = {};
      }

      const payload = {
        vehicle_id: vehicleId,
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        short_name: form.short_name || null,
        price: parseFloat(form.price) || 0,
        range_km: form.range_km ? parseInt(form.range_km) : null,
        battery_capacity_kwh: form.battery_capacity_kwh ? parseFloat(form.battery_capacity_kwh) : null,
        motor_power_kw: form.motor_power_kw ? parseFloat(form.motor_power_kw) : null,
        top_speed_kmh: form.top_speed_kmh ? parseInt(form.top_speed_kmh) : null,
        charging_time_hrs: form.charging_time_hrs ? parseFloat(form.charging_time_hrs) : null,
        kerb_weight: form.kerb_weight ? parseInt(form.kerb_weight) : null,
        image_url: form.image_url || null,
        color: form.color || null,
        color_hex: form.color_hex || null,
        sort_order: parseInt(form.sort_order) || 0,
        is_available: form.is_available,
        is_featured: form.is_featured,
        status: form.status,
        specifications,
      };

      if (editingId) {
        const { error } = await supabase
          .from('vehicle_variants')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Variant updated');
      } else {
        const { error } = await supabase
          .from('vehicle_variants')
          .insert([payload]);
        if (error) throw error;
        toast.success('Variant created');
      }

      resetForm();
      fetchVariants();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save variant');
    } finally {
      setSaving(false);
    }
  };

  const deleteVariant = async (id: string) => {
    if (!confirm('Delete this variant?')) return;
    setDeleting(id);
    try {
      await supabase.from('vehicle_variants').delete().eq('id', id);
      const newVariants = variants.filter(v => v.id !== id);
      setVariants(newVariants);
      onVariantsChange?.(newVariants);
      toast.success('Variant deleted');
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    if (!isFeatured) {
      // If setting as featured, remove featured from all other variants first
      await supabase
        .from('vehicle_variants')
        .update({ is_featured: false })
        .eq('vehicle_id', vehicleId);

      await supabase
        .from('vehicle_variants')
        .update({ is_featured: true })
        .eq('id', id);
    } else {
      await supabase
        .from('vehicle_variants')
        .update({ is_featured: false })
        .eq('id', id);
    }
    fetchVariants();
  };

  const moveVariant = async (id: string, direction: 'up' | 'down') => {
    const idx = variants.findIndex(v => v.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === variants.length - 1) return;

    const newVariants = [...variants];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newVariants[idx], newVariants[swapIdx]] = [newVariants[swapIdx], newVariants[idx]];

    setVariants(newVariants);

    const updates = newVariants.map((v, i) => ({ id: v.id, sort_order: i }));
    for (const u of updates) {
      await supabase.from('vehicle_variants').update({ sort_order: u.sort_order }).eq('id', u.id);
    }
  };

  const duplicateVariant = async (variant: VehicleVariant) => {
    const newVariant = {
      vehicle_id: vehicleId,
      name: `${variant.name} (Copy)`,
      slug: `${variant.slug || variant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-copy`,
      short_name: variant.short_name,
      price: variant.price,
      range_km: variant.range_km,
      battery_capacity_kwh: variant.battery_capacity_kwh,
      motor_power_kw: variant.motor_power_kw,
      top_speed_kmh: variant.top_speed_kmh,
      charging_time_hrs: variant.charging_time_hrs,
      kerb_weight: variant.kerb_weight,
      image_url: variant.image_url,
      color: variant.color,
      color_hex: variant.color_hex,
      sort_order: Math.max(...variants.map(v => v.sort_order || 0)) + 1,
      is_available: variant.is_available,
      is_featured: false,
      status: variant.status,
      specifications: variant.specifications,
    };

    const { error } = await supabase.from('vehicle_variants').insert([newVariant]);
    if (error) {
      toast.error('Failed to duplicate');
    } else {
      toast.success('Variant duplicated');
      fetchVariants();
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 100000) return `${(price / 100000).toFixed(2)}L`;
    return price.toLocaleString('en-IN');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Power size={18} className="text-[#145a2c]" />
          Variants
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-normal">
            {variants.length}
          </span>
        </h2>
        {!isAdding && !editingId && (
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

      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 text-sm">
              {editingId ? 'Edit Variant' : 'New Variant'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="S1 Pro"
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Short Name</label>
              <input
                type="text"
                value={form.short_name}
                onChange={(e) => setForm(f => ({ ...f, short_name: e.target.value }))}
                placeholder="S1 Pro"
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price (Rs.) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="139999"
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
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
                placeholder="3.97"
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Range (km)</label>
              <input
                type="number"
                value={form.range_km}
                onChange={(e) => setForm(f => ({ ...f, range_km: e.target.value }))}
                placeholder="195"
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Top Speed (km/h)</label>
              <input
                type="number"
                value={form.top_speed_kmh}
                onChange={(e) => setForm(f => ({ ...f, top_speed_kmh: e.target.value }))}
                placeholder="116"
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Motor (kW)</label>
              <input
                type="number"
                step="0.1"
                value={form.motor_power_kw}
                onChange={(e) => setForm(f => ({ ...f, motor_power_kw: e.target.value }))}
                placeholder="8.5"
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Charging (hrs)</label>
              <input
                type="number"
                step="0.1"
                value={form.charging_time_hrs}
                onChange={(e) => setForm(f => ({ ...f, charging_time_hrs: e.target.value }))}
                placeholder="5.3"
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kerb Weight (kg)</label>
              <input
                type="number"
                value={form.kerb_weight}
                onChange={(e) => setForm(f => ({ ...f, kerb_weight: e.target.value }))}
                placeholder="108"
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Color Name</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                placeholder="Midnight Black"
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Color Hex</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={form.color_hex}
                  onChange={(e) => setForm(f => ({ ...f, color_hex: e.target.value }))}
                  placeholder="#1a1a1a"
                  className="flex-1 px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                />
                {form.color_hex && (
                  <div
                    className="w-9 h-9 rounded-lg border border-gray-200 flex-shrink-0"
                    style={{ backgroundColor: form.color_hex }}
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value as any }))}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm(f => ({ ...f, sort_order: e.target.value }))}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              />
            </div>
            <div className="flex items-center gap-4 pt-5">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => setForm(f => ({ ...f, is_available: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-[#145a2c] focus:ring-[#145a2c]"
                />
                <span className="text-xs text-gray-700">Available</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-[#145a2c] focus:ring-[#145a2c]"
                />
                <span className="text-xs text-gray-700">Featured</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Variant Image</label>
            <ImageUpload
              bucket="vehicle-gallery"
              onImageUrl={(url) => setForm(f => ({ ...f, image_url: url }))}
              currentImageUrl={form.image_url}
              label="Variant Image"
              recommendedWidth={600}
              recommendedHeight={400}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Additional Specs (JSON)</label>
            <textarea
              value={form.specifications}
              onChange={(e) => setForm(f => ({ ...f, specifications: e.target.value }))}
              placeholder='{"Ground Clearance": "160mm", "Wheelbase": "1260mm"}'
              rows={2}
              className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
            />
          </div>

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

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Loader2 size={20} className="animate-spin mr-2" />
          Loading variants...
        </div>
      ) : variants.length === 0 && !isAdding ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Power size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="mb-3">No variants added yet.</p>
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#145a2c] text-white rounded-lg text-sm font-semibold hover:bg-[#0f4020] transition-colors"
          >
            <Plus size={14} />
            Add First Variant
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-600 border-b border-gray-100">
            <div className="col-span-3">Variant</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-1 text-center">Battery</div>
            <div className="col-span-1 text-center">Range</div>
            <div className="col-span-1 text-center">Speed</div>
            <div className="col-span-1 text-center">Featured</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          {/* Table Body */}
          {variants.map((variant, idx) => (
            <div
              key={variant.id}
              className={cn(
                'grid grid-cols-12 gap-2 px-4 py-3 items-center group transition-colors',
                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                editingId === variant.id && 'bg-green-50'
              )}
            >
              {/* Variant Name */}
              <div className="col-span-3 flex items-center gap-2">
                <div className="flex flex-col items-center gap-0.5 text-gray-300">
                  <button
                    type="button"
                    onClick={() => moveVariant(variant.id, 'up')}
                    disabled={idx === 0}
                    className="p-0 hover:text-gray-500 disabled:opacity-30 text-xs"
                  >
                    ▲
                  </button>
                  <GripVertical size={12} />
                  <button
                    type="button"
                    onClick={() => moveVariant(variant.id, 'down')}
                    disabled={idx === variants.length - 1}
                    className="p-0 hover:text-gray-500 disabled:opacity-30 text-xs"
                  >
                    ▼
                  </button>
                </div>
                {variant.image_url ? (
                  <img src={variant.image_url} alt={variant.name} className="w-8 h-8 rounded object-cover bg-gray-100" />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                    <ImageIcon size={14} className="text-gray-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{variant.name}</div>
                  {variant.short_name && (
                    <div className="text-xs text-gray-500">{variant.short_name}</div>
                  )}
                </div>
                {variant.color && (
                  <span
                    className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                    style={{ backgroundColor: variant.color_hex || '#9ca3af' }}
                    title={variant.color}
                  />
                )}
              </div>

              {/* Price */}
              <div className="col-span-2 text-right">
                <div className="font-bold text-gray-900 text-sm">₹{formatPrice(variant.price)}</div>
              </div>

              {/* Battery */}
              <div className="col-span-1 text-center text-sm text-gray-600">
                {variant.battery_capacity_kwh ? `${variant.battery_capacity_kwh}` : '—'}
              </div>

              {/* Range */}
              <div className="col-span-1 text-center text-sm text-gray-600">
                {variant.range_km ? `${variant.range_km}` : '—'}
              </div>

              {/* Top Speed */}
              <div className="col-span-1 text-center text-sm text-gray-600">
                {variant.top_speed_kmh ? `${variant.top_speed_kmh}` : '—'}
              </div>

              {/* Featured */}
              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => toggleFeatured(variant.id, variant.is_featured)}
                  className={cn(
                    'p-1 rounded transition-colors',
                    variant.is_featured
                      ? 'text-yellow-500 hover:text-yellow-600'
                      : 'text-gray-300 hover:text-gray-400'
                  )}
                  title={variant.is_featured ? 'Featured (click to remove)' : 'Set as featured'}
                >
                  <Star size={16} fill={variant.is_featured ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Status */}
              <div className="col-span-1 flex justify-center">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  variant.status === 'active' && 'bg-green-50 text-green-700',
                  variant.status === 'discontinued' && 'bg-gray-100 text-gray-600',
                  variant.status === 'upcoming' && 'bg-blue-50 text-blue-700'
                )}>
                  {variant.status}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => startEdit(variant)}
                  className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateVariant(variant)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteVariant(variant.id)}
                  disabled={deleting === variant.id}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
      )}
    </div>
  );
}
