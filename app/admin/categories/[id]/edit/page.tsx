'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { HomepageCategory } from '@/lib/types';
import { LayoutGrid, ArrowLeft, Save, Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';

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

    if (!form.image_url) {
      toast.error('Please upload an image');
      return;
    }

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
    return (
      <div className="admin-page">
        <div className="admin-container flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="admin-page">
        <div className="admin-container text-center py-12">
          <p className="text-gray-600">Category not found</p>
          <Link href="/admin/categories" className="text-[#145a2c] hover:underline">Back to categories</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/admin/categories"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="admin-title flex items-center gap-2">
              <LayoutGrid size={24} className="text-[#145a2c]" />
              Edit Category
            </h1>
            <p className="admin-subtitle">Update category details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="admin-card p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                className="admin-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subtitle</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))}
                className="admin-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category Image *</label>
            <ImageUpload
              bucket="images"
              onImageUrl={(url) => setForm(f => ({ ...f, image_url: url }))}
              currentImageUrl={form.image_url}
              label="Category Image"
              recommendedWidth={400}
              recommendedHeight={250}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Link URL *</label>
              <input
                type="text"
                value={form.link_url}
                onChange={(e) => setForm(f => ({ ...f, link_url: e.target.value }))}
                className="admin-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type</label>
              <select
                value={form.vehicle_type}
                onChange={(e) => setForm(f => ({ ...f, vehicle_type: e.target.value }))}
                className="admin-select"
              >
                {vehicleTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1.5">
                When a vehicle type is selected, the vehicle count on the homepage will show the actual number from the database.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm(f => ({ ...f, sort_order: e.target.value }))}
                className="admin-input"
              />
            </div>

            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 rounded accent-[#145a2c]"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700 ml-2">Show on homepage</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link
              href="/admin/categories"
              className="admin-btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="admin-btn-primary flex items-center gap-2"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Update Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditCategoryPage() {
  return (
    <Suspense fallback={<div className="admin-page"><div className="admin-container flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div></div>}>
      <EditCategoryForm />
    </Suspense>
  );
}
