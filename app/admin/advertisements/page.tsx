'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Megaphone, Plus, Pencil, Trash2, Search, Loader as Loader2, CircleAlert as AlertCircle, Eye, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Pagination from '@/components/admin/Pagination';
import { toast } from 'sonner';

interface Advertisement {
  id: string;
  name: string;
  ad_type: string;
  ad_size: string;
  ad_position: string;
  image_url: string;
  destination_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  impression_count: number;
  click_count: number;
  sort_order: number;
  created_at: string;
}

const AD_SIZES = [
  { value: 'leaderboard', label: 'Leaderboard (728×90)' },
  { value: 'large_leaderboard', label: 'Large Leaderboard (970×90)' },
  { value: 'rectangle', label: 'Rectangle (300×250)' },
  { value: 'large_rectangle', label: 'Large Rectangle (336×280)' },
  { value: 'skyscraper', label: 'Skyscraper (120×600)' },
  { value: 'wide_skyscraper', label: 'Wide Skyscraper (160×600)' },
  { value: 'square', label: 'Square (250×250)' },
  { value: 'mobile_banner', label: 'Mobile Banner (320×50)' },
];

const AD_POSITIONS = [
  { value: 'homepage_below_hero', label: 'Homepage - Below Hero' },
  { value: 'homepage_before_faq', label: 'Homepage - Before FAQ' },
  { value: 'homepage_above_footer', label: 'Homepage - Above Footer' },
  { value: 'vehicle_sidebar', label: 'Vehicle Detail - Right Sidebar' },
  { value: 'vehicle_between_sections', label: 'Vehicle Detail - Between Sections' },
  { value: 'news_between_articles', label: 'News - Between Articles' },
  { value: 'listing_after_cards', label: 'Listings - After Every 6 Cards' },
  { value: 'mobile_sticky_bottom', label: 'Mobile - Sticky Bottom Banner' },
];

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  expired: 'bg-red-100 text-red-700',
};

export default function AdvertisementsManagementPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      let countQuery = supabase.from('advertisements').select('id', { count: 'exact', head: true });
      let dataQuery = supabase.from('advertisements').select('*').order('sort_order', { ascending: true });

      if (position) {
        countQuery = countQuery.eq('ad_position', position);
        dataQuery = dataQuery.eq('ad_position', position);
      }
      if (search) {
        countQuery = countQuery.ilike('name', `%${search}%`);
        dataQuery = dataQuery.ilike('name', `%${search}%`);
      }

      const from = (page - 1) * pageSize;
      dataQuery = dataQuery.range(from, from + pageSize - 1);

      const [{ count }, { data, error }] = await Promise.all([countQuery, dataQuery]);
      if (!error && data) {
        setAds(data as Advertisement[]);
        setTotal(count ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch ads:', err);
    } finally {
      setLoading(false);
    }
  }, [search, position, page, pageSize]);

  useEffect(() => { fetchAds(); }, [fetchAds]);
  useEffect(() => { setPage(1); }, [search, position]);

  const getAdStatus = (ad: Advertisement) => {
    const now = new Date();
    if (!ad.is_active) return 'inactive';
    if (ad.start_date && new Date(ad.start_date) > now) return 'scheduled';
    if (ad.end_date && new Date(ad.end_date) < now) return 'expired';
    return 'active';
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await supabase.from('advertisements').update({ is_active: !currentStatus }).eq('id', id);
      setAds(ads.map(ad => ad.id === id ? { ...ad, is_active: !currentStatus } : ad));
      toast.success(`Ad ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Delete this advertisement?')) return;
    setDeleting(id);
    try {
      await supabase.from('advertisements').delete().eq('id', id);
      setAds(ads.filter(ad => ad.id !== id));
      setTotal(t => t - 1);
      toast.success('Ad deleted successfully');
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const getCTR = (ad: Advertisement) => {
    if (ad.impression_count === 0) return '0.00%';
    return `${((ad.click_count / ad.impression_count) * 100).toFixed(2)}%`;
  };

  const getAdSizeLabel = (size: string) => {
    return AD_SIZES.find(s => s.value === size)?.label || size;
  };

  const getAdPositionLabel = (pos: string) => {
    return AD_POSITIONS.find(p => p.value === pos)?.label || pos;
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Megaphone size={28} className="text-[#145a2c]" />
              Advertisement Management
            </h1>
            <p className="admin-subtitle">Manage banner ads across the site</p>
          </div>
          <Link href="/admin/advertisements/new" className="admin-btn-primary">
            <Plus size={16} />
            Create Ad
          </Link>
        </div>

        <div className="admin-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ads..."
              className="admin-input pl-9"
            />
          </div>
          <select value={position} onChange={(e) => setPosition(e.target.value)} className="admin-select">
            <option value="">All Positions</option>
            {AD_POSITIONS.map((pos) => (
              <option key={pos.value} value={pos.value}>{pos.label}</option>
            ))}
          </select>
        </div>

        <div className="admin-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 size={24} className="mx-auto animate-spin mb-2 text-gray-400" />
              Loading ads...
            </div>
          ) : ads.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 mb-4">No advertisements found</p>
              <Link href="/admin/advertisements/new" className="admin-btn-primary">
                <Plus size={14} /> Create First Ad
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead className="admin-table-head">
                    <tr>
                      <th>Ad</th>
                      <th>Position</th>
                      <th>Size</th>
                      <th>Stats</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="admin-table-body">
                    {ads.map((ad) => {
                      const status = getAdStatus(ad);
                      return (
                        <tr key={ad.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                                {ad.image_url ? (
                                  <Image
                                    src={ad.image_url}
                                    alt={ad.name}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon size={16} className="text-gray-300" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">{ad.name}</div>
                                {ad.destination_url && (
                                  <a
                                    href={ad.destination_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline truncate block max-w-[200px]"
                                  >
                                    {ad.destination_url}
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-xs text-gray-600">{getAdPositionLabel(ad.ad_position)}</td>
                          <td className="text-xs text-gray-500">{getAdSizeLabel(ad.ad_size)}</td>
                          <td>
                            <div className="text-xs space-y-0.5">
                              <div className="flex items-center gap-1">
                                <Eye size={10} className="text-gray-400" />
                                <span>{ad.impression_count.toLocaleString()} views</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-blue-600">{ad.click_count.toLocaleString()} clicks</span>
                                <span className="text-gray-400">({getCTR(ad)})</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <button
                              onClick={() => toggleActive(ad.id, ad.is_active)}
                              className={cn('admin-badge', statusColors[status])}
                            >
                              {status}
                            </button>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/admin/advertisements/${ad.id}/edit`}
                                className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </Link>
                              <button
                                onClick={() => deleteAd(ad.id)}
                                disabled={deleting === ad.id}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                {deleting === ad.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
