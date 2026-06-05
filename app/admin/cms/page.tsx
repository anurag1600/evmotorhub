'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { StaticPage, ContentBlock } from '@/lib/types';
import { FileText, Loader as Loader2, Plus, Save, X, CircleAlert as AlertCircle } from 'lucide-react';
import ContentBlockEditor from '@/components/admin/ContentBlockEditor';

export default function AdminCMSPage() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<StaticPage> & { content_blocks: ContentBlock[]; use_block_editor: boolean }>({
    content_blocks: [],
    use_block_editor: false,
  });
  const [message, setMessage] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data } = await supabase.from('static_pages').select('*').order('updated_at', { ascending: false });
      setPages((data as StaticPage[]) || []);
    } catch (error) {
      console.error('Failed to fetch pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (page: StaticPage) => {
    setEditingId(page.id);
    const blocks = (page as any).content_blocks || [];
    setEditData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      content_blocks: blocks,
      use_block_editor: blocks.length > 0,
      seo_title: page.seo_title || '',
      seo_description: page.seo_description || '',
      is_active: page.is_active,
    });
    setShowAdd(false);
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ content_blocks: [], use_block_editor: false });
  };

  const saveChanges = async () => {
    if (!editingId || !editData.slug) return;
    setSaving(true);
    setMessage('');

    try {
      const updateData: any = {
        title: editData.title,
        slug: editData.slug,
        content: editData.content || '',
        content_blocks: editData.use_block_editor ? editData.content_blocks : [],
        seo_title: editData.seo_title || null,
        seo_description: editData.seo_description || null,
        is_active: editData.is_active || false,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('static_pages')
        .update(updateData)
        .eq('id', editingId);

      if (error) throw error;
      setMessage('Saved successfully');
      setTimeout(() => { setEditingId(null); fetchPages(); }, 1000);
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addNewPage = async () => {
    if (!editData.slug) return;
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase.from('static_pages').insert([{
        title: editData.title || editData.slug,
        slug: editData.slug,
        content: editData.content || '',
        content_blocks: editData.use_block_editor ? editData.content_blocks : [],
        seo_title: editData.seo_title || null,
        seo_description: editData.seo_description || null,
        is_active: editData.is_active || false,
      }]);

      if (error) throw error;
      setMessage('Page created successfully');
      setTimeout(() => { setShowAdd(false); setEditData({ content_blocks: [], use_block_editor: false }); fetchPages(); }, 1000);
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm('Delete this page?')) return;
    try {
      await supabase.from('static_pages').delete().eq('id', id);
      setPages(pages.filter(p => p.id !== id));
    } catch (error: any) {
      alert('Failed to delete: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-container flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-[#145a2c]" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header mb-6">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <FileText size={28} className="text-[#145a2c]" />
              CMS Pages
            </h1>
            <p className="admin-subtitle">Manage website content pages with block editor</p>
          </div>
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); setEditData({ title: '', slug: '', content: '', content_blocks: [], use_block_editor: false, seo_title: '', seo_description: '', is_active: true }); }}
            className="admin-btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> New Page
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message}
          </div>
        )}

        {/* Add New Page */}
        {showAdd && (
          <div className="admin-card p-6 mb-6 space-y-4 border-2 border-[#145a2c]">
            <h2 className="text-lg font-bold border-b pb-3">New Page</h2>
            <PageEditor editData={editData} setEditData={setEditData} />
            <div className="flex gap-3">
              <button onClick={addNewPage} disabled={saving} className="admin-btn-primary flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Creating...' : 'Create Page'}
              </button>
              <button onClick={() => setShowAdd(false)} className="admin-btn-secondary flex items-center gap-2">
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Edit Page */}
        {editingId && !showAdd && (
          <div className="admin-card p-6 mb-6 space-y-4 border-2 border-[#145a2c]">
            <h2 className="text-lg font-bold border-b pb-3">Editing: {editData.slug}</h2>
            <PageEditor editData={editData} setEditData={setEditData} />
            <div className="flex gap-3">
              <button onClick={saveChanges} disabled={saving} className="admin-btn-primary flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={cancelEdit} className="admin-btn-secondary flex items-center gap-2">
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Page List */}
        {!editingId && !showAdd && (
          <div className="admin-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead className="admin-table-head">
                  <tr>
                    <th>Page</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="admin-table-body">
                  {pages.map((page) => (
                    <tr key={page.id}>
                      <td className="font-mono text-sm text-gray-600">/{page.slug}</td>
                      <td className="font-medium text-gray-900">{page.title}</td>
                      <td>
                        <span className={page.is_active ? 'admin-badge bg-green-100 text-green-700' : 'admin-badge bg-gray-100 text-gray-700'}>
                          {page.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-sm text-gray-500">{new Date(page.updated_at || page.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditing(page)} className="text-[#145a2c] hover:underline font-medium text-sm">
                            Edit
                          </button>
                          <button onClick={() => deletePage(page.id)} className="text-red-500 hover:text-red-700 text-sm">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PageEditor({
  editData,
  setEditData,
}: {
  editData: Partial<StaticPage> & { content_blocks: ContentBlock[]; use_block_editor: boolean };
  setEditData: (data: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Page Title</label>
          <input
            type="text"
            value={editData.title || ''}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="admin-input"
            placeholder="About Us"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Slug (URL path)</label>
          <input
            type="text"
            value={editData.slug || ''}
            onChange={(e) => setEditData({ ...editData, slug: e.target.value })}
            className="admin-input"
            placeholder="about"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">Content</label>
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={editData.use_block_editor}
              onChange={(e) => setEditData({ ...editData, use_block_editor: e.target.checked })}
              className="w-3.5 h-3.5 rounded accent-[#145a2c]"
            />
            Use Block Editor
          </label>
        </div>
        {editData.use_block_editor ? (
          <ContentBlockEditor blocks={editData.content_blocks} onChange={(blocks) => setEditData({ ...editData, content_blocks: blocks })} />
        ) : (
          <textarea
            value={editData.content || ''}
            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
            className="admin-input font-mono text-sm"
            rows={12}
            placeholder="Page content (supports HTML)"
          />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">SEO Title</label>
          <input
            type="text"
            value={editData.seo_title || ''}
            onChange={(e) => setEditData({ ...editData, seo_title: e.target.value })}
            className="admin-input"
            placeholder="SEO title"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">SEO Description</label>
          <textarea
            value={editData.seo_description || ''}
            onChange={(e) => setEditData({ ...editData, seo_description: e.target.value })}
            className="admin-input"
            rows={2}
            placeholder="Meta description"
          />
        </div>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={editData.is_active || false}
          onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
          className="w-4 h-4 accent-[#145a2c]"
        />
        <span className="text-sm font-medium text-gray-700">Active (visible on frontend)</span>
      </label>
    </div>
  );
}
