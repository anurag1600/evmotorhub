'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Power, ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function NewVariantForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('vehicle') || '';
  const [loading, setLoading] = useState(false);
  const [vehicleName, setVehicleName] = useState('');

  const [form, setForm] = useState({
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
  });

  useEffect(() => {
    if (vehicleId) {
      supabase.from('vehicles').select('name').eq('id', vehicleId).single().then(({ data }) => {
        if (data) setVehicleName(data.name);
      });
    }
  }, [vehicleId]);

  // Auto-generate slug from name
  useEffect(() => {
    if (form.name && !form.slug) {
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setForm(f => ({ ...f, slug }));
    }
  }, [form.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      toast.error('Vehicle ID is required');
      return;
    }

    setLoading(true);
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
        features: form.features ? form.features.split(',').map(f => f.trim()) : [],
      };

      const { error } = await supabase.from('vehicle_variants').insert([payload]);
      if (error) throw error;

      toast.success('Variant created');
      router.push(`/admin/variants?vehicle=${vehicleId}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create variant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={vehicleId ? `/admin/variants?vehicle=${vehicleId}` : '/admin/variants'}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Power size={22} className="text-[#145a2c]" />
            Add New Variant
          </h1>
          {vehicleName && (
            <p className="text-sm text-gray-500">For {vehicleName}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Variant Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g., S1 Pro, Standard, Long Range"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug *</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="auto-generated"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (Rs.) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="139999"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Range (km)</label>
            <input
              type="number"
              value={form.range_km}
              onChange={(e) => setForm(f => ({ ...f, range_km: e.target.value }))}
              placeholder="195"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Battery (kWh)</label>
            <input
              type="number"
              step="0.1"
              value={form.battery_capacity_kwh}
              onChange={(e) => setForm(f => ({ ...f, battery_capacity_kwh: e.target.value }))}
              placeholder="3.97"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Top Speed (km/h)</label>
            <input
              type="number"
              value={form.top_speed_kmh}
              onChange={(e) => setForm(f => ({ ...f, top_speed_kmh: e.target.value }))}
              placeholder="116"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Motor Power (kW)</label>
            <input
              type="number"
              step="0.1"
              value={form.motor_power_kw}
              onChange={(e) => setForm(f => ({ ...f, motor_power_kw: e.target.value }))}
              placeholder="8.5"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Charging Time (hrs)</label>
            <input
              type="number"
              step="0.1"
              value={form.charging_time_hrs}
              onChange={(e) => setForm(f => ({ ...f, charging_time_hrs: e.target.value }))}
              placeholder="5.3"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Color Name</label>
            <input
              type="text"
              value={form.color}
              onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
              placeholder="Midnight Black"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Color Hex</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.color_hex}
                onChange={(e) => setForm(f => ({ ...f, color_hex: e.target.value }))}
                placeholder="#1a1a1a"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
              />
              {form.color_hex && (
                <div
                  className="w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0"
                  style={{ backgroundColor: form.color_hex }}
                />
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
            <input
              type="text"
              value={form.image_url}
              onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Features (comma-separated)</label>
            <input
              type="text"
              value={form.features}
              onChange={(e) => setForm(f => ({ ...f, features: e.target.value }))}
              placeholder="Fast charging, Hill hold, Reverse mode"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort Order</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm(f => ({ ...f, sort_order: e.target.value }))}
              placeholder="0"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="is_available"
              checked={form.is_available}
              onChange={(e) => setForm(f => ({ ...f, is_available: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-[#145a2c] focus:ring-[#145a2c]"
            />
            <label htmlFor="is_available" className="text-sm text-gray-700">Available for purchase</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href={vehicleId ? `/admin/variants?vehicle=${vehicleId}` : '/admin/variants'}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#145a2c] text-white rounded-xl text-sm font-semibold hover:bg-[#0f4020] transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {loading ? 'Saving...' : 'Create Variant'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewVariantPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <NewVariantForm />
    </Suspense>
  );
}
