'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Trash2, Loader as Loader2, CircleAlert as AlertCircle, Eye, X, Clock, Phone, User, MessageSquare, Tag, Pencil, Save } from 'lucide-react';
import { timeAgo } from '@/lib/format';
import Pagination from '@/components/admin/Pagination';
import { toast } from 'sonner';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
  responded: { label: 'Responded', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600' },
};

const STATUS_OPTIONS = ['new', 'in_progress', 'responded', 'closed'];

export default function ContactSubmissionsPage() {
  const [items, setItems] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ContactSubmission | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let countQuery = supabase.from('contact_submissions').select('id', { count: 'exact', head: true });
      let dataQuery = supabase.from('contact_submissions').select('*').order('created_at', { ascending: false });

      if (statusFilter) {
        countQuery = countQuery.eq('status', statusFilter);
        dataQuery = dataQuery.eq('status', statusFilter);
      }

      const from = (page - 1) * pageSize;
      dataQuery = dataQuery.range(from, from + pageSize - 1);

      const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);
      if (!error && data) {
        setItems(data as ContactSubmission[]);
        setTotal(count ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, pageSize]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setItems(items.map(i => i.id === id ? { ...i, status } : i));
      if (viewing?.id === id) setViewing({ ...viewing, status });
      toast.success('Status updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this submission?')) return;
    setDeleting(id);
    try {
      await supabase.from('contact_submissions').delete().eq('id', id);
      setItems(items.filter(i => i.id !== id));
      setTotal(t => t - 1);
      if (viewing?.id === id) setViewing(null);
      toast.success('Submission deleted');
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const saveNotes = async (id: string) => {
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ admin_notes: notesValue || null, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setItems(items.map(i => i.id === id ? { ...i, admin_notes: notesValue || null } : i));
      if (viewing?.id === id) setViewing({ ...viewing, admin_notes: notesValue || null });
      setEditingNotes(null);
      toast.success('Notes saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const newCount = items.filter(i => i.status === 'new').length;

  if (loading && items.length === 0) {
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
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Mail size={28} className="text-[#145a2c]" />
              Contact Submissions
            </h1>
            <p className="admin-subtitle">Manage inquiries from the Contact Us form</p>
          </div>
        </div>

        {/* Status Filters */}
        <div className="admin-card p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!statusFilter ? 'bg-[#145a2c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All ({total})
            </button>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-[#145a2c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Submissions List */}
          <div className={viewing ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="admin-card overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 size={24} className="mx-auto animate-spin mb-2 text-gray-400" />
                  Loading...
                </div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center">
                  <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600">No submissions found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="admin-table">
                      <thead className="admin-table-head">
                        <tr>
                          <th>From</th>
                          <th>Subject</th>
                          <th>Status</th>
                          <th>Received</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="admin-table-body">
                        {items.map((item) => {
                          const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;
                          return (
                            <tr key={item.id} className={viewing?.id === item.id ? 'bg-green-50/50' : ''}>
                              <td>
                                <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                                <div className="text-xs text-gray-500">{item.email}</div>
                              </td>
                              <td className="text-sm text-gray-700 max-w-[200px] truncate">{item.subject}</td>
                              <td>
                                <select
                                  value={item.status}
                                  onChange={(e) => updateStatus(item.id, e.target.value)}
                                  className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer ${sc.color}`}
                                >
                                  {STATUS_OPTIONS.map(s => (
                                    <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(item.created_at)}</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setViewing(item)} className="text-[#145a2c] hover:text-[#0f4020]">
                                    <Eye size={14} />
                                  </button>
                                  <button onClick={() => deleteItem(item.id)} disabled={deleting === item.id} className="text-red-600 hover:text-red-700">
                                    {deleting === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
                </>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          {viewing && (
            <div className="lg:col-span-1">
              <div className="admin-card p-5 sticky top-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Submission Details</h3>
                  <button onClick={() => { setViewing(null); setEditingNotes(null); }} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <User size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{viewing.name}</div>
                      <a href={`mailto:${viewing.email}`} className="text-xs text-[#145a2c] hover:underline">{viewing.email}</a>
                    </div>
                  </div>
                  {viewing.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <a href={`tel:${viewing.phone}`} className="text-xs text-gray-700 hover:text-[#145a2c]">{viewing.phone}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700">{viewing.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">{new Date(viewing.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MessageSquare size={14} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-600">Message</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{viewing.message}</p>
                </div>

                {/* Status Update */}
                <div className="border-t border-gray-100 pt-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(viewing.id, s)}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewing.status === s ? STATUS_CONFIG[s]?.color : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                      >
                        {STATUS_CONFIG[s]?.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-600">Admin Notes</span>
                    {editingNotes !== viewing.id && (
                      <button
                        onClick={() => { setEditingNotes(viewing.id); setNotesValue(viewing.admin_notes || ''); }}
                        className="text-[#145a2c] hover:text-[#0f4020]"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                  </div>
                  {editingNotes === viewing.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        rows={3}
                        className="admin-input text-sm"
                        placeholder="Add notes about this inquiry..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveNotes(viewing.id)}
                          disabled={savingNotes}
                          className="admin-btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                          {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          Save
                        </button>
                        <button onClick={() => setEditingNotes(null)} className="admin-btn-secondary text-xs py-1.5 px-3">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">
                      {viewing.admin_notes || 'No notes yet'}
                    </p>
                  )}
                </div>

                {/* Delete */}
                <div className="border-t border-gray-100 pt-3">
                  <button
                    onClick={() => deleteItem(viewing.id)}
                    disabled={deleting === viewing.id}
                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    {deleting === viewing.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Delete Submission
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
