'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileSliders as Sliders, Save, Loader as Loader2, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Plus, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface FooterConfig {
  id: string;
  footer_show_social: boolean;
  footer_show_quick_links: boolean;
  footer_show_contact: boolean;
  footer_show_legal: boolean;
  footer_show_copyright: boolean;
  footer_show_newsletter: boolean;
  footer_copyright_text: string;
  footer_company_name: string;
  footer_tagline: string;
  footer_description: string;
  footer_powered_by_text: string;
  footer_custom_links: { label: string; url: string }[];
  social_media: Record<string, string>;
  contact_info: Record<string, string>;
}

const defaultConfig: FooterConfig = {
  id: '',
  footer_show_social: true,
  footer_show_quick_links: true,
  footer_show_contact: true,
  footer_show_legal: true,
  footer_show_copyright: true,
  footer_show_newsletter: true,
  footer_copyright_text: '',
  footer_company_name: 'EVMotorHub',
  footer_tagline: "India's trusted EV marketplace",
  footer_description: "India's trusted EV marketplace. Research, compare, and find your perfect electric vehicle.",
  footer_powered_by_text: 'Powered by clean energy data',
  footer_custom_links: [],
  social_media: {},
  contact_info: {},
};

export default function FooterSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [config, setConfig] = useState<FooterConfig>(defaultConfig);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      const { data, error: err } = await supabase.from('site_config').select('*').maybeSingle();
      if (err) throw err;
      if (data) {
        setConfig({
          ...defaultConfig,
          ...data,
          footer_custom_links: data.footer_custom_links || [],
          social_media: data.social_media || {},
          contact_info: data.contact_info || {},
        });
      }
    } catch (err: any) {
      setError('Failed to load settings: ' + err.message);
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
      const { id, ...updateData } = config;
      const { error: err } = id
        ? await supabase.from('site_config').update(updateData).eq('id', id)
        : await supabase.from('site_config').update(updateData);
      if (err) throw err;
      setSuccess('Footer settings saved!');
      setTimeout(() => setSuccess(''), 3000);
      toast.success('Footer settings saved successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const addCustomLink = () => {
    if (newLinkLabel.trim() && newLinkUrl.trim()) {
      setConfig({
        ...config,
        footer_custom_links: [...config.footer_custom_links, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }],
      });
      setNewLinkLabel('');
      setNewLinkUrl('');
    }
  };

  const removeCustomLink = (idx: number) => {
    setConfig({
      ...config,
      footer_custom_links: config.footer_custom_links.filter((_, i) => i !== idx),
    });
  };

  const toggleField = (field: keyof FooterConfig, val: boolean) =>
    setConfig({ ...config, [field]: val });

  if (loading) {
    return <div className="admin-page"><div className="admin-container flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-[#145a2c]" /></div></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Sliders size={28} className="text-[#145a2c]" />
              Footer Settings
            </h1>
            <p className="admin-subtitle">Control what sections appear in the website footer</p>
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

          {/* Visibility Toggles */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Section Visibility</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {([
                ['footer_show_social', 'Show Social Media Icons'],
                ['footer_show_quick_links', 'Show Quick Links Column'],
                ['footer_show_contact', 'Show Contact Information'],
                ['footer_show_legal', 'Show Legal Links'],
                ['footer_show_copyright', 'Show Copyright Bar'],
                ['footer_show_newsletter', 'Show Newsletter Signup'],
              ] as [keyof FooterConfig, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={config[key] as boolean} onChange={(e) => toggleField(key, e.target.checked)} className="w-4 h-4 accent-[#145a2c]" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Copyright Text */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Brand & Copyright</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={config.footer_company_name}
                  onChange={(e) => setConfig({ ...config, footer_company_name: e.target.value })}
                  className="admin-input"
                  placeholder="EVMotorHub"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tagline</label>
                <input
                  type="text"
                  value={config.footer_tagline}
                  onChange={(e) => setConfig({ ...config, footer_tagline: e.target.value })}
                  className="admin-input"
                  placeholder="India's trusted EV marketplace"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Footer Description</label>
                <textarea
                  value={config.footer_description}
                  onChange={(e) => setConfig({ ...config, footer_description: e.target.value })}
                  className="admin-input"
                  rows={2}
                  placeholder="Description shown below the logo in the footer"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Copyright Text</label>
                <input
                  type="text"
                  value={config.footer_copyright_text}
                  onChange={(e) => setConfig({ ...config, footer_copyright_text: e.target.value })}
                  className="admin-input"
                  placeholder="© 2024 EVMotorHub. All rights reserved."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Powered By Text</label>
                <input
                  type="text"
                  value={config.footer_powered_by_text}
                  onChange={(e) => setConfig({ ...config, footer_powered_by_text: e.target.value })}
                  className="admin-input"
                  placeholder="Powered by clean energy data"
                />
              </div>
            </div>
          </div>

          {/* Custom Footer Links */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Custom Footer Links</h2>
            <div className="space-y-2">
              {config.footer_custom_links.map((link, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                  <span className="text-sm font-medium text-gray-700 flex-1">{link.label}</span>
                  <span className="text-xs text-gray-500 flex-1 truncate">{link.url}</span>
                  <button type="button" onClick={() => removeCustomLink(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-end pt-2 border-t border-gray-100">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Label</label>
                <input type="text" value={newLinkLabel} onChange={(e) => setNewLinkLabel(e.target.value)} className="admin-input text-sm" placeholder="Link text" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">URL</label>
                <input type="text" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} className="admin-input text-sm" placeholder="/page-slug" />
              </div>
              <button type="button" onClick={addCustomLink} className="admin-btn-secondary flex items-center gap-1">
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="admin-btn-primary flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Footer Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
