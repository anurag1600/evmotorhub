'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PopularComparison, Vehicle } from '@/lib/types';
import { Scale, Plus, CreditCard as Edit2, Trash2, Search, Loader as Loader2, CircleAlert as AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { timeAgo } from '@/lib/format';
import Pagination from '@/components/admin/Pagination';
import ImportExport from '@/components/admin/ImportExport';
import { toast } from 'sonner';

const EXPORT_COLS = ['id', 'vehicle1_slug', 'vehicle2_slug', 'title', 'sort_order', 'is_active'];
const IMPORT_COLS = ['vehicle1_slug', 'vehicle2_slug', 'title', 'sort_order', 'is_active'];

export default function ComparisonsManagementPage() {
  const [items, setItems] = useState<PopularComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Pick<Vehicle, 'id' | 'name' | 'slug'>[]>([]);

  // Form state for add/edit
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ vehicle1_slug: '', vehicle2_slug: '', title: '', sort_order: 0, is_active: true });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let countQuery = supabase.from('popular_comparisons').select('id', { count: 'exact', head: true });
      let dataQuery = supabase.from('popular_comparisons').select('*').order('sort_order', { ascending: true });

      if (search) {
        countQuery = countQuery.ilike('title', `%${search}%`);
        dataQuery = dataQuery.ilike('title', `%${search}%`);
      }

      const from = (page - 1) * pageSize;
      dataQuery = dataQuery.range(from, from + pageSize - 1);

      const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);
      if (!error && data) { setItems(data as PopularComparison[]); setTotal(count ?? 0); }
    } catch (err) { console.error('Failed to fetch:', err); }
    finally { setLoading(false); }
  }, [search, page, pageSize]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { setPage(1); }, [search]);

  useEffect(() => {
    supabase.from('vehicles').select('id, name, slug').order('name').limit(200)
      .then(({ data }) => setVehicles((data || []) as any));
  }, []);

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this comparison?')) return;
    setDeleting(id);
    try {
      await supabase.from('popular_comparisons').delete().eq('id', id);
      setItems(items.filter(i => i.id !== id));
      setTotal(t => t - 1);
      toast.success('Item deleted successfully');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete');
    }
    finally { setDeleting(null); }
  };

  const toggleActive = async (item: PopularComparison) => {
    const newActive = !item.is_active;
    await supabase.from('popular_comparisons').update({ is_active: newActive }).eq('id', item.id);
    setItems(items.map(i => i.id === item.id ? { ...i, is_active: newActive } : i));
  };

  const openEdit = (item: PopularComparison) => {
    setEditingId(item.id);
    setForm({ vehicle1_slug: item.vehicle1_slug, vehicle2_slug: item.vehicle2_slug, title: item.title || '', sort_order: item.sort_order, is_active: item.is_active });
    setShowForm(true);
    setFormError('');
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ vehicle1_slug: '', vehicle2_slug: '', title: '', sort_order: 0, is_active: true });
    setShowForm(true);
    setFormError('');
  };

  const handleFormSave = async () => {
    if (!form.vehicle1_slug || !form.vehicle2_slug) {
      setFormError('Both vehicle slugs are required.');
      return;
    }
    setFormSaving(true);
    setFormError('');
    try {
      if (editingId) {
        const { error } = await supabase.from('popular_comparisons').update(form).eq('id', editingId);
        if (error) throw error;
        toast.success('Item saved successfully');
      } else {
        const { error } = await supabase.from('popular_comparisons').insert([form]);
        if (error) throw error;
        toast.success('Item saved successfully');
      }
      setShowForm(false);
      fetchItems();
    } catch (err: any) {
      setFormError(err.message || 'Save failed');
      toast.error(err.message || 'Save failed');
    } finally {
      setFormSaving(false);
    }
  };

  const handleImport = async (rows: Record<string, string>[]) => {
    const errors: string[] = [];
    let success = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.vehicle1_slug || !row.vehicle2_slug) { errors.push(`Row ${i + 1}: both vehicle slugs required`); continue; }
      try {
        const { error } = await supabase.from('popular_comparisons').insert([{
          vehicle1_slug: row.vehicle1_slug,
          vehicle2_slug: row.vehicle2_slug,
          title: row.title || null,
          sort_order: Number(row.sort_order) || 0,
          is_active: row.is_active !== 'false',
        }]);
        if (error) throw error;
        success++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }
    if (success > 0) fetchItems();
    return { success, errors };
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Scale size={28} className="text-[#145a2c]" />
              Popular Comparisons
            </h1>
            <p className="admin-subtitle">Manage popular vehicle comparisons shown on the Compare page</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportExport
              tableName="popular_comparisons"
              exportColumns={EXPORT_COLS}
              importColumns={IMPORT_COLS}
              data={items}
              onImport={handleImport}
            />
            <button onClick={openAdd} className="admin-btn-primary">
              <Plus size={16} />
              Add Comparison
            </button>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="admin-card p-6 mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">{editingId ? 'Edit' : 'Add'} Comparison</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="admin-label">Vehicle 1 *</label>
                <select value={form.vehicle1_slug} onChange={(e) => setForm({ ...form, vehicle1_slug: e.target.value })} className="admin-input">
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => <option key={v.slug} value={v.slug}>{v.name} ({v.slug})</option>)}
                </select>
              </div>
              <div>
                <label className="admin-label">Vehicle 2 *</label>
                <select value={form.vehicle2_slug} onChange={(e) => setForm({ ...form, vehicle2_slug: e.target.value })} className="admin-input">
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => <option key={v.slug} value={v.slug}>{v.name} ({v.slug})</option>)}
                </select>
              </div>
              <div>
                <label className="admin-label">Title (optional)</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="admin-input" placeholder="e.g. Ather vs Ola" />
              </div>
              <div>
                <label className="admin-label">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="admin-input" />
              </div>
            </div>
            <label className="flex items-center gap-2 mb-4">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded accent-[#145a2c]" />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
            {formError && <p className="text-sm text-red-600 mb-3">{formError}</p>}
            <div className="flex gap-2">
              <button onClick={handleFormSave} disabled={formSaving} className="admin-btn-primary text-sm">
                {formSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                {formSaving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowForm(false)} className="admin-btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="admin-search-toolbar">
          <div className="admin-search-field">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search comparisons..." className="admin-input pl-9" />
          </div>
        </div>

        <div className="admin-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 size={24} className="mx-auto animate-spin mb-2 text-gray-400" />
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 mb-4">No comparisons found</p>
              <button onClick={openAdd} className="admin-btn-primary"><Plus size={14} /> Add First Comparison</button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead className="admin-table-head">
                    <tr>
                      <th>Vehicle 1</th>
                      <th>Vehicle 2</th>
                      <th>Title</th>
                      <th>Order</th>
                      <th>Active</th>
                      <th>Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="admin-table-body">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="font-medium text-gray-900">{item.vehicle1_slug}</td>
                        <td className="font-medium text-gray-900">{item.vehicle2_slug}</td>
                        <td className="text-gray-600">{item.title || '—'}</td>
                        <td className="text-gray-500">{item.sort_order}</td>
                        <td>
                          <button onClick={() => toggleActive(item)} className="text-[#145a2c]">
                            {item.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} className="text-gray-300" />}
                          </button>
                        </td>
                        <td className="text-xs text-gray-500">{timeAgo(item.updated_at || item.created_at)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(item)} className="text-[#145a2c] hover:text-[#0f4020]"><Edit2 size={14} /></button>
                            <button onClick={() => deleteItem(item.id)} disabled={deleting === item.id} className="text-red-600 hover:text-red-700">
                              {deleting === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
