'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Save, Loader as Loader2, CircleAlert as AlertCircle, CircleCheck as CheckCircle, FileText, Globe, Code, Shield, ChartBar as BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

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
  gtm_id: string;
  meta_pixel_id: string;
  clarity_id: string;
  google_ads_id: string;
  custom_head_scripts: string;
  custom_footer_scripts: string;
  sitemap_enabled: boolean;
  sitemap_include_vehicles: boolean;
  sitemap_include_manufacturers: boolean;
  sitemap_include_charging: boolean;
  sitemap_include_news: boolean;
  sitemap_include_cms: boolean;
  canonical_url: string;
  force_https_canonical: boolean;
  index_vehicles: boolean;
  index_manufacturers: boolean;
  index_news: boolean;
  index_comparisons: boolean;
  index_search: boolean;
  schema_organization: Record<string, any>;
  schema_website: boolean;
  schema_vehicle: boolean;
  schema_article: boolean;
  schema_faq: boolean;
  schema_breadcrumb: boolean;
  auto_alt_text: boolean;
  image_lazy_loading: boolean;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_linkedin: string;
  social_youtube: string;
  redirect_rules: { from: string; to: string; type: number }[];
}

const defaultSeo: SeoSettings = {
  id: '',
  site_name: 'EVMotorHub',
  site_description: "India's most trusted EV marketplace",
  meta_title: 'EVMotorHub - Compare Electric Vehicles in India',
  meta_description: "Compare 50+ EV models, calculate EMI, find charging stations. India's #1 EV marketplace.",
  og_title: '',
  og_description: '',
  default_og_image: '',
  twitter_handle: '@evmotorhub',
  twitter_card: 'summary_large_image',
  google_analytics_id: '',
  google_search_console_id: '',
  favicon_url: '/Fav_(1).png',
  robots_txt: 'User-agent: *\nAllow: /',
  gtm_id: '',
  meta_pixel_id: '',
  clarity_id: '',
  google_ads_id: '',
  custom_head_scripts: '',
  custom_footer_scripts: '',
  sitemap_enabled: true,
  sitemap_include_vehicles: true,
  sitemap_include_manufacturers: true,
  sitemap_include_charging: true,
  sitemap_include_news: true,
  sitemap_include_cms: true,
  canonical_url: '',
  force_https_canonical: true,
  index_vehicles: true,
  index_manufacturers: true,
  index_news: true,
  index_comparisons: true,
  index_search: false,
  schema_organization: {},
  schema_website: true,
  schema_vehicle: true,
  schema_article: true,
  schema_faq: true,
  schema_breadcrumb: true,
  auto_alt_text: true,
  image_lazy_loading: true,
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  social_linkedin: '',
  social_youtube: '',
  redirect_rules: [],
};

interface AuditIssue { type: 'error' | 'warning'; page: string; field: string; message: string; }

export default function SEOSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [seo, setSeo] = useState<SeoSettings>(defaultSeo);
  const [activeTab, setActiveTab] = useState('general');
  const [auditIssues, setAuditIssues] = useState<AuditIssue[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => { fetchSeo(); }, []);

  const fetchSeo = async () => {
    try {
      const { data, error: err } = await supabase.from('seo_settings').select('*').maybeSingle();
      if (err) throw err;
      if (data) setSeo({ ...defaultSeo, ...data, redirect_rules: data.redirect_rules || [], schema_organization: data.schema_organization || {} });
    } catch (err: any) {
      setError('Failed to load SEO settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    setAuditLoading(true);
    const issues: AuditIssue[] = [];
    try {
      const [vehicles, manufacturers, news] = await Promise.all([
        supabase.from('vehicles').select('id, name, seo_title, seo_description, image_url').limit(50),
        supabase.from('manufacturers').select('id, name, logo_url').limit(50),
        supabase.from('news').select('id, title, image_url, author_image').limit(50),
      ]);
      (vehicles.data || []).forEach((v: any) => {
        if (!v.seo_title) issues.push({ type: 'warning', page: v.name, field: 'Meta Title', message: 'Missing SEO title' });
        if (!v.seo_description) issues.push({ type: 'warning', page: v.name, field: 'Meta Description', message: 'Missing SEO description' });
        if (!v.image_url) issues.push({ type: 'error', page: v.name, field: 'Image', message: 'Missing image' });
      });
      (manufacturers.data || []).forEach((m: any) => {
        if (!m.logo_url) issues.push({ type: 'error', page: m.name, field: 'Logo', message: 'Missing logo image' });
      });
      (news.data || []).forEach((n: any) => {
        if (!n.image_url) issues.push({ type: 'error', page: n.title, field: 'Image', message: 'Missing cover image' });
      });
      if (!seo.meta_title) issues.push({ type: 'error', page: 'Global', field: 'Meta Title', message: 'Missing default meta title' });
      if (!seo.meta_description) issues.push({ type: 'error', page: 'Global', field: 'Meta Description', message: 'Missing default meta description' });
      if (!seo.default_og_image) issues.push({ type: 'warning', page: 'Global', field: 'OG Image', message: 'Missing default OG image' });
    } catch { /* ignore */ }
    setAuditIssues(issues);
    setAuditLoading(false);
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
      toast.success('SEO settings saved successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save SEO settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof SeoSettings) => setSeo({ ...seo, [key]: !seo[key] });

  const tabs = [
    { id: 'general', label: 'General', icon: Search },
    { id: 'sitemap', label: 'Sitemap', icon: FileText },
    { id: 'indexing', label: 'Indexing', icon: Shield },
    { id: 'schema', label: 'Schema', icon: Code },
    { id: 'social', label: 'Social', icon: Globe },
    { id: 'audit', label: 'Audit', icon: BarChart3 },
  ];

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
            <p className="admin-subtitle">Manage meta tags, analytics, sitemap, schema, and indexing</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === id ? 'border-[#145a2c] text-[#145a2c]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
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

          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <>
              <div className="admin-card p-6 space-y-4">
                <h2 className="text-lg font-bold border-b pb-3">Site Identity</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Site Name</label>
                    <input type="text" value={seo.site_name} onChange={(e) => setSeo({ ...seo, site_name: e.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Favicon URL</label>
                    <input type="text" value={seo.favicon_url} onChange={(e) => setSeo({ ...seo, favicon_url: e.target.value })} className="admin-input" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Site Description</label>
                  <textarea value={seo.site_description} onChange={(e) => setSeo({ ...seo, site_description: e.target.value })} className="admin-input" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Global Canonical URL</label>
                  <input type="text" value={seo.canonical_url} onChange={(e) => setSeo({ ...seo, canonical_url: e.target.value })} className="admin-input" placeholder="https://evmotorhub.in" />
                  <p className="text-xs text-gray-500 mt-1">Sets the preferred domain for all pages</p>
                </div>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={seo.force_https_canonical} onChange={() => toggle('force_https_canonical')} className="w-4 h-4 accent-[#145a2c]" />
                  <span className="text-sm font-medium text-gray-700">Force HTTPS canonical URLs</span>
                </label>
              </div>

              <div className="admin-card p-6 space-y-4">
                <h2 className="text-lg font-bold border-b pb-3">Default Meta Tags</h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default Meta Title</label>
                  <input type="text" value={seo.meta_title} onChange={(e) => setSeo({ ...seo, meta_title: e.target.value })} className="admin-input" />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 50-60 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default Meta Description</label>
                  <textarea value={seo.meta_description} onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })} className="admin-input" rows={2} />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 150-160 characters</p>
                </div>
              </div>

              <div className="admin-card p-6 space-y-4">
                <h2 className="text-lg font-bold border-b pb-3">Open Graph</h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">OG Title</label>
                  <input type="text" value={seo.og_title} onChange={(e) => setSeo({ ...seo, og_title: e.target.value })} className="admin-input" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">OG Description</label>
                  <textarea value={seo.og_description} onChange={(e) => setSeo({ ...seo, og_description: e.target.value })} className="admin-input" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default OG Image</label>
                  <input type="text" value={seo.default_og_image} onChange={(e) => setSeo({ ...seo, default_og_image: e.target.value })} className="admin-input" placeholder="https://... (1200x630px)" />
                </div>
              </div>

              <div className="admin-card p-6 space-y-4">
                <h2 className="text-lg font-bold border-b pb-3">X / Twitter Card</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Twitter Handle</label>
                    <input type="text" value={seo.twitter_handle} onChange={(e) => setSeo({ ...seo, twitter_handle: e.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Card Type</label>
                    <select value={seo.twitter_card} onChange={(e) => setSeo({ ...seo, twitter_card: e.target.value })} className="admin-input">
                      <option value="summary">Summary</option>
                      <option value="summary_large_image">Summary with Large Image</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="admin-card p-6 space-y-4">
                <h2 className="text-lg font-bold border-b pb-3">Analytics &amp; Tracking</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Google Analytics ID</label>
                    <input type="text" value={seo.google_analytics_id} onChange={(e) => setSeo({ ...seo, google_analytics_id: e.target.value })} className="admin-input" placeholder="G-XXXXXXXXXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Google Search Console</label>
                    <input type="text" value={seo.google_search_console_id} onChange={(e) => setSeo({ ...seo, google_search_console_id: e.target.value })} className="admin-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Google Tag Manager ID</label>
                    <input type="text" value={seo.gtm_id} onChange={(e) => setSeo({ ...seo, gtm_id: e.target.value })} className="admin-input" placeholder="GTM-XXXXXXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Meta Pixel ID</label>
                    <input type="text" value={seo.meta_pixel_id} onChange={(e) => setSeo({ ...seo, meta_pixel_id: e.target.value })} className="admin-input" placeholder="123456789012345" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Microsoft Clarity ID</label>
                    <input type="text" value={seo.clarity_id} onChange={(e) => setSeo({ ...seo, clarity_id: e.target.value })} className="admin-input" placeholder="abcd1234efgh5678" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Google Ads Conversion ID</label>
                    <input type="text" value={seo.google_ads_id} onChange={(e) => setSeo({ ...seo, google_ads_id: e.target.value })} className="admin-input" placeholder="AW-123456789" />
                  </div>
                </div>
              </div>

              <div className="admin-card p-6 space-y-4">
                <h2 className="text-lg font-bold border-b pb-3">Custom Scripts</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  Scripts are injected globally. Use with caution - invalid scripts can break the site.
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Custom Header Scripts</label>
                  <textarea value={seo.custom_head_scripts} onChange={(e) => setSeo({ ...seo, custom_head_scripts: e.target.value })} className="admin-input font-mono text-xs" rows={4} />
                  <p className="text-xs text-gray-500 mt-1">Injected inside &lt;head&gt;</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Custom Footer Scripts</label>
                  <textarea value={seo.custom_footer_scripts} onChange={(e) => setSeo({ ...seo, custom_footer_scripts: e.target.value })} className="admin-input font-mono text-xs" rows={4} />
                  <p className="text-xs text-gray-500 mt-1">Injected before &lt;/body&gt;</p>
                </div>
              </div>

              <div className="admin-card p-6 space-y-4">
                <h2 className="text-lg font-bold border-b pb-3">Robots.txt</h2>
                <textarea value={seo.robots_txt} onChange={(e) => setSeo({ ...seo, robots_txt: e.target.value })} className="admin-input font-mono text-sm" rows={4} />
              </div>

              <div className="admin-card p-6 space-y-4">
                <h2 className="text-lg font-bold border-b pb-3">Image SEO</h2>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={seo.auto_alt_text} onChange={() => toggle('auto_alt_text')} className="w-4 h-4 accent-[#145a2c]" />
                  <span className="text-sm font-medium text-gray-700">Auto-generate alt text for images (vehicle name, article title)</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={seo.image_lazy_loading} onChange={() => toggle('image_lazy_loading')} className="w-4 h-4 accent-[#145a2c]" />
                  <span className="text-sm font-medium text-gray-700">Enable lazy loading for below-fold images</span>
                </label>
              </div>
            </>
          )}

          {/* SITEMAP TAB */}
          {activeTab === 'sitemap' && (
            <div className="admin-card p-6 space-y-4">
              <h2 className="text-lg font-bold border-b pb-3">Sitemap Management</h2>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={seo.sitemap_enabled} onChange={() => toggle('sitemap_enabled')} className="w-4 h-4 accent-[#145a2c]" />
                <span className="text-sm font-medium text-gray-700">Enable XML Sitemap</span>
              </label>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                Sitemap is auto-generated at <code className="bg-blue-100 px-1.5 py-0.5 rounded">/sitemap.xml</code> based on the sections selected below.
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Include in Sitemap:</p>
                {[
                  { key: 'sitemap_include_vehicles' as const, label: 'Vehicle Pages' },
                  { key: 'sitemap_include_manufacturers' as const, label: 'Manufacturer Pages' },
                  { key: 'sitemap_include_charging' as const, label: 'Charging Station Pages' },
                  { key: 'sitemap_include_news' as const, label: 'News Articles' },
                  { key: 'sitemap_include_cms' as const, label: 'CMS Pages (About, Privacy, Terms, etc.)' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={seo[key] as boolean} onChange={() => toggle(key)} className="w-4 h-4 accent-[#145a2c]" />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* INDEXING TAB */}
          {activeTab === 'indexing' && (
            <div className="admin-card p-6 space-y-4">
              <h2 className="text-lg font-bold border-b pb-3">Indexing Controls</h2>
              <p className="text-xs text-gray-500">Control which page types search engines can index. Disabled pages get <code className="bg-gray-100 px-1 py-0.5 rounded">noindex</code> meta tags.</p>
              <div className="space-y-2">
                {[
                  { key: 'index_vehicles' as const, label: 'Vehicle Pages', desc: 'Allow indexing of vehicle detail pages' },
                  { key: 'index_manufacturers' as const, label: 'Manufacturer Pages', desc: 'Allow indexing of brand pages' },
                  { key: 'index_news' as const, label: 'News Articles', desc: 'Allow indexing of news/review pages' },
                  { key: 'index_comparisons' as const, label: 'Comparison Pages', desc: 'Allow indexing of comparison pages' },
                  { key: 'index_search' as const, label: 'Search Results', desc: 'Allow indexing of search/filter pages (not recommended)' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    <input type="checkbox" checked={seo[key] as boolean} onChange={() => toggle(key)} className="w-4 h-4 accent-[#145a2c]" />
                  </label>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Redirect Rules</h3>
                <div className="space-y-2 mb-3">
                  {(seo.redirect_rules || []).map((rule, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={rule.from} readOnly className="admin-input text-xs flex-1" />
                      <span className="text-xs text-gray-400">{rule.type === 301 ? '301' : '302'}</span>
                      <input type="text" value={rule.to} readOnly className="admin-input text-xs flex-1" />
                      <button type="button" onClick={() => setSeo({ ...seo, redirect_rules: seo.redirect_rules.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 items-end">
                  <input type="text" placeholder="From URL (/old-page)" className="admin-input text-xs flex-1" id="redirect-from" />
                  <select className="admin-input text-xs w-20" id="redirect-type">
                    <option value="301">301</option>
                    <option value="302">302</option>
                  </select>
                  <input type="text" placeholder="To URL (/new-page)" className="admin-input text-xs flex-1" id="redirect-to" />
                  <button type="button" onClick={() => {
                    const from = (document.getElementById('redirect-from') as HTMLInputElement)?.value;
                    const to = (document.getElementById('redirect-to') as HTMLInputElement)?.value;
                    const type = parseInt((document.getElementById('redirect-type') as HTMLSelectElement)?.value || '301');
                    if (from && to) {
                      setSeo({ ...seo, redirect_rules: [...(seo.redirect_rules || []), { from, to, type }] });
                      (document.getElementById('redirect-from') as HTMLInputElement).value = '';
                      (document.getElementById('redirect-to') as HTMLInputElement).value = '';
                    }
                  }} className="admin-btn-secondary text-xs py-2 px-3">Add</button>
                </div>
              </div>
            </div>
          )}

          {/* SCHEMA TAB */}
          {activeTab === 'schema' && (
            <div className="admin-card p-6 space-y-4">
              <h2 className="text-lg font-bold border-b pb-3">Structured Data (Schema.org)</h2>
              <p className="text-xs text-gray-500">Enable structured data markup for better search engine understanding and rich results.</p>
              <div className="space-y-2">
                {[
                  { key: 'schema_website' as const, label: 'Website Schema', desc: 'Site name, URL, search action' },
                  { key: 'schema_vehicle' as const, label: 'Vehicle Schema', desc: 'Product schema on vehicle pages with price, specs' },
                  { key: 'schema_article' as const, label: 'Article Schema', desc: 'NewsArticle schema on news pages' },
                  { key: 'schema_faq' as const, label: 'FAQ Schema', desc: 'FAQPage schema on FAQ pages' },
                  { key: 'schema_breadcrumb' as const, label: 'Breadcrumb Schema', desc: 'BreadcrumbList on all pages' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    <input type="checkbox" checked={seo[key] as boolean} onChange={() => toggle(key)} className="w-4 h-4 accent-[#145a2c]" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* SOCIAL TAB */}
          {activeTab === 'social' && (
            <div className="admin-card p-6 space-y-4">
              <h2 className="text-lg font-bold border-b pb-3">Social Media SEO</h2>
              <p className="text-xs text-gray-500">These URLs are added to the Organization schema sameAs property for search engine verification.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Facebook</label>
                  <input type="url" value={seo.social_facebook} onChange={(e) => setSeo({ ...seo, social_facebook: e.target.value })} className="admin-input" placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Instagram</label>
                  <input type="url" value={seo.social_instagram} onChange={(e) => setSeo({ ...seo, social_instagram: e.target.value })} className="admin-input" placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">X / Twitter</label>
                  <input type="url" value={seo.social_twitter} onChange={(e) => setSeo({ ...seo, social_twitter: e.target.value })} className="admin-input" placeholder="https://x.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">LinkedIn</label>
                  <input type="url" value={seo.social_linkedin} onChange={(e) => setSeo({ ...seo, social_linkedin: e.target.value })} className="admin-input" placeholder="https://linkedin.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">YouTube</label>
                  <input type="url" value={seo.social_youtube} onChange={(e) => setSeo({ ...seo, social_youtube: e.target.value })} className="admin-input" placeholder="https://youtube.com/..." />
                </div>
              </div>
            </div>
          )}

          {/* AUDIT TAB */}
          {activeTab === 'audit' && (
            <div className="admin-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-lg font-bold">SEO Audit Dashboard</h2>
                <button type="button" onClick={runAudit} disabled={auditLoading} className="admin-btn-primary flex items-center gap-2 text-sm">
                  {auditLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  {auditLoading ? 'Scanning...' : 'Run Audit'}
                </button>
              </div>
              {auditIssues.length === 0 && !auditLoading && (
                <div className="text-center py-10 text-gray-500 text-sm">
                  Click &quot;Run Audit&quot; to scan for missing SEO fields across your content.
                </div>
              )}
              {auditIssues.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{auditIssues.filter(i => i.type === 'error').length}</div>
                      <div className="text-xs text-red-700">Errors</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-amber-600">{auditIssues.filter(i => i.type === 'warning').length}</div>
                      <div className="text-xs text-amber-700">Warnings</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{auditIssues.length}</div>
                      <div className="text-xs text-green-700">Total Issues</div>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-96 overflow-y-auto">
                    {auditIssues.map((issue, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg text-sm ${issue.type === 'error' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                        <AlertCircle size={14} className={issue.type === 'error' ? 'text-red-500' : 'text-amber-500'} />
                        <span className="font-medium text-gray-900 flex-shrink-0">{issue.page}</span>
                        <span className="text-gray-500 flex-1">{issue.field}: {issue.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
