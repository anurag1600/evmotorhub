'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MonitorPlay, Plus, Pencil, Trash2, Search, Loader as Loader2, CircleAlert as AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import Pagination from '@/components/admin/Pagination';
import { toast } from 'sonner';
import { POPUP_FREQUENCIES } from '@/lib/ad-constants';
import type { PopupAd } from '@/lib/types';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  expired: 'bg-red-100 text-red-700',
};

export default function PopupAdsManagementPage() {
  const [popups, setPopups] = useState<PopupAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchPopups = useCallback(async () => {
    setLoading(true);
    try {
      let countQuery = supabase.from('popup_ads').select('id', { count: 'exact', head: true });
      let dataQuery = supabase.from('popup_ads').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false });

      if (search) {
        countQuery = countQuery.ilike('name', `%${search}%`);
        dataQuery = dataQuery.ilike('name', `%${search}%`);
      }

      const from = (page - 1) * pageSize;
      dataQuery = dataQuery.range(from, from + pageSize - 1);

      const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);
      if (!error && data) {
        setPopups(data as PopupAd[]);
        setTotal(count ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch popup ads:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => { fetchPopups(); }, [fetchPopups]);
  useEffect(() => { setPage(1); }, [search]);

  const getStatus = (popup: PopupAd) => {
    const now = new Date();
    if (!popup.is_active) return 'inactive';
    if (popup.start_date && new Date(popup.start_date) > now) return 'scheduled';
    if (popup.end_date && new Date(popup.end_date) < now) return 'expired';
    return 'active';
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await supabase.from('popup_ads').update({ is_active: !currentStatus }).eq('id', id);
      setPopups(popups.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
      toast.success(`Popup ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const deletePopup = async (id: string) => {
    if (!confirm('Delete this popup ad?')) return;
    setDeleting(id);
    try {
      await supabase.from('popup_ads').delete().eq('id', id);
      setPopups(popups.filter(p => p.id !== id));
      setTotal(t => t - 1);
      toast.success('Popup deleted successfully');
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const getCTR = (popup: PopupAd) => {
    if (popup.impression_count === 0) return '0.00%';
    return `${((popup.click_count / popup.impression_count) * 100).toFixed(2)}%`;
  };

  const getFrequencyLabel = (freq: string) => {
    return POPUP_FREQUENCIES.find(f => f.value === freq)?.label || freq;
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <MonitorPlay size={28} className="text-[#145a2c]" />
              Popup Ads Management
            </h1>
            <p className="admin-subtitle">Manage popup/modal ads with frequency and targeting controls</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/advertisements" className="admin-btn-secondary">
              Banner Ads
            </Link>
            <Link href="/admin/advertisements/popups/new" className="admin-btn-primary">
              <Plus size={16} />
              Create Popup
            </Link>
          </div>
        </div>

        <div className="admin-search-toolbar">
          <div className="admin-search-field">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search popup ads..."
              className="admin-input pl-9"
            />
          </div>
        </div>

        <div className="admin-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 size={24} className="mx-auto animate-spin mb-2 text-gray-400" />
              Loading popup ads...
            </div>
          ) : popups.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 mb-4">No popup ads found</p>
              <Link href="/admin/advertisements/popups/new" className="admin-btn-primary">
                <Plus size={14} /> Create First Popup
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead className="admin-table-head">
                    <tr>
                      <th>Popup</th>
                      <th>Frequency</th>
                      <th>Delay / Duration</th>
                      <th>Priority</th>
                      <th>Stats</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="admin-table-body">
                    {popups.map((popup) => {
                      const status = getStatus(popup);
                      return (
                        <tr key={popup.id}>
                          <td>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{popup.name}</div>
                              {popup.title && <div className="text-xs text-gray-500">{popup.title}</div>}
                              {popup.cta_url && (
                                <a
                                  href={popup.cta_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline truncate block max-w-[200px]"
                                >
                                  {popup.cta_url}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="text-xs text-gray-600">{getFrequencyLabel(popup.frequency)}</td>
                          <td className="text-xs text-gray-500">
                            <div>Delay: {popup.delay_seconds}s</div>
                            <div>Duration: {popup.display_duration === 0 ? 'Until closed' : `${popup.display_duration}s`}</div>
                          </td>
                          <td className="text-xs text-gray-600 font-medium">{popup.priority || 0}</td>
                          <td>
                            <div className="text-xs space-y-0.5">
                              <div className="flex items-center gap-1">
                                <Eye size={10} className="text-gray-400" />
                                <span>{popup.impression_count.toLocaleString()} views</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-blue-600">{popup.click_count.toLocaleString()} clicks</span>
                                <span className="text-gray-400">({getCTR(popup)})</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <button
                              onClick={() => toggleActive(popup.id, popup.is_active)}
                              className={cn('admin-badge', statusColors[status])}
                            >
                              {status}
                            </button>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/admin/advertisements/popups/${popup.id}/edit`}
                                className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </Link>
                              <button
                                onClick={() => deletePopup(popup.id)}
                                disabled={deleting === popup.id}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                {deleting === popup.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
    </div>
  );
}
