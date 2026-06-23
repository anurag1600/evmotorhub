'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { HomepageCategory } from '@/lib/types';
import { LayoutGrid, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const vehicleTypes = [
  { value: 'scooter', label: 'Electric Scooters' },
  { value: 'bike', label: 'Electric Bikes' },
  { value: 'car', label: 'Electric Cars' },
  { value: '', label: 'Custom (no auto-count)' },
];

function EditCategoryForm() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<HomepageCategory | null>(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    vehicle_type: '',
    sort_order: '0',
    is_active: true,
  });

  useEffect(() => {
    if (!id) return;

    const fetchCategory = async () => {
      setLoading(true);
      const { data } = await supabase.from('homepage_categories').select('*').eq('id', id).single();
      if (data) {
        setCategory(data as HomepageCategory);
        setForm({
          title: data.title || '',
          subtitle: data.subtitle || '',
          image_url: data.image_url || '',
          link_url: data.link_url || '',
          vehicle_type: data.vehicle_type || '',
          sort_order: data.sort_order?.toString() || '0',
          is_active: data.is_active ?? true,
        });
      }
      setLoading(false);
    };
    fetchCategory();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle || null,
        image_url: form.image_url,
        link_url: form.link_url,
        vehicle_type: form.vehicle_type || null,
        sort_order: parseInt(form.sort_order) || 0,
        is_active: form.is_active,
      };

      const { error } = await supabase.from('homepage_categories').update(payload).eq('id', id);
      if (error) throw error;

      toast.success('Category updated');
      router.push('/admin/categories');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Category not found</p>
        <Link href="/admin/categories" className="text-[#145a2c] hover:underline">Back to categories</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/categories"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid size={22} className="text-[#145a2c]" />
            Edit Category
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtitle</label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL *</label>
          <input
            type="text"
            value={form.image_url}
            onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
            required
          />
          {form.image_url && (
            <div className="mt-2 h-24 rounded-lg overflow-hidden bg-gray-100 relative">
              <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Link URL *</label>
          <input
            type="text"
            value={form.link_url}
            onChange={(e) => setForm(f => ({ ...f, link_url: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type</label>
          <select
            value={form.vehicle_type}
            onChange={(e) => setForm(f => ({ ...f, vehicle_type: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
          >
            {vehicleTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            When a vehicle type is selected, the vehicle count on the homepage will show the actual number from the database.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort Order</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm(f => ({ ...f, sort_order: e.target.value }))}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-[#145a2c] focus:ring-[#145a2c]"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">Show on homepage</label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/admin/categories"
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#145a2c] text-white rounded-xl text-sm font-semibold hover:bg-[#0f4020] transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Update Category'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditCategoryPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <EditCategoryForm />
    </Suspense>
  );
}
