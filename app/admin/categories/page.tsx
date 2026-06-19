'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { HomepageCategory } from '@/lib/types';
import { LayoutGrid, Plus, CreditCard as Edit2, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<HomepageCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('homepage_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      setCategories((data || []) as HomepageCategory[]);
      setLoading(false);
    };
    fetchCategories();
  }, []);

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await supabase.from('homepage_categories').update({ is_active: !currentStatus }).eq('id', id);
      setCategories(categories.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
      toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    setDeleting(id);
    try {
      await supabase.from('homepage_categories').delete().eq('id', id);
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const moveCategory = async (id: string, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const categoriesCopy = [...categories];
    [categoriesCopy[idx], categoriesCopy[swapIdx]] = [categoriesCopy[swapIdx], categoriesCopy[idx]];

    // Update sort orders
    const updates = categoriesCopy.map((c, i) => ({ id: c.id, sort_order: i + 1 }));
    setCategories(categoriesCopy.map((c, i) => ({ ...c, sort_order: i + 1 })));

    try {
      await Promise.all(
        updates.map(u => supabase.from('homepage_categories').update({ sort_order: u.sort_order }).eq('id', u.id))
      );
      toast.success('Order updated');
    } catch (err) {
      toast.error('Failed to update order');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid size={24} className="text-[#145a2c]" />
            Homepage Categories
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage the EV type categories shown on the homepage</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="flex items-center gap-2 bg-[#145a2c] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#0f4020] transition-colors"
        >
          <Plus size={16} />
          Add Category
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <LayoutGrid size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 mb-4">No categories yet</p>
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center gap-2 text-[#145a2c] font-semibold text-sm hover:underline"
          >
            <Plus size={14} /> Add your first category
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category, idx) => (
            <div
              key={category.id}
              className={cn(
                'bg-white rounded-xl border p-4 flex items-center gap-4 transition-all',
                !category.is_active ? 'border-gray-200 opacity-60' : 'border-gray-100 hover:shadow-sm'
              )}
            >
              {/* Drag Handle + Order */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => moveCategory(category.id, 'up')}
                  disabled={idx === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="text-xs">▲</span>
                </button>
                <div className="text-xs font-bold text-gray-400">#{category.sort_order}</div>
                <button
                  onClick={() => moveCategory(category.id, 'down')}
                  disabled={idx === categories.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="text-xs">▼</span>
                </button>
              </div>

              {/* Image */}
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                {category.image_url ? (
                  <Image
                    src={category.image_url}
                    alt={category.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={20} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{category.title}</span>
                  {category.vehicle_type && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {category.vehicle_type}
                    </span>
                  )}
                </div>
                {category.subtitle && (
                  <p className="text-sm text-gray-500 truncate">{category.subtitle}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{category.link_url}</p>
              </div>

              {/* Status Toggle */}
              <button
                onClick={() => toggleActive(category.id, category.is_active)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors',
                  category.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {category.is_active ? 'Active' : 'Inactive'}
              </button>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/admin/categories/${category.id}/edit`}
                  className="p-2 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Edit2 size={14} />
                </Link>
                <button
                  onClick={() => deleteCategory(category.id)}
                  disabled={deleting === category.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>Tip:</strong> Vehicle counts are automatically calculated from the database based on the vehicle type. Categories marked as inactive won't appear on the homepage.
      </div>
    </div>
  );
}
