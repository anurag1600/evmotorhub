'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface SeoSettings {
  id: string;
  site_name: string;
  site_description: string;
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  default_og_image: string;
  twitter_handle: string;
  twitter_card: string;
  google_analytics_id: string;
  google_search_console_id: string;
  favicon_url: string;
  robots_txt: string;
}

const defaultSeo: SeoSettings = {
  id: '',
  site_name: 'EVMotorHub',
  site_description: "India's most trusted EV marketplace",
  meta_title: 'EVMotorHub - Compare Electric Vehicles in India',
  meta_description: 'Compare 50+ EV models, calculate EMI, find charging stations. India\'s #1 EV marketplace.',
  og_title: '',
  og_description: '',
  default_og_image: '',
  twitter_handle: '@evmotorhub',
  twitter_card: 'summary_large_image',
  google_analytics_id: '',
  google_search_console_id: '',
  favicon_url: '/Fav_(1).png',
  robots_txt: 'User-agent: *\nAllow: /',
};

export default function SEOSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [seo, setSeo] = useState<SeoSettings>(defaultSeo);

  useEffect(() => {
    fetchSeo();
  }, []);

  const fetchSeo = async () => {
    try {
      const { data, error: err } = await supabase
        .from('seo_settings')
        .select('*')
        .maybeSingle();
      if (err) throw err;
      if (data) setSeo({ ...defaultSeo, ...data });
    } catch (err: any) {
      setError('Failed to load SEO settings: ' + err.message);
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
      const { id, ...updateData } = seo;
      const query = id
        ? supabase.from('seo_settings').update(updateData).eq('id', id)
        : supabase.from('seo_settings').update(updateData);

      const { error: err } = await query;
      if (err) throw err;

      setSuccess('SEO settings saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save SEO settings');
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
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Search size={28} className="text-[#145a2c]" />
              SEO Settings
            </h1>
            <p className="admin-subtitle">Manage meta tags, Open Graph, and analytics tracking</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="admin-card p-4 bg-red-50 border border-red-200 flex gap-3">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="admin-card p-4 bg-green-50 border border-green-200 flex gap-3">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Site Identity */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Site Identity</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Site Name</label>
                <input
                  type="text"
                  value={seo.site_name}
                  onChange={(e) => setSeo({ ...seo, site_name: e.target.value })}
                  className="admin-input"
                  placeholder="EVMotorHub"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Favicon URL</label>
                <input
                  type="text"
                  value={seo.favicon_url}
                  onChange={(e) => setSeo({ ...seo, favicon_url: e.target.value })}
                  className="admin-input"
                  placeholder="/Fav_(1).png"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Site Description</label>
              <textarea
                value={seo.site_description}
                onChange={(e) => setSeo({ ...seo, site_description: e.target.value })}
                className="admin-input"
                rows={2}
              />
            </div>
          </div>

          {/* Default Meta Tags */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Default Meta Tags</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default Meta Title</label>
              <input
                type="text"
                value={seo.meta_title}
                onChange={(e) => setSeo({ ...seo, meta_title: e.target.value })}
                className="admin-input"
                placeholder="Page Title | Site Name"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 50–60 characters</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default Meta Description</label>
              <textarea
                value={seo.meta_description}
                onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })}
                className="admin-input"
                rows={2}
                placeholder="Default description for search engines"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 150–160 characters</p>
            </div>
          </div>

          {/* Open Graph */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Open Graph (Social Sharing)</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">OG Title</label>
              <input
                type="text"
                value={seo.og_title}
                onChange={(e) => setSeo({ ...seo, og_title: e.target.value })}
                className="admin-input"
                placeholder="Title shown when shared on Facebook, LinkedIn etc."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">OG Description</label>
              <textarea
                value={seo.og_description}
                onChange={(e) => setSeo({ ...seo, og_description: e.target.value })}
                className="admin-input"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default OG Image URL</label>
              <input
                type="text"
                value={seo.default_og_image}
                onChange={(e) => setSeo({ ...seo, default_og_image: e.target.value })}
                className="admin-input"
                placeholder="https://... (1200x630px recommended)"
              />
            </div>
          </div>

          {/* Twitter / X */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">X / Twitter Card</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Twitter Handle</label>
                <input
                  type="text"
                  value={seo.twitter_handle}
                  onChange={(e) => setSeo({ ...seo, twitter_handle: e.target.value })}
                  className="admin-input"
                  placeholder="@handle"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Twitter Card Type</label>
                <select
                  value={seo.twitter_card}
                  onChange={(e) => setSeo({ ...seo, twitter_card: e.target.value })}
                  className="admin-input"
                >
                  <option value="summary">Summary</option>
                  <option value="summary_large_image">Summary with Large Image</option>
                </select>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Analytics &amp; Tracking</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Google Analytics ID</label>
                <input
                  type="text"
                  value={seo.google_analytics_id}
                  onChange={(e) => setSeo({ ...seo, google_analytics_id: e.target.value })}
                  className="admin-input"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Google Search Console ID</label>
                <input
                  type="text"
                  value={seo.google_search_console_id}
                  onChange={(e) => setSeo({ ...seo, google_search_console_id: e.target.value })}
                  className="admin-input"
                  placeholder="Verification meta tag value"
                />
              </div>
            </div>
          </div>

          {/* Robots.txt */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Robots.txt</h2>
            <textarea
              value={seo.robots_txt}
              onChange={(e) => setSeo({ ...seo, robots_txt: e.target.value })}
              className="admin-input font-mono text-sm"
              rows={4}
              placeholder="User-agent: *&#10;Allow: /"
            />
          </div>

          {/* Save */}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="admin-btn-primary flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save SEO Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
