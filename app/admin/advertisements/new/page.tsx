'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Megaphone, ArrowLeft, Save, Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import { AD_SIZES, AD_POSITIONS } from '@/lib/ad-constants';

function NewAdForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    ad_type: 'banner',
    ad_size: 'rectangle',
    ad_position: '',
    image_url: '',
    destination_url: '',
    title: '',
    description: '',
    cta_text: '',
    custom_width: '',
    custom_height: '',
    priority: '0',
    page_target: '',
    start_date: '',
    end_date: '',
    sort_order: '0',
    is_active: true,
  });

  const isCustomSize = form.ad_size === 'custom';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) { toast.error('Please upload an advertisement image'); return; }
    if (!form.ad_position) { toast.error('Please select an ad position'); return; }
    if (isCustomSize && (!form.custom_width || !form.custom_height)) {
      toast.error('Please enter custom width and height');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        ad_type: form.ad_type,
        ad_size: form.ad_size,
        ad_position: form.ad_position,
        image_url: form.image_url,
        destination_url: form.destination_url || null,
        title: form.title || null,
        description: form.description || null,
        cta_text: form.cta_text || null,
        custom_width: isCustomSize ? (parseInt(form.custom_width) || null) : null,
        custom_height: isCustomSize ? (parseInt(form.custom_height) || null) : null,
        priority: parseInt(form.priority) || 0,
        page_target: form.page_target || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        sort_order: parseInt(form.sort_order) || 0,
        is_active: form.is_active,
      };

      const { error } = await supabase.from('advertisements').insert([payload]);
      if (error) throw error;

      toast.success('Ad created successfully');
      router.push('/admin/advertisements');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create ad');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/advertisements" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone size={22} className="text-[#145a2c]" />
          Create Advertisement
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g., Homepage Banner - Insurance Company"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Position *</label>
            <select
              value={form.ad_position}
              onChange={(e) => setForm(f => ({ ...f, ad_position: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
              required
            >
              <option value="" disabled>Select a position...</option>
              {AD_POSITIONS.map((pos) => (
                <option key={pos.value} value={pos.value}>{pos.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Size *</label>
            <select
              value={form.ad_size}
              onChange={(e) => setForm(f => ({ ...f, ad_size: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
              required
            >
              {AD_SIZES.map((size) => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isCustomSize && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Width (px) *</label>
              <input
                type="number"
                value={form.custom_width}
                onChange={(e) => setForm(f => ({ ...f, custom_width: e.target.value }))}
                placeholder="e.g., 468"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                required={isCustomSize}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Height (px) *</label>
              <input
                type="number"
                value={form.custom_height}
                onChange={(e) => setForm(f => ({ ...f, custom_height: e.target.value }))}
                placeholder="e.g., 60"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                required={isCustomSize}
              />
            </div>
          </div>
        )}

        <ImageUpload
          bucket="advertisements"
          onImageUrl={(url) => setForm(f => ({ ...f, image_url: url }))}
          currentImageUrl={form.image_url}
          label="Advertisement Image *"
          aspectRatio="wide"
          helpText="Upload will auto-compress to WEBP"
        />

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Ad Content (Optional)</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ad headline shown over the image"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short text shown below the title"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">CTA Button Text</label>
            <input
              type="text"
              value={form.cta_text}
              onChange={(e) => setForm(f => ({ ...f, cta_text: e.target.value }))}
              placeholder="e.g., Learn More, Shop Now"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination URL (Click Link)</label>
          <input
            type="text"
            value={form.destination_url}
            onChange={(e) => setForm(f => ({ ...f, destination_url: e.target.value }))}
            placeholder="https://..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Page Targeting</label>
          <input
            type="text"
            value={form.page_target}
            onChange={(e) => setForm(f => ({ ...f, page_target: e.target.value }))}
            placeholder="e.g., /vehicles, /charging-stations (comma-separated, blank = all pages)"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
          />
          <p className="text-xs text-gray-400 mt-1">Comma-separated page paths where this ad should appear. Leave blank for all pages.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
              onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c] cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
              onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c] cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority (higher = shown first)</label>
            <input
              type="number"
              value={form.priority}
              onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
              placeholder="0"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sort Order</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm(f => ({ ...f, sort_order: e.target.value }))}
              placeholder="0"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-[#145a2c] focus:ring-[#145a2c]"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">Active (visible on site)</label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href="/admin/advertisements" className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#145a2c] text-white rounded-xl text-sm font-semibold hover:bg-[#0f4020] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Create Ad'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewAdvertisementPage() {
  return (
    <Suspense fallback={<div className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-gray-400" /></div>}>
      <NewAdForm />
    </Suspense>
  );
}
