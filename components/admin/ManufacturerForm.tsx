'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Manufacturer } from '@/lib/types';
import { Save, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react';
import { slugify } from '@/lib/format';
import ImageUpload from '@/components/ImageUpload';
import { toast } from 'sonner';

interface ManufacturerFormProps {
  manufacturerId?: string;
}

export default function ManufacturerForm({ manufacturerId }: ManufacturerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!manufacturerId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo_url: '',
    hero_image_url: '',
    description: '',
    country: '',
    founded_year: new Date().getFullYear() - 10,
    headquarters: '',
    website: '',
    total_models: 0,
    is_featured: false,
    contact_email: '',
    support_phone: '',
    model_year_start: new Date().getFullYear() - 5,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (manufacturerId) {
      fetchManufacturer();
    }
  }, [manufacturerId]);

  const fetchManufacturer = async () => {
    try {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('*')
        .eq('id', manufacturerId)
        .maybeSingle();

      if (error || !data) throw new Error('Manufacturer not found');
      setFormData(data as any);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { name, slug, logo_url, hero_image_url, description, country, founded_year, headquarters, website, total_models, is_featured, contact_email, support_phone, model_year_start, status } = formData;

      if (!name || !slug || !country) {
        throw new Error('Name, slug, and country are required');
      }

      if (manufacturerId) {
        const { error } = await supabase
          .from('manufacturers')
          .update({
            name,
            slug,
            logo_url,
            hero_image_url,
            description,
            country,
            founded_year,
            headquarters,
            website,
            total_models,
            is_featured,
            contact_email,
            support_phone,
            model_year_start,
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', manufacturerId);

        if (error) throw error;
        setSuccess('Manufacturer updated successfully!');
        toast.success('Manufacturer updated successfully');
      } else {
        const { error } = await supabase.from('manufacturers').insert([{
          name,
          slug,
          logo_url,
          hero_image_url,
          description,
          country,
          founded_year,
          headquarters,
          website,
          total_models,
          is_featured,
          contact_email,
          support_phone,
          model_year_start,
          status,
        }]);

        if (error) throw error;
        setSuccess('Manufacturer created successfully!');
        toast.success('Manufacturer created successfully');
      }

      setTimeout(() => router.push('/admin/manufacturers'), 1500);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to save manufacturer');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = () => {
    const slug = slugify(formData.name);
    setFormData({ ...formData, slug });
  };

  if (loading) {
    return <div className="text-center py-12"><Loader2 className="inline-block animate-spin text-gray-400" size={32} /></div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-red-700">Error</div>
            <div className="text-sm text-red-600">{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-green-700">{success}</div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold">Brand Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={generateSlug}
                  placeholder="Brand name"
                  className="admin-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="brand-slug"
                  className="admin-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brand description"
                rows={4}
                className="admin-textarea"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Country"
                  className="admin-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Headquarters</label>
                <input
                  type="text"
                  value={formData.headquarters}
                  onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                  placeholder="Headquarters location"
                  className="admin-input"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Founded Year</label>
                <input
                  type="number"
                  value={formData.founded_year}
                  onChange={(e) => setFormData({ ...formData, founded_year: Number(e.target.value) })}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">EV Models Started (Year)</label>
                <input
                  type="number"
                  value={formData.model_year_start}
                  onChange={(e) => setFormData({ ...formData, model_year_start: Number(e.target.value) })}
                  className="admin-input"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                  className="admin-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Models</label>
                <input
                  type="number"
                  value={formData.total_models}
                  onChange={(e) => setFormData({ ...formData, total_models: Number(e.target.value) })}
                  className="admin-input"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold">Contact Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="contact@brand.com"
                  className="admin-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Support Phone</label>
                <input
                  type="tel"
                  value={formData.support_phone}
                  onChange={(e) => setFormData({ ...formData, support_phone: e.target.value })}
                  placeholder="+91-XXX-XXX-XXXX"
                  className="admin-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Media */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold mb-4">Brand Media</h2>
            <div className="space-y-6">
              <ImageUpload
                bucket="manufacturers"
                onImageUrl={(url) => setFormData({ ...formData, logo_url: url })}
                currentImageUrl={formData.logo_url}
                label="Brand Logo"
                recommendedWidth={200}
                recommendedHeight={100}
              />
              <ImageUpload
                bucket="manufacturers"
                onImageUrl={(url) => setFormData({ ...formData, hero_image_url: url })}
                currentImageUrl={formData.hero_image_url}
                label="Hero Image"
                recommendedWidth={1200}
                recommendedHeight={600}
              />
            </div>
          </div>

          {/* Status */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold mb-4">Status</h2>
            <div className="space-y-3">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="admin-select"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#145a2c]"
                />
                <span className="text-sm font-medium text-gray-700">Featured Brand</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="admin-btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : manufacturerId ? 'Update Brand' : 'Create Brand'}
        </button>
        <button type="button" onClick={() => router.back()} className="admin-btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
