'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { FAQItem } from '@/lib/types';
import { CircleHelp as HelpCircle, Plus, CreditCard as Edit2, Trash2, Loader as Loader2, CircleAlert as AlertCircle, ChevronUp, ChevronDown, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/format';
import Pagination from '@/components/admin/Pagination';
import { toast } from 'sonner';

const categories = [
  { value: 'general', label: 'General' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'pricing', label: 'Pricing & EMI' },
  { value: 'charging', label: 'Charging' },
  { value: 'policy', label: 'Policy & Subsidy' },
];

export default function AdminFAQPage() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<FAQItem>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ question: '', answer: '', category: 'general' });
  const [homepageLimit, setHomepageLimit] = useState(6);
  const [contactLimit, setContactLimit] = useState(4);
  const [limitSaving, setLimitSaving] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('faq_items')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      setItems((data as FAQItem[]) || []);
    } catch (error) {
      console.error('Failed to fetch FAQ items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Fetch FAQ display limits
  useEffect(() => {
    supabase.from('site_config').select('faq_homepage_limit, faq_contact_limit').limit(1).then(({ data }) => {
      if (data?.[0]) {
        setHomepageLimit(data[0].faq_homepage_limit || 6);
        setContactLimit(data[0].faq_contact_limit || 4);
      }
    });
  }, []);

  const saveLimits = async () => {
    setLimitSaving(true);
    setLimitMessage('');
    try {
      const { data: configData } = await supabase.from('site_config').select('id').limit(1);
      const id = configData?.[0]?.id;
      const update = { faq_homepage_limit: homepageLimit, faq_contact_limit: contactLimit };
      const { error } = id
        ? await supabase.from('site_config').update(update).eq('id', id)
        : await supabase.from('site_config').insert([update]);
      if (error) throw error;
      setLimitMessage('Limits saved successfully!');
      toast.success('Item saved successfully');
      setTimeout(() => setLimitMessage(''), 2000);
    } catch (err: any) {
      setLimitMessage('Error: ' + err.message);
      toast.error(err.message);
    } finally {
      setLimitSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await supabase.from('faq_items').update({ is_active: !isActive, updated_at: new Date().toISOString() }).eq('id', id);
      setItems(items.map(i => i.id === id ? { ...i, is_active: !isActive } : i));
    } catch (error) { console.error('Toggle failed:', error); }
  };

  const moveItem = async (id: string, direction: -1 | 1) => {
    const idx = items.findIndex(i => i.id === id);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= items.length) return;
    const newItems = [...items];
    [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
    setItems(newItems);
    try {
      await Promise.all([
        supabase.from('faq_items').update({ sort_order: idx, updated_at: new Date().toISOString() }).eq('id', newItems[idx].id),
        supabase.from('faq_items').update({ sort_order: newIdx, updated_at: new Date().toISOString() }).eq('id', newItems[newIdx].id),
      ]);
    } catch (error) { console.error('Reorder failed:', error); fetchItems(); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this FAQ item?')) return;
    setDeleting(id);
    try {
      await supabase.from('faq_items').delete().eq('id', id);
      setItems(items.filter(i => i.id !== id));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete');
    }
    finally { setDeleting(null); }
  };

  const startEditing = (item: FAQItem) => {
    setEditingId(item.id);
    setEditData({ question: item.question, answer: item.answer, category: item.category });
    setShowAdd(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!editingId || !editData.question || !editData.answer) return;
    setSaving(true);
    setMessage('');
    try {
      const { error } = await supabase
        .from('faq_items')
        .update({ question: editData.question, answer: editData.answer, category: editData.category, updated_at: new Date().toISOString() })
        .eq('id', editingId);
      if (error) throw error;
      setMessage('FAQ updated successfully!');
      toast.success('Item saved successfully');
      setEditingId(null);
      setEditData({});
      fetchItems();
      setTimeout(() => setMessage(''), 2000);
    } catch (err: any) {
      setMessage('Error: ' + err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addNewItem = async () => {
    if (!newItem.question || !newItem.answer) return;
    setSaving(true);
    setMessage('');
    try {
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;
      const { error } = await supabase.from('faq_items').insert([{
        question: newItem.question,
        answer: newItem.answer,
        category: newItem.category,
        sort_order: maxOrder,
        is_active: true,
      }]);
      if (error) throw error;
      setMessage('FAQ created successfully!');
      toast.success('Item saved successfully');
      setNewItem({ question: '', answer: '', category: 'general' });
      setShowAdd(false);
      fetchItems();
      setTimeout(() => setMessage(''), 2000);
    } catch (err: any) {
      setMessage('Error: ' + err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <HelpCircle size={28} className="text-[#145a2c]" />
              FAQ Management
            </h1>
            <p className="admin-subtitle">Manage frequently asked questions</p>
          </div>
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); }}
            className="admin-btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Add FAQ
          </button>
        </div>

        {message && (
          <div className={cn('mb-4 p-3 rounded-lg text-sm', message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200')}>
            {message}
          </div>
        )}

        {/* Add New FAQ Form */}
        {showAdd && (
          <div className="admin-card p-6 mb-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">New FAQ Item</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Question *</label>
              <input type="text" value={newItem.question} onChange={(e) => setNewItem({ ...newItem, question: e.target.value })} className="admin-input" placeholder="Enter the question" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Answer *</label>
              <textarea value={newItem.answer} onChange={(e) => setNewItem({ ...newItem, answer: e.target.value })} className="admin-input" rows={3} placeholder="Enter the answer" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
              <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="admin-select">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={addNewItem} disabled={saving} className="admin-btn-primary flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Creating...' : 'Create FAQ'}
              </button>
              <button onClick={() => setShowAdd(false)} className="admin-btn-secondary flex items-center gap-2">
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Edit Inline */}
        {editingId && (
          <div className="admin-card p-6 mb-6 space-y-4 border-2 border-[#145a2c]">
            <h2 className="text-lg font-bold border-b pb-3">Editing FAQ</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Question *</label>
              <input type="text" value={editData.question || ''} onChange={(e) => setEditData({ ...editData, question: e.target.value })} className="admin-input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Answer *</label>
              <textarea value={editData.answer || ''} onChange={(e) => setEditData({ ...editData, answer: e.target.value })} className="admin-input" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
              <select value={editData.category || 'general'} onChange={(e) => setEditData({ ...editData, category: e.target.value })} className="admin-select">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={saveEdit} disabled={saving} className="admin-btn-primary flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={cancelEdit} className="admin-btn-secondary flex items-center gap-2">
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* FAQ List */}
        <div className="admin-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 size={24} className="mx-auto animate-spin mb-2 text-gray-400" />
              Loading FAQ items...
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 mb-4">No FAQ items yet</p>
              <button onClick={() => setShowAdd(true)} className="admin-btn-primary">
                <Plus size={14} /> Create First FAQ
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead className="admin-table-head">
                  <tr>
                    <th className="w-8"></th>
                    <th>Question</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="admin-table-body">
                  {items.map((item) => (
                    <tr key={item.id} className={editingId === item.id ? 'bg-green-50' : ''}>
                      <td>
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => moveItem(item.id, -1)} className="p-0.5 hover:bg-gray-200 rounded" title="Move up">
                            <ChevronUp size={12} className="text-gray-400" />
                          </button>
                          <button onClick={() => moveItem(item.id, 1)} className="p-0.5 hover:bg-gray-200 rounded" title="Move down">
                            <ChevronDown size={12} className="text-gray-400" />
                          </button>
                        </div>
                      </td>
                      <td className="font-medium text-gray-900 max-w-md truncate">{item.question}</td>
                      <td>
                        <span className="admin-badge bg-gray-100 text-gray-700 capitalize">{item.category}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => toggleActive(item.id, item.is_active)}
                          className={cn('admin-badge cursor-pointer', item.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
                        >
                          {item.is_active ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="text-xs text-gray-500">{timeAgo(item.updated_at || item.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditing(item)} className="text-[#145a2c] hover:text-[#0f4020]">
                            <Edit2 size={14} />
                          </button>
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
          )}
        </div>

        {/* FAQ Display Limits */}
        <div className="admin-card p-6 mt-6 space-y-4">
          <h2 className="text-lg font-bold border-b pb-3">Display Settings</h2>
          <p className="text-sm text-gray-500">Configure how many FAQs appear on different pages</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Homepage FAQ Limit</label>
              <input
                type="number"
                min={1}
                max={20}
                value={homepageLimit}
                onChange={(e) => setHomepageLimit(parseInt(e.target.value) || 6)}
                className="admin-input"
              />
              <p className="text-xs text-gray-400 mt-1">Number of FAQs shown on the homepage</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Page FAQ Limit</label>
              <input
                type="number"
                min={1}
                max={20}
                value={contactLimit}
                onChange={(e) => setContactLimit(parseInt(e.target.value) || 4)}
                className="admin-input"
              />
              <p className="text-xs text-gray-400 mt-1">Number of FAQs shown on the contact page</p>
            </div>
          </div>
          {limitMessage && (
            <div className={cn('p-3 rounded-lg text-sm', limitMessage.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200')}>
              {limitMessage}
            </div>
          )}
          <button onClick={saveLimits} disabled={limitSaving} className="admin-btn-primary flex items-center gap-2">
            {limitSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {limitSaving ? 'Saving...' : 'Save Display Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
