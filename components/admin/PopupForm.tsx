'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';
import { POPUP_FREQUENCIES } from '@/lib/ad-constants';
import type { PopupAd, PopupFrequency } from '@/lib/types';

interface PopupFormProps {
  initialData?: PopupAd | null;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel?: string;
}

export default function PopupForm({ initialData, onSubmit, onCancel, submitLabel = 'Create Popup' }: PopupFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initialData?.name || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    image_url: initialData?.image_url || '',
    cta_text: initialData?.cta_text || '',
    cta_url: initialData?.cta_url || '',
    delay_seconds: initialData?.delay_seconds?.toString() || '3',
    display_duration: initialData?.display_duration?.toString() || '10',
    frequency: initialData?.frequency || 'once_per_session',
    cooldown_minutes: initialData?.cooldown_minutes?.toString() || '0',
    page_targets: (initialData?.page_targets || []).join(', '),
    exclude_pages: (initialData?.exclude_pages || []).join(', '),
    priority: initialData?.priority?.toString() || '0',
    is_active: initialData?.is_active ?? true,
    close_button_enabled: initialData?.close_button_enabled ?? true,
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Please enter a popup name'); return; }
    setSaving(true);
    try {
      const parseArray = (val: string): string[] | null => {
        const items = val.split(',').map(s => s.trim()).filter(Boolean);
        return items.length > 0 ? items : null;
      };

      const payload = {
        name: form.name,
        title: form.title || null,
        description: form.description || null,
        image_url: form.image_url || null,
        cta_text: form.cta_text || null,
        cta_url: form.cta_url || null,
        delay_seconds: parseInt(form.delay_seconds) || 3,
        display_duration: parseInt(form.display_duration) || 10,
        frequency: form.frequency,
        cooldown_minutes: parseInt(form.cooldown_minutes) || 0,
        page_targets: parseArray(form.page_targets),
        exclude_pages: parseArray(form.exclude_pages),
        priority: parseInt(form.priority) || 0,
        is_active: form.is_active,
        close_button_enabled: form.close_button_enabled,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };

      if (initialData) {
        const { error } = await supabase.from('popup_ads').update(payload).eq('id', initialData.id);
        if (error) throw error;
        toast.success('Popup updated successfully');
      } else {
        const { error } = await supabase.from('popup_ads').insert([payload]);
        if (error) throw error;
        toast.success('Popup created successfully');
      }
      onSubmit();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save popup');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Popup Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g., Diwali Offer Popup"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
          required
        />
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Popup Content</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Popup heading text"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Popup body text shown below the title"
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
          />
        </div>

        <ImageUpload
          bucket="advertisements"
          onImageUrl={(url) => setForm(f => ({ ...f, image_url: url }))}
          currentImageUrl={form.image_url}
          label="Popup Image (Optional)"
          aspectRatio="wide"
          helpText="Upload will auto-compress to WEBP"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">CTA Button Text</label>
            <input
              type="text"
              value={form.cta_text}
              onChange={(e) => setForm(f => ({ ...f, cta_text: e.target.value }))}
              placeholder="e.g., Claim Offer"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">CTA Button URL</label>
            <input
              type="text"
              value={form.cta_url}
              onChange={(e) => setForm(f => ({ ...f, cta_url: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Display Controls</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Delay (seconds)</label>
            <input
              type="number"
              value={form.delay_seconds}
              onChange={(e) => setForm(f => ({ ...f, delay_seconds: e.target.value }))}
              min="0"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (seconds)</label>
            <input
              type="number"
              value={form.display_duration}
              onChange={(e) => setForm(f => ({ ...f, display_duration: e.target.value }))}
              min="0"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            />
            <p className="text-xs text-gray-400 mt-1">0 = stays until user closes</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cooldown (minutes)</label>
            <input
              type="number"
              value={form.cooldown_minutes}
              onChange={(e) => setForm(f => ({ ...f, cooldown_minutes: e.target.value }))}
              min="0"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
            />
            <p className="text-xs text-gray-400 mt-1">0 = no cooldown</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Frequency</label>
          <select
            value={form.frequency}
            onChange={(e) => setForm(f => ({ ...f, frequency: e.target.value as PopupFrequency }))}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
          >
            {POPUP_FREQUENCIES.map((freq) => (
              <option key={freq.value} value={freq.value}>{freq.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Page Targeting</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Show On Pages</label>
          <input
            type="text"
            value={form.page_targets}
            onChange={(e) => setForm(f => ({ ...f, page_targets: e.target.value }))}
            placeholder="e.g., /, /vehicles, /charging-stations (comma-separated, blank = all pages)"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
          />
          <p className="text-xs text-gray-400 mt-1">Use "home" for the homepage. Comma-separated. Leave blank for all pages.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Exclude From Pages</label>
          <input
            type="text"
            value={form.exclude_pages}
            onChange={(e) => setForm(f => ({ ...f, exclude_pages: e.target.value }))}
            placeholder="e.g., /admin, /contact (comma-separated)"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority (higher = shown first)</label>
          <input
            type="number"
            value={form.priority}
            onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
            placeholder="0"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active_popup"
              checked={form.is_active}
              onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-[#145a2c] focus:ring-[#145a2c]"
            />
            <label htmlFor="is_active_popup" className="text-sm text-gray-700">Active (visible on site)</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="close_button"
              checked={form.close_button_enabled}
              onChange={(e) => setForm(f => ({ ...f, close_button_enabled: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-[#145a2c] focus:ring-[#145a2c]"
            />
            <label htmlFor="close_button" className="text-sm text-gray-700">Show close button</label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#145a2c] text-white rounded-xl text-sm font-semibold hover:bg-[#0f4020] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
