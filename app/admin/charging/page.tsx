'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ChargingStation } from '@/lib/types';
import { Zap, Plus, Pencil, Trash2, Search, Loader as Loader2, CircleAlert as AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Pagination from '@/components/admin/Pagination';
import ImportExport from '@/components/admin/ImportExport';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-700',
  coming_soon: 'bg-amber-100 text-amber-700',
};

const EXPORT_COLS = ['id', 'name', 'address', 'city', 'state', 'lat', 'lng', 'operator', 'connector_types', 'total_chargers', 'available_chargers', 'power_kw', 'status', 'amenities', 'operating_hours', 'map_embed_url'];
const IMPORT_COLS = ['name', 'address', 'city', 'state', 'lat', 'lng', 'operator', 'connector_types', 'total_chargers', 'available_chargers', 'power_kw', 'status', 'amenities', 'operating_hours', 'map_embed_url'];

export default function ChargingStationsPage() {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      let countQuery = supabase.from('charging_stations').select('id', { count: 'exact', head: true });
      let dataQuery = supabase.from('charging_stations').select('*').order('updated_at', { ascending: false });

      if (status) { countQuery = countQuery.eq('status', status); dataQuery = dataQuery.eq('status', status); }
      if (search) { countQuery = countQuery.ilike('name', `%${search}%`); dataQuery = dataQuery.ilike('name', `%${search}%`); }

      const from = (page - 1) * pageSize;
      dataQuery = dataQuery.range(from, from + pageSize - 1);

      const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);
      if (!error && data) { setStations(data as ChargingStation[]); setTotal(count ?? 0); }
    } catch (err) { console.error('Failed to fetch stations:', err); }
    finally { setLoading(false); }
  }, [search, status, page, pageSize]);

  useEffect(() => { fetchStations(); }, [fetchStations]);
  useEffect(() => { setPage(1); }, [search, status]);

  const deleteStation = async (id: string) => {
    if (!confirm('Delete this charging station?')) return;
    setDeleting(id);
    try {
      await supabase.from('charging_stations').delete().eq('id', id);
      setStations(stations.filter(s => s.id !== id));
      setTotal(t => t - 1);
      toast.success('Charging station deleted successfully');
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast.error(err.message || 'Failed to delete charging station');
    }
    finally { setDeleting(null); }
  };

  const handleImport = async (rows: Record<string, string>[]) => {
    const errors: string[] = [];
    let success = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.name) { errors.push(`Row ${i + 1}: name is required`); continue; }
      if (!row.city) { errors.push(`Row ${i + 1}: city is required`); continue; }
      try {
        const { error } = await supabase.from('charging_stations').insert([{
          name: row.name,
          address: row.address || '',
          city: row.city,
          state: row.state || '',
          operator: row.operator || '',
          total_chargers: Number(row.total_chargers) || 1,
          available_chargers: Number(row.available_chargers) || 0,
          power_kw: Number(row.power_kw) || 0,
          status: row.status || 'active',
          connector_types: ['CCS'],
        }]);
        if (error) throw error;
        success++;
      } catch (err: any) { errors.push(`Row ${i + 1}: ${err.message}`); }
    }
    if (success > 0) fetchStations();
    return { success, errors };
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Zap size={28} className="text-[#145a2c]" />
              Charging Stations
            </h1>
            <p className="admin-subtitle">Manage EV charging stations</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportExport
              tableName="charging_stations"
              exportColumns={EXPORT_COLS}
              importColumns={IMPORT_COLS}
              data={stations}
              onImport={handleImport}
            />
            <Link href="/admin/charging/new" className="admin-btn-primary">
              <Plus size={16} />
              Add Station
            </Link>
          </div>
        </div>

        <div className="admin-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="admin-input pl-9" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="coming_soon">Coming Soon</option>
          </select>
        </div>

        <div className="admin-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 size={24} className="mx-auto animate-spin mb-2 text-gray-400" />
              Loading stations...
            </div>
          ) : stations.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 mb-4">No stations found</p>
              <Link href="/admin/charging/new" className="admin-btn-primary"><Plus size={14} /> Add First Station</Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead className="admin-table-head">
                    <tr>
                      <th>Station Name</th>
                      <th>City</th>
                      <th>Chargers</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="admin-table-body">
                    {stations.map((station) => (
                      <tr key={station.id}>
                        <td className="font-medium text-gray-900">{station.name}</td>
                        <td className="text-gray-600">{station.city}</td>
                        <td className="text-gray-600">{station.available_chargers}/{station.total_chargers}</td>
                        <td>
                          <span className={cn('admin-badge', statusColors[station.status])}>
                            {station.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/charging-stations?highlight=${station.id}`}
                              target="_blank"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye size={14} />
                            </Link>
                            <Link
                              href={`/admin/charging/${station.id}/edit`}
                              className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </Link>
                            <button
                              onClick={() => deleteStation(station.id)}
                              disabled={deleting === station.id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deleting === station.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
