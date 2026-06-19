'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { VehicleVariant } from '@/lib/types';
import { Power, Plus, CreditCard as Edit2, Trash2, Search, ChevronDown, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Pagination from '@/components/admin/Pagination';
import { toast } from 'sonner';

export default function VariantsManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get('vehicle');

  const [variants, setVariants] = useState<VehicleVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleName, setVehicleName] = useState<string>('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (vehicleId) {
        const [vehicleRes, variantsRes] = await Promise.all([
          supabase.from('vehicles').select('name').eq('id', vehicleId).single(),
          supabase.from('vehicle_variants').select('*').eq('vehicle_id', vehicleId).order('sort_order'),
        ]);
        if (vehicleRes.data) setVehicleName(vehicleRes.data.name);
        if (variantsRes.data) setVariants(variantsRes.data as VehicleVariant[]);
      } else {
        const { data } = await supabase
          .from('vehicle_variants')
          .select('*, vehicles(name)')
          .order('sort_order');
        setVariants((data || []) as any[]);
      }
      setLoading(false);
    };
    fetchData();
  }, [vehicleId]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin/vehicles" className="hover:text-[#145a2c]">Vehicles</Link>
            {vehicleName && (
              <>
                <span>/</span>
                <span className="text-gray-700">{vehicleName}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Power size={24} className="text-[#145a2c]" />
            {vehicleName ? `${vehicleName} Variants` : 'All Vehicle Variants'}
          </h1>
        </div>
        <div className="flex gap-2">
          {vehicleId && (
            <Link
              href={`/admin/variants/new?vehicle=${vehicleId}`}
              className="flex items-center gap-2 bg-[#145a2c] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#0f4020] transition-colors"
            >
              <Plus size={16} />
              Add Variant
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : variants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Power size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 mb-4">No variants found</p>
          {vehicleId && (
            <Link
              href={`/admin/variants/new?vehicle=${vehicleId}`}
              className="inline-flex items-center gap-2 text-[#145a2c] font-semibold text-sm hover:underline"
            >
              <Plus size={14} /> Add your first variant
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {variant.image_url ? (
                  <img src={variant.image_url} alt={variant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={20} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{variant.name}</span>
                  {variant.color && (
                    <span
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: variant.color_hex || '#gray' }}
                      title={variant.color}
                    />
                  )}
                  {!variant.is_available && (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Unavailable</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>Rs. {(variant.price / 100000).toFixed(2)}L</span>
                  {variant.range_km && <span>{variant.range_km} km range</span>}
                  {variant.battery_capacity_kwh && <span>{variant.battery_capacity_kwh} kWh</span>}
                  {variant.top_speed_kmh && <span>{variant.top_speed_kmh} km/h</span>}
                </div>
                {(variant as any).vehicles?.name && (
                  <div className="text-xs text-gray-400 mt-1">{(variant as any).vehicles.name}</div>
                )}
              </div>

              {/* Sort Order */}
              <div className="text-sm text-gray-400">#{variant.sort_order}</div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/admin/variants/${variant.id}/edit?vehicle=${variant.vehicle_id}`}
                  className="p-2 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Edit2 size={14} />
                </Link>
                <button
                  onClick={() => deleteVariant(variant.id)}
                  disabled={deleting === variant.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
