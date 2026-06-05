'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { StaticPage } from '@/lib/types';
import { FileText, Loader2 } from 'lucide-react';
import Pagination from '@/components/admin/Pagination';

export default function AdminCMSPage() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<StaticPage | null>(null);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPages();
  }, [page, pageSize]);

  const fetchPages = async () => {
    try {
      const [{ count }, { data }] = await Promise.all([
        supabase.from('static_pages').select('id', { count: 'exact', head: true }),
        supabase.from('static_pages').select('*').order('created_at', { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1),
      ]);
      setPages((data as StaticPage[]) || []);
      setTotal(count ?? 0);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (page: StaticPage) => {
    setEditingId(page.id);
    setEditData({ ...page });
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const saveChanges = async () => {
    if (!editData) return;
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('static_pages')
        .update({
          title: editData.title,
          content: editData.content,
          seo_title: editData.seo_title,
          seo_description: editData.seo_description,
          is_active: editData.is_active,
        })
        .eq('id', editData.id);

      if (error) throw error;
      setMessage('✓ Saved successfully');
      setTimeout(() => {
        setEditingId(null);
        fetchPages();
      }, 1000);
    } catch (error: any) {
      setMessage('✗ Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header mb-6">
          <h1 className="admin-title flex items-center gap-3">
            <FileText size={28} className="text-[#145a2c]" />
            CMS Pages
          </h1>
          <p className="admin-subtitle">Edit website content</p>
        </div>

        {loading ? (
          <div className="admin-card p-8 text-center">
            <Loader2 size={24} className="mx-auto animate-spin mb-2" />
            Loading pages...
          </div>
        ) : editingId ? (
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-2xl font-bold mb-6">Editing: {editData?.slug}</h2>

            {message && (
              <div className={`p-3 rounded ${message.includes('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={editData?.title || ''}
                onChange={(e) => setEditData(editData ? { ...editData, title: e.target.value } : null)}
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML)</label>
              <textarea
                value={editData?.content || ''}
                onChange={(e) => setEditData(editData ? { ...editData, content: e.target.value } : null)}
                className="admin-input font-mono text-sm"
                rows={12}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
              <input
                type="text"
                value={editData?.seo_title || ''}
                onChange={(e) => setEditData(editData ? { ...editData, seo_title: e.target.value } : null)}
                className="admin-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
              <textarea
                value={editData?.seo_description || ''}
                onChange={(e) => setEditData(editData ? { ...editData, seo_description: e.target.value } : null)}
                className="admin-input"
                rows={2}
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editData?.is_active || false}
                onChange={(e) => setEditData(editData ? { ...editData, is_active: e.target.checked } : null)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Active (show on frontend)</span>
            </label>

            <div className="flex gap-3 pt-4">
              <button onClick={saveChanges} disabled={saving} className="admin-btn-primary">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={cancelEdit} className="admin-btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-card">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead className="admin-table-head">
                  <tr>
                    <th>Page</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody className="admin-table-body">
                  {pages.map((page) => (
                    <tr key={page.id}>
                      <td className="font-medium">{page.slug}</td>
                      <td>
                        <span className={page.is_active ? 'admin-badge bg-green-100 text-green-700' : 'admin-badge bg-gray-100 text-gray-700'}>
                          {page.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-sm text-gray-500">{new Date(page.updated_at).toLocaleDateString()}</td>
                      <td>
                        <button onClick={() => startEditing(page)} className="text-[#145a2c] hover:underline font-medium">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>
        )}
      </div>
    </div>
  );
}
