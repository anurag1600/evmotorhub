'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { HeroSlide } from '@/lib/types';
import { Layers, Plus, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Pagination from '@/components/admin/Pagination';
import ImportExport from '@/components/admin/ImportExport';

const EXPORT_COLS = ['id', 'title', 'subtitle', 'description', 'cta_button_text', 'cta_button_url', 'image_url', 'order', 'is_active'];
const IMPORT_COLS = ['title', 'subtitle', 'description', 'cta_button_text', 'cta_button_url', 'image_url', 'order', 'is_active'];

export default function AdminHeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    try {
      const [{ count }, { data }] = await Promise.all([
        supabase.from('hero_slides').select('id', { count: 'exact', head: true }),
        supabase.from('hero_slides').select('*').order('created_at', { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1),
      ]);
      setSlides((data as HeroSlide[]) || []);
      setTotal(count ?? 0);
    } catch (error) { console.error('Failed to fetch slides:', error); }
    finally { setLoading(false); }
  }, [page, pageSize]);

  useEffect(() => { fetchSlides(); }, [fetchSlides]);

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await supabase.from('hero_slides').update({ is_active: !isActive }).eq('id', id);
      setSlides(slides.map(s => s.id === id ? { ...s, is_active: !isActive } : s));
    } catch (error) { console.error('Toggle failed:', error); }
  };

  const deleteSlide = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    setDeleting(id);
    try {
      await supabase.from('hero_slides').delete().eq('id', id);
      setSlides(slides.filter(s => s.id !== id));
      setTotal(t => t - 1);
    } catch (error) { console.error('Delete failed:', error); }
    finally { setDeleting(null); }
  };

  const handleImport = async (rows: Record<string, string>[]) => {
    const errors: string[] = [];
    let success = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.title) { errors.push(`Row ${i + 1}: title is required`); continue; }
      if (!row.image_url) { errors.push(`Row ${i + 1}: image_url is required`); continue; }
      try {
        const { error } = await supabase.from('hero_slides').insert([{
          title: row.title,
          subtitle: row.subtitle || '',
          description: row.description || '',
          cta_button_text: row.cta_button_text || '',
          cta_button_url: row.cta_button_url || '',
          image_url: row.image_url,
          order: Number(row.order) || 0,
          is_active: row.is_active !== 'false',
        }]);
        if (error) throw error;
        success++;
      } catch (err: any) { errors.push(`Row ${i + 1}: ${err.message}`); }
    }
    if (success > 0) fetchSlides();
    return { success, errors };
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Layers size={28} className="text-[#145a2c]" />
              Hero Slides
            </h1>
            <p className="admin-subtitle">Manage homepage hero carousel</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportExport
              tableName="hero_slides"
              exportColumns={EXPORT_COLS}
              importColumns={IMPORT_COLS}
              data={slides}
              onImport={handleImport}
            />
            <Link href="/admin/hero-slides/create" className="admin-btn-primary">
              <Plus size={16} />
              Add Slide
            </Link>
          </div>
        </div>

        <div className="admin-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 size={24} className="mx-auto animate-spin mb-2 text-gray-400" />
              Loading slides...
            </div>
          ) : slides.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 mb-4">No slides yet</p>
              <Link href="/admin/hero-slides/create" className="admin-btn-primary">
                <Plus size={14} /> Create First Slide
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead className="admin-table-head">
                    <tr>
                      <th>Title</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="admin-table-body">
                    {slides.map((slide) => (
                      <tr key={slide.id}>
                        <td className="font-medium text-gray-900">{slide.title}</td>
                        <td className="text-gray-600">{slide.order}</td>
                        <td>
                          <button
                            onClick={() => toggleActive(slide.id, slide.is_active)}
                            className={cn('admin-badge cursor-pointer', slide.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
                          >
                            {slide.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/hero-slides/${slide.id}/edit`} className="text-[#145a2c] hover:text-[#0f4020]">
                              <Edit2 size={14} />
                            </Link>
                            <button onClick={() => deleteSlide(slide.id)} disabled={deleting === slide.id} className="text-red-600 hover:text-red-700">
                              {deleting === slide.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
