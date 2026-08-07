'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Chrome as Home, Save, Loader as Loader2, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ImageUpload';

interface SiteConfig {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_cta_text: string;
  hero_cta_url: string;
  hero_badge_text: string;
  hero_cta2_text: string;
  hero_cta2_url: string;
  hero_right_main_image: string;
  hero_right_secondary_images: string[];
  section_toggles: {
    show_featured_vehicles: boolean;
    show_latest_news: boolean;
    show_manufacturers: boolean;
    show_charging_stations: boolean;
  };
}

const defaultConfig: SiteConfig = {
  id: '',
  hero_title: "Discover India's Best Electric Vehicles",
  hero_subtitle: 'Smarter. Greener. Better.',
  hero_description: 'Compare 50+ EV models, calculate EMI, and find charging stations near you.',
  hero_cta_text: 'Explore Vehicles',
  hero_cta_url: '/vehicles',
  hero_badge_text: '',
  hero_cta2_text: '',
  hero_cta2_url: '',
  hero_right_main_image: '',
  hero_right_secondary_images: [],
  section_toggles: {
    show_featured_vehicles: true,
    show_latest_news: true,
    show_manufacturers: true,
    show_charging_stations: true,
  },
};

export default function HomepageSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [newsPostsPerPage, setNewsPostsPerPage] = useState(12);
  const [newsShowAuthor, setNewsShowAuthor] = useState(true);
  const [newsShowReadTime, setNewsShowReadTime] = useState(true);
  const [newsDefaultCategory, setNewsDefaultCategory] = useState('news');
  const [vehicleDefaultSort, setVehicleDefaultSort] = useState('price_asc');
  const [vehicleShowUpcoming, setVehicleShowUpcoming] = useState(true);
  const [vehicleShowPriceRange, setVehicleShowPriceRange] = useState(true);
  const [vehicleCompareMax, setVehicleCompareMax] = useState(2);

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
        });
        const ns = data.news_settings || {};
        setNewsPostsPerPage(ns.posts_per_page || 12);
        setNewsShowAuthor(ns.show_author !== false);
        setNewsShowReadTime(ns.show_read_time !== false);
        setNewsDefaultCategory(ns.default_category || 'news');
        const vs = data.vehicle_settings || {};
        setVehicleDefaultSort(vs.default_sort || 'price_asc');
        setVehicleShowUpcoming(vs.show_upcoming !== false);
        setVehicleShowPriceRange(vs.show_price_range !== false);
        setVehicleCompareMax(vs.compare_max_vehicles || 2);
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
      const fullUpdateData = {
        ...updateData,
        news_settings: {
          posts_per_page: newsPostsPerPage,
          show_author: newsShowAuthor,
          show_read_time: newsShowReadTime,
          default_category: newsDefaultCategory,
        },
        vehicle_settings: {
          default_sort: vehicleDefaultSort,
          show_upcoming: vehicleShowUpcoming,
          show_price_range: vehicleShowPriceRange,
          compare_max_vehicles: vehicleCompareMax,
        },
      };
      const { error: err } = id
        ? await supabase.from('site_config').update(fullUpdateData).eq('id', id)
        : await supabase.from('site_config').update(fullUpdateData).select();

      if (err) throw err;
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      toast.success('Settings saved successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const setToggle = (key: keyof typeof config.section_toggles, val: boolean) =>
    setConfig({ ...config, section_toggles: { ...config.section_toggles, [key]: val } });

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
            <p className="admin-subtitle">Configure hero section and section visibility</p>
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
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Badge Text</label>
              <input
                type="text"
                value={config.hero_badge_text}
                onChange={(e) => setConfig({ ...config, hero_badge_text: e.target.value })}
                className="admin-input"
                placeholder="e.g. India's EV Revolution is Here"
              />
              <p className="text-xs text-gray-500 mt-1">Shown as a small badge above the title</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Secondary CTA Text</label>
                <input
                  type="text"
                  value={config.hero_cta2_text}
                  onChange={(e) => setConfig({ ...config, hero_cta2_text: e.target.value })}
                  className="admin-input"
                  placeholder="e.g. Compare EVs"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Secondary CTA Link</label>
                <input
                  type="text"
                  value={config.hero_cta2_url}
                  onChange={(e) => setConfig({ ...config, hero_cta2_url: e.target.value })}
                  className="admin-input"
                  placeholder="/compare"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hero Right - Main Image</label>
              <ImageUpload
                bucket="hero-images"
                onImageUrl={(url) => setConfig({ ...config, hero_right_main_image: url })}
                currentImageUrl={config.hero_right_main_image}
                label="Main Hero Image (right side)"
                recommendedWidth={800}
                recommendedHeight={600}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hero Right - Secondary Images</label>
              <div className="space-y-3">
                {(config.hero_right_secondary_images || []).map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <img src={url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <span className="text-xs text-gray-500 truncate flex-1">{url.split('/').pop()}</span>
                    <button type="button" onClick={() => setConfig({ ...config, hero_right_secondary_images: config.hero_right_secondary_images.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
                  </div>
                ))}
                <ImageUpload
                  bucket="hero-images"
                  onImageUrl={(url) => setConfig({ ...config, hero_right_secondary_images: [...(config.hero_right_secondary_images || []), url] })}
                  currentImageUrl=""
                  label="Add Secondary Image (max 2)"
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

          {/* News Display Settings */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">News Display Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Posts Per Page</label>
                <select value={newsPostsPerPage} onChange={(e) => setNewsPostsPerPage(Number(e.target.value))} className="admin-select">
                  {[6, 9, 12, 18, 24].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default Category for New Articles</label>
                <select value={newsDefaultCategory} onChange={(e) => setNewsDefaultCategory(e.target.value)} className="admin-select">
                  {['news', 'review', 'launch', 'comparison', 'guide'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={newsShowAuthor} onChange={(e) => setNewsShowAuthor(e.target.checked)} className="w-4 h-4 accent-[#145a2c]" />
                <span className="text-sm font-medium text-gray-700">Show author name on articles</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={newsShowReadTime} onChange={(e) => setNewsShowReadTime(e.target.checked)} className="w-4 h-4 accent-[#145a2c]" />
                <span className="text-sm font-medium text-gray-700">Show read time on articles</span>
              </label>
            </div>
          </div>

          {/* Vehicle Display Settings */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Vehicle Display Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default Sort Order</label>
                <select value={vehicleDefaultSort} onChange={(e) => setVehicleDefaultSort(e.target.value)} className="admin-select">
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="range_desc">Range: Highest First</option>
                  <option value="speed_desc">Top Speed: Highest First</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Vehicles in Comparison</label>
                <select value={vehicleCompareMax} onChange={(e) => setVehicleCompareMax(Number(e.target.value))} className="admin-select">
                  <option value={2}>2 vehicles</option>
                  <option value={3}>3 vehicles</option>
                  <option value={4}>4 vehicles</option>
                </select>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={vehicleShowUpcoming} onChange={(e) => setVehicleShowUpcoming(e.target.checked)} className="w-4 h-4 accent-[#145a2c]" />
                <span className="text-sm font-medium text-gray-700">Show upcoming vehicles in listings</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={vehicleShowPriceRange} onChange={(e) => setVehicleShowPriceRange(e.target.checked)} className="w-4 h-4 accent-[#145a2c]" />
                <span className="text-sm font-medium text-gray-700">Show price range (min-max) instead of starting price only</span>
              </label>
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
