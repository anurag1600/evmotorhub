'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/types';
import { Car, Plus, Pencil, Trash2, Search, Loader as Loader2, CircleAlert as AlertCircle, Eye } from 'lucide-react';
import { formatPrice, getVehicleTypeLabel, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import Pagination from '@/components/admin/Pagination';
import ImportExport from '@/components/admin/ImportExport';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-gray-100 text-gray-700',
};

const EXPORT_COLS = [
  'id', 'name', 'slug', 'type', 'segment', 'manufacturer_id',
  'ex_showroom_price', 'price_min', 'price_max', 'range_km', 'top_speed_kmh', 'battery_capacity_kwh', 'motor_power_kw', 'charging_time_hrs',
  'image_url', 'image_gallery', 'gallery_urls', 'video_url', 'description',
  'is_upcoming', 'is_featured', 'is_latest', 'status', 'launch_date',
  'colors', 'features', 'pros', 'cons', 'specifications',
  'related_news_ids', 'similar_vehicle_ids',
  'seo_title', 'seo_description', 'seo_keywords'
];
const IMPORT_COLS = [
  'name', 'slug', 'type', 'segment', 'manufacturer_id',
  'ex_showroom_price', 'price_min', 'price_max', 'range_km', 'top_speed_kmh', 'battery_capacity_kwh', 'motor_power_kw', 'charging_time_hrs',
  'image_url', 'image_gallery', 'gallery_urls', 'video_url', 'description',
  'is_upcoming', 'is_featured', 'is_latest', 'status', 'launch_date',
  'colors', 'features', 'pros', 'cons', 'specifications',
  'related_news_ids', 'similar_vehicle_ids',
  'seo_title', 'seo_description', 'seo_keywords'
];

export default function VehiclesManagementPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      let countQuery = supabase.from('vehicles').select('id', { count: 'exact', head: true });
      let dataQuery = supabase.from('vehicles').select('*').order('updated_at', { ascending: false });

      if (type) { countQuery = countQuery.eq('type', type); dataQuery = dataQuery.eq('type', type); }
      if (status) { countQuery = countQuery.eq('status', status); dataQuery = dataQuery.eq('status', status); }
      if (search) { countQuery = countQuery.ilike('name', `%${search}%`); dataQuery = dataQuery.ilike('name', `%${search}%`); }

      const from = (page - 1) * pageSize;
      dataQuery = dataQuery.range(from, from + pageSize - 1);

      const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);
      if (!error && data) { setVehicles(data as Vehicle[]); setTotal(count ?? 0); }
    } catch (err) { console.error('Failed to fetch vehicles:', err); }
    finally { setLoading(false); }
  }, [search, type, status, page, pageSize]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);
  useEffect(() => { setPage(1); }, [search, type, status]);

  const deleteVehicle = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    setDeleting(id);
    try {
      await supabase.from('vehicles').delete().eq('id', id);
      setVehicles(vehicles.filter(v => v.id !== id));
      setTotal(t => t - 1);
      toast.success('Item deleted successfully');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete');
    }
    finally { setDeleting(null); }
  };

  const handleImport = async (rows: Record<string, string>[]) => {
    const errors: string[] = [];
    let success = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.name) { errors.push(`Row ${i + 1}: name is required`); continue; }
      if (!['scooter', 'bike', 'car'].includes(row.type)) { errors.push(`Row ${i + 1}: type must be scooter, bike, or car`); continue; }
      const slug = row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Parse array fields (semicolon-separated)
      const parseArray = (val: string | undefined) =>
        val ? val.split(';').map(s => s.trim()).filter(Boolean) : [];

      // Parse JSON fields
      const parseJson = (val: string | undefined): Record<string, string> => {
        if (!val) return {};
        try {
          return JSON.parse(val);
        } catch {
          // Try key:value format
          const obj: Record<string, string> = {};
          val.split(';').forEach(pair => {
            const [k, v] = pair.split(':').map(s => s.trim());
            if (k && v) obj[k] = v;
          });
          return obj;
        }
      };

      try {
        const { error } = await supabase.from('vehicles').insert([{
          name: row.name,
          slug,
          type: row.type,
          segment: row.segment || 'budget',
          manufacturer_id: row.manufacturer_id || null,
          ex_showroom_price: Number(row.ex_showroom_price) || 0,
          price_min: Number(row.price_min) || 0,
          price_max: Number(row.price_max) || 0,
          range_km: Number(row.range_km) || 0,
          top_speed_kmh: Number(row.top_speed_kmh) || 0,
          battery_capacity_kwh: Number(row.battery_capacity_kwh) || 0,
          motor_power_kw: Number(row.motor_power_kw) || 0,
          charging_time_hrs: Number(row.charging_time_hrs) || 0,
          image_url: row.image_url || null,
          image_gallery: parseArray(row.image_gallery),
          gallery_urls: parseArray(row.gallery_urls),
          video_url: row.video_url || null,
          description: row.description || null,
          is_upcoming: row.is_upcoming === 'true',
          is_featured: row.is_featured === 'true',
          is_latest: row.is_latest === 'true',
          status: row.status || 'draft',
          launch_date: row.launch_date || null,
          colors: parseArray(row.colors),
          features: parseArray(row.features),
          pros: parseArray(row.pros),
          cons: parseArray(row.cons),
          specifications: parseJson(row.specifications),
          related_news_ids: parseArray(row.related_news_ids),
          similar_vehicle_ids: parseArray(row.similar_vehicle_ids),
          seo_title: row.seo_title || null,
          seo_description: row.seo_description || null,
          seo_keywords: row.seo_keywords ? parseArray(row.seo_keywords) : null,
        }]);
        if (error) throw error;
        success++;
      } catch (err: any) { errors.push(`Row ${i + 1}: ${err.message}`); }
    }
    if (success > 0) fetchVehicles();
    return { success, errors };
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Car size={28} className="text-[#145a2c]" />
              Vehicle Management
            </h1>
            <p className="admin-subtitle">Manage all electric vehicles</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportExport
              tableName="vehicles"
              exportColumns={EXPORT_COLS}
              importColumns={IMPORT_COLS}
              data={vehicles}
              onImport={handleImport}
            />
            <Link href="/admin/vehicles/new" className="admin-btn-primary">
              <Plus size={16} />
              Add Vehicle
            </Link>
          </div>
        </div>

        <div className="admin-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vehicles..." className="admin-input pl-9" />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="admin-select">
            <option value="">All Types</option>
            <option value="scooter">Scooters</option>
            <option value="bike">Bikes</option>
            <option value="car">Cars</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-select">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="admin-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 size={24} className="mx-auto animate-spin mb-2 text-gray-400" />
              Loading vehicles...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 mb-4">No vehicles found</p>
              <Link href="/admin/vehicles/new" className="admin-btn-primary"><Plus size={14} /> Add First Vehicle</Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead className="admin-table-head">
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Featured</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="admin-table-body">
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td className="font-medium text-gray-900">{vehicle.name}</td>
                        <td>{getVehicleTypeLabel(vehicle.type)}</td>
                        <td className="font-medium text-[#145a2c]">{formatPrice(vehicle.price_min)}</td>
                        <td>
                          <span className={cn('admin-badge', statusColors[vehicle.status || 'published'])}>
                            {vehicle.status || 'published'}
                          </span>
                        </td>
                        <td>{vehicle.is_featured ? '✓' : '—'}</td>
                        <td className="text-xs text-gray-500">{timeAgo(vehicle.updated_at || vehicle.created_at)}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/vehicles/${vehicle.slug}`}
                              target="_blank"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye size={14} />
                            </Link>
                            <Link
                              href={`/admin/vehicles/${vehicle.id}/edit`}
                              className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit (including variants)"
                            >
                              <Pencil size={14} />
                            </Link>
                            <button
                              onClick={() => deleteVehicle(vehicle.id)}
                              disabled={deleting === vehicle.id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deleting === vehicle.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
