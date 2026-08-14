'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Manufacturer } from '@/lib/types';
import { Package, Plus, Pencil, Trash2, Search, Loader as Loader2, CircleAlert as AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/format';
import Pagination from '@/components/admin/Pagination';
import ImportExport from '@/components/admin/ImportExport';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
};

const EXPORT_COLS = ['id', 'name', 'slug', 'logo_url', 'hero_image_url', 'description', 'country', 'founded_year', 'headquarters', 'website', 'total_models', 'is_featured', 'show_on_homepage', 'contact_email', 'support_phone', 'model_year_start', 'status'];
const IMPORT_COLS = ['name', 'slug', 'logo_url', 'hero_image_url', 'description', 'country', 'founded_year', 'headquarters', 'website', 'total_models', 'is_featured', 'show_on_homepage', 'contact_email', 'support_phone', 'model_year_start', 'status'];

export default function ManufacturersManagementPage() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchManufacturers = useCallback(async () => {
    setLoading(true);
    try {
      let countQuery = supabase.from('manufacturers').select('id', { count: 'exact', head: true });
      let dataQuery = supabase.from('manufacturers').select('*').order('updated_at', { ascending: false });

      if (status) { countQuery = countQuery.eq('status', status); dataQuery = dataQuery.eq('status', status); }
      if (search) { countQuery = countQuery.ilike('name', `%${search}%`); dataQuery = dataQuery.ilike('name', `%${search}%`); }

      const from = (page - 1) * pageSize;
      dataQuery = dataQuery.range(from, from + pageSize - 1);

      const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);
      if (!error && data) { setManufacturers(data as Manufacturer[]); setTotal(count ?? 0); }
    } catch (err) { console.error('Failed to fetch manufacturers:', err); }
    finally { setLoading(false); }
  }, [search, status, page, pageSize]);

  useEffect(() => { fetchManufacturers(); }, [fetchManufacturers]);
  useEffect(() => { setPage(1); }, [search, status]);

  const deleteManufacturer = async (id: string) => {
    if (!confirm('Delete this manufacturer?')) return;
    setDeleting(id);
    try {
      await supabase.from('manufacturers').delete().eq('id', id);
      setManufacturers(manufacturers.filter(m => m.id !== id));
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
      const slug = row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      try {
        const { error } = await supabase.from('manufacturers').insert([{
          name: row.name,
          slug,
          country: row.country || 'India',
          founded_year: row.founded_year ? Number(row.founded_year) : null,
          headquarters: row.headquarters || '',
          website: row.website || '',
          status: row.status || 'active',
          is_featured: row.is_featured === 'true',
        }]);
        if (error) throw error;
        success++;
      } catch (err: any) { errors.push(`Row ${i + 1}: ${err.message}`); }
    }
    if (success > 0) fetchManufacturers();
    return { success, errors };
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Package size={28} className="text-[#145a2c]" />
              Manufacturers
            </h1>
            <p className="admin-subtitle">Manage EV manufacturers and brands</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportExport
              tableName="manufacturers"
              exportColumns={EXPORT_COLS}
              importColumns={IMPORT_COLS}
              data={manufacturers}
              onImport={handleImport}
            />
            <Link href="/admin/manufacturers/new" className="admin-btn-primary">
              <Plus size={16} />
              Add Manufacturer
            </Link>
          </div>
        </div>

        <div className="admin-search-toolbar">
          <div className="admin-search-field">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search manufacturers..." className="admin-input pl-9" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-filter-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="admin-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 size={24} className="mx-auto animate-spin mb-2 text-gray-400" />
              Loading manufacturers...
            </div>
          ) : manufacturers.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 mb-4">No manufacturers found</p>
              <Link href="/admin/manufacturers/new" className="admin-btn-primary"><Plus size={14} /> Add First Manufacturer</Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead className="admin-table-head">
                    <tr>
                      <th>Manufacturer Name</th>
                      <th>Country</th>
                      <th>Models</th>
                      <th>Status</th>
                      <th>Homepage</th>
                      <th>Featured</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="admin-table-body">
                    {manufacturers.map((m) => (
                      <tr key={m.id}>
                        <td className="font-medium text-gray-900">{m.name}</td>
                        <td className="text-gray-600">{m.country}</td>
                        <td className="text-gray-600">{m.total_models}</td>
                        <td>
                          <span className={cn('admin-badge', statusColors[m.status || 'active'])}>
                            {m.status || 'active'}
                          </span>
                        </td>
                        <td>{m.show_on_homepage !== false ? '✓' : '—'}</td>
                        <td>{m.is_featured ? '✓' : '—'}</td>
                        <td className="text-xs text-gray-500">{timeAgo(m.updated_at || m.created_at)}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/manufacturers/${m.slug}`}
                              target="_blank"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye size={14} />
                            </Link>
                            <Link
                              href={`/admin/manufacturers/${m.id}/edit`}
                              className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </Link>
                            <button
                              onClick={() => deleteManufacturer(m.id)}
                              disabled={deleting === m.id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deleting === m.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
