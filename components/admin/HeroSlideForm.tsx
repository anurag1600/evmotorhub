'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { HeroSlide } from '@/lib/types';
import { Save, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface HeroSlideFormProps {
  id?: string;
}

export default function HeroSlideForm({ id }: HeroSlideFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    cta_button_text: '',
    cta_button_url: '',
    image_url: '',
    order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (id) {
      fetchSlide();
    }
  }, [id]);

  const fetchSlide = async () => {
    try {
      const { data, error: err } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (err) throw err;
      if (data) setForm(data as any);
    } catch (err: any) {
      setError('Failed to load slide: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.image_url.trim()) {
      setError('Image is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (id) {
        const { error: err } = await supabase
          .from('hero_slides')
          .update(form)
          .eq('id', id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('hero_slides')
          .insert([{ ...form, order: parseInt(form.order.toString()) }]);
        if (err) throw err;
      }
      router.push('/admin/hero-slides');
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
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
      <div className="admin-container max-w-2xl">
        <h1 className="admin-title mb-6">{id ? 'Edit Hero Slide' : 'Create Hero Slide'}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="admin-card p-4 bg-red-50 border border-red-200 flex gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="admin-card p-6 space-y-4">
            <h2 className="font-bold text-lg">Content</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="admin-input"
                placeholder="Main headline"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="admin-input"
                placeholder="Secondary headline"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="admin-input"
                rows={3}
                placeholder="Additional text"
              />
            </div>
          </div>

          <div className="admin-card p-6 space-y-4">
            <h2 className="font-bold text-lg">Call-to-Action Button</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={form.cta_button_text}
                onChange={(e) => setForm({ ...form, cta_button_text: e.target.value })}
                className="admin-input"
                placeholder="e.g., Explore Vehicles"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button URL</label>
              <input
                type="text"
                value={form.cta_button_url}
                onChange={(e) => setForm({ ...form, cta_button_url: e.target.value })}
                className="admin-input"
                placeholder="e.g., /vehicles"
              />
            </div>
          </div>

          <div className="admin-card p-6 space-y-4">
            <h2 className="font-bold text-lg">Image *</h2>
            <ImageUpload
              bucket="hero-images"
              onImageUrl={(url) => setForm({ ...form, image_url: url })}
              currentImageUrl={form.image_url}
              label="Banner Image *"
              aspectRatio="wide"
              recommendedWidth={1920}
              recommendedHeight={600}
              helpText="Recommended: 1920×600px"
            />
          </div>

          <div className="admin-card p-6 space-y-4">
            <h2 className="font-bold text-lg">Settings</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                min="0"
                className="admin-input"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Active (show on homepage)</span>
            </label>
          </div>

          <div className="admin-card p-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="admin-btn-primary flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Slide'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="admin-btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
