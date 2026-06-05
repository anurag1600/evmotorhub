'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Home, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface SiteConfig {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_cta_text: string;
  hero_cta_url: string;
  section_toggles: {
    show_featured_vehicles: boolean;
    show_latest_news: boolean;
    show_manufacturers: boolean;
    show_charging_stations: boolean;
  };
  homepage_stats: {
    total_vehicles: number;
    total_manufacturers: number;
    total_charging_stations: number;
    monthly_visitors: number;
  };
  contact_info: {
    phone: string;
    email: string;
    address: string;
    whatsapp: string;
  };
  social_media: {
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
    twitter: string;
  };
}

const defaultConfig: SiteConfig = {
  id: '',
  hero_title: "Discover India's Best Electric Vehicles",
  hero_subtitle: 'Smarter. Greener. Better.',
  hero_description: 'Compare 50+ EV models, calculate EMI, and find charging stations near you.',
  hero_cta_text: 'Explore Vehicles',
  hero_cta_url: '/vehicles',
  section_toggles: {
    show_featured_vehicles: true,
    show_latest_news: true,
    show_manufacturers: true,
    show_charging_stations: true,
  },
  homepage_stats: {
    total_vehicles: 50,
    total_manufacturers: 8,
    total_charging_stations: 12000,
    monthly_visitors: 2000000,
  },
  contact_info: {
    phone: '+91 80 4567 8900',
    email: 'hello@evmotorhub.in',
    address: 'Bengaluru, Karnataka, India',
    whatsapp: '',
  },
  social_media: {
    facebook: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    twitter: '',
  },
};

export default function HomepageSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error: err } = await supabase
        .from('site_config')
        .select('*')
        .maybeSingle();

      if (err) throw err;
      if (data) {
        setConfig({
          ...defaultConfig,
          ...data,
          section_toggles: { ...defaultConfig.section_toggles, ...(data.section_toggles || {}) },
          homepage_stats: { ...defaultConfig.homepage_stats, ...(data.homepage_stats || {}) },
          contact_info: { ...defaultConfig.contact_info, ...(data.contact_info || {}) },
          social_media: { ...defaultConfig.social_media, ...(data.social_media || {}) },
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
        : await supabase.from('site_config').update(updateData).select();

      if (err) throw err;
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const setToggle = (key: keyof typeof config.section_toggles, val: boolean) =>
    setConfig({ ...config, section_toggles: { ...config.section_toggles, [key]: val } });

  const setContact = (key: keyof typeof config.contact_info, val: string) =>
    setConfig({ ...config, contact_info: { ...config.contact_info, [key]: val } });

  const setSocial = (key: keyof typeof config.social_media, val: string) =>
    setConfig({ ...config, social_media: { ...config.social_media, [key]: val } });

  const setStat = (key: keyof typeof config.homepage_stats, val: number) =>
    setConfig({ ...config, homepage_stats: { ...config.homepage_stats, [key]: val } });

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
              <Home size={28} className="text-[#145a2c]" />
              Homepage Settings
            </h1>
            <p className="admin-subtitle">Configure hero section, contact info, social media and section visibility</p>
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

          {/* Hero Section */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Hero Section</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hero Title</label>
              <input
                type="text"
                value={config.hero_title}
                onChange={(e) => setConfig({ ...config, hero_title: e.target.value })}
                className="admin-input"
                placeholder="Main headline text"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hero Subtitle</label>
              <input
                type="text"
                value={config.hero_subtitle}
                onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
                className="admin-input"
                placeholder="Secondary text below title"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hero Description</label>
              <textarea
                value={config.hero_description}
                onChange={(e) => setConfig({ ...config, hero_description: e.target.value })}
                className="admin-input"
                rows={2}
                placeholder="Supporting description text"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">CTA Button Text</label>
                <input
                  type="text"
                  value={config.hero_cta_text}
                  onChange={(e) => setConfig({ ...config, hero_cta_text: e.target.value })}
                  className="admin-input"
                  placeholder="e.g. Explore Vehicles"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">CTA Button Link</label>
                <input
                  type="text"
                  value={config.hero_cta_url}
                  onChange={(e) => setConfig({ ...config, hero_cta_url: e.target.value })}
                  className="admin-input"
                  placeholder="/vehicles"
                />
              </div>
            </div>
          </div>

          {/* Section Toggles */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Homepage Section Visibility</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                ['show_featured_vehicles', 'Show Featured Vehicles'],
                ['show_latest_news', 'Show Latest News'],
                ['show_manufacturers', 'Show Manufacturers'],
                ['show_charging_stations', 'Show Charging Stations'],
              ] as [keyof typeof config.section_toggles, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.section_toggles[key]}
                    onChange={(e) => setToggle(key, e.target.checked)}
                    className="w-4 h-4 accent-[#145a2c]"
                  />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Homepage Stats */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Homepage Statistics</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {([
                ['total_vehicles', 'Total Vehicles'],
                ['total_manufacturers', 'Total Manufacturers'],
                ['total_charging_stations', 'Charging Stations'],
                ['monthly_visitors', 'Monthly Visitors'],
              ] as [keyof typeof config.homepage_stats, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                  <input
                    type="number"
                    value={config.homepage_stats[key]}
                    onChange={(e) => setStat(key, Number(e.target.value))}
                    className="admin-input"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {([
                ['phone', 'Phone Number', 'tel', '+91 80 4567 8900'],
                ['email', 'Email Address', 'email', 'hello@evmotorhub.in'],
                ['address', 'Address', 'text', 'Bengaluru, Karnataka, India'],
                ['whatsapp', 'WhatsApp Number', 'tel', '+91 XXXXX XXXXX'],
              ] as [keyof typeof config.contact_info, string, string, string][]).map(([key, label, type, placeholder]) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={config.contact_info[key]}
                    onChange={(e) => setContact(key, e.target.value)}
                    className="admin-input"
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Social Media Links</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {([
                ['facebook', 'Facebook URL'],
                ['instagram', 'Instagram URL'],
                ['linkedin', 'LinkedIn URL'],
                ['youtube', 'YouTube URL'],
                ['twitter', 'X / Twitter URL'],
              ] as [keyof typeof config.social_media, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                  <input
                    type="url"
                    value={config.social_media[key]}
                    onChange={(e) => setSocial(key, e.target.value)}
                    className="admin-input"
                    placeholder="https://"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="admin-btn-primary flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
