'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { VehicleVariant } from '@/lib/types';
import { Power, Plus, Pencil, Trash2, X, Save, Loader as Loader2, Image as ImageIcon, GripVertical, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';

interface VariantsInlineEditorProps {
  vehicleId: string;
}

const emptyForm = {
  name: '',
  slug: '',
  price: '',
  range_km: '',
  battery_capacity_kwh: '',
  motor_power_kw: '',
  top_speed_kmh: '',
  charging_time_hrs: '',
  image_url: '',
  color: '',
  color_hex: '',
  sort_order: '0',
  is_available: true,
  features: '',
};

export default function VariantsInlineEditor({ vehicleId }: VariantsInlineEditorProps) {
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
    setVariants((data || []) as VehicleVariant[]);
    setLoading(false);
  }, [vehicleId]);

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
      price: variant.price?.toString() || '',
      range_km: variant.range_km?.toString() || '',
      battery_capacity_kwh: variant.battery_capacity_kwh?.toString() || '',
      motor_power_kw: variant.motor_power_kw?.toString() || '',
      top_speed_kmh: variant.top_speed_kmh?.toString() || '',
      charging_time_hrs: variant.charging_time_hrs?.toString() || '',
      image_url: variant.image_url || '',
      color: variant.color || '',
      color_hex: variant.color_hex || '',
      sort_order: variant.sort_order?.toString() || '0',
      is_available: variant.is_available ?? true,
      features: (variant.features || []).join(', '),
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
      const payload = {
        vehicle_id: vehicleId,
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        price: parseFloat(form.price) || 0,
        range_km: form.range_km ? parseInt(form.range_km) : null,
        battery_capacity_kwh: form.battery_capacity_kwh ? parseFloat(form.battery_capacity_kwh) : null,
        motor_power_kw: form.motor_power_kw ? parseFloat(form.motor_power_kw) : null,
        top_speed_kmh: form.top_speed_kmh ? parseInt(form.top_speed_kmh) : null,
        charging_time_hrs: form.charging_time_hrs ? parseFloat(form.charging_time_hrs) : null,
        image_url: form.image_url || null,
        color: form.color || null,
        color_hex: form.color_hex || null,
        sort_order: parseInt(form.sort_order) || 0,
        is_available: form.is_available,
        features: form.features ? form.features.split(',').map(f => f.trim()).filter(Boolean) : [],
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
      setVariants(variants.filter(v => v.id !== id));
      toast.success('Variant deleted');
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
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
      price: variant.price,
      range_km: variant.range_km,
      battery_capacity_kwh: variant.battery_capacity_kwh,
      motor_power_kw: variant.motor_power_kw,
      top_speed_kmh: variant.top_speed_kmh,
      charging_time_hrs: variant.charging_time_hrs,
      image_url: variant.image_url,
      color: variant.color,
      color_hex: variant.color_hex,
      sort_order: Math.max(...variants.map(v => v.sort_order || 0)) + 1,
      is_available: variant.is_available,
      features: variant.features,
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
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)}L`;
    return `₹${price.toLocaleString('en-IN')}`;
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm(f => ({ ...f, sort_order: e.target.value }))}
                className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="is_available"
                checked={form.is_available}
                onChange={(e) => setForm(f => ({ ...f, is_available: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-[#145a2c] focus:ring-[#145a2c]"
              />
              <label htmlFor="is_available" className="text-xs text-gray-700">Available</label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Features (comma-separated)</label>
            <input
              type="text"
              value={form.features}
              onChange={(e) => setForm(f => ({ ...f, features: e.target.value }))}
              placeholder="Feature 1, Feature 2, Feature 3"
              className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
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
        <div className="space-y-2">
          {variants.map((variant, idx) => (
            <div
              key={variant.id}
              className={cn(
                'bg-white rounded-xl border p-3 flex items-center gap-3 group',
                editingId === variant.id ? 'border-[#145a2c] ring-1 ring-[#145a2c]/20' : 'border-gray-100 hover:border-gray-200'
              )}
            >
              <div className="flex flex-col items-center gap-1 text-gray-400">
                <button
                  type="button"
                  onClick={() => moveVariant(variant.id, 'up')}
                  disabled={idx === 0}
                  className="p-0.5 hover:text-gray-600 disabled:opacity-30"
                >
                  ▲
                </button>
                <GripVertical size={14} />
                <button
                  type="button"
                  onClick={() => moveVariant(variant.id, 'down')}
                  disabled={idx === variants.length - 1}
                  className="p-0.5 hover:text-gray-600 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>

              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {variant.image_url ? (
                  <img src={variant.image_url} alt={variant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={20} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{variant.name}</span>
                  {variant.color && (
                    <>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-gray-200"
                        style={{ backgroundColor: variant.color_hex || '#gray' }}
                        title={variant.color}
                      />
                      <span className="text-xs text-gray-500">{variant.color}</span>
                    </>
                  )}
                  {!variant.is_available && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">Unavailable</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
                  <span className="font-semibold text-gray-900">{formatPrice(variant.price)}</span>
                  {variant.range_km && <span>{variant.range_km} km</span>}
                  {variant.battery_capacity_kwh && <span>{variant.battery_capacity_kwh} kWh</span>}
                  {variant.top_speed_kmh && <span>{variant.top_speed_kmh} km/h</span>}
                </div>
              </div>

              <div className="text-xs text-gray-400 font-mono">#{variant.sort_order}</div>

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
