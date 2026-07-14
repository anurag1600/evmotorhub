'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Megaphone, ArrowLeft, Save, Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';

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

function NewAdForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    ad_type: 'banner',
    ad_size: 'rectangle',
    ad_position: searchParams.get('position') || 'vehicle_sidebar',
    image_url: '',
    destination_url: '',
    start_date: '',
    end_date: '',
    sort_order: '0',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) { toast.error('Please upload an advertisement image'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        ad_type: form.ad_type,
        ad_size: form.ad_size,
        ad_position: form.ad_position,
        image_url: form.image_url,
        destination_url: form.destination_url || null,
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

        <ImageUpload
          bucket="advertisements"
          onImageUrl={(url) => setForm(f => ({ ...f, image_url: url }))}
          currentImageUrl={form.image_url}
          label="Advertisement Image *"
          aspectRatio="wide"
          helpText="Upload will auto-compress to WEBP"
        />

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            />
          </div>
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
