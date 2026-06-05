'use client';

import { useState, useEffect } from 'react';
import { FileText, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SiteConfig } from '@/lib/types';

export default function NewsSettingsPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [postsPerPage, setPostsPerPage] = useState(12);
  const [showAuthor, setShowAuthor] = useState(true);
  const [showReadTime, setShowReadTime] = useState(true);
  const [defaultCategory, setDefaultCategory] = useState('news');

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase.from('site_config').select('*').limit(1);
      if (data && data[0]) {
        const c = data[0] as SiteConfig;
        setConfig(c);
        const ns = c.news_settings || {};
        setPostsPerPage(ns.posts_per_page || 12);
        setShowAuthor(ns.show_author !== false);
        setShowReadTime(ns.show_read_time !== false);
        setDefaultCategory(ns.default_category || 'news');
      }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('site_config')
        .update({
          news_settings: {
            posts_per_page: postsPerPage,
            show_author: showAuthor,
            show_read_time: showReadTime,
            default_category: defaultCategory,
          },
        })
        .eq('id', config.id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'News settings saved!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-page"><div className="admin-container flex items-center justify-center py-20"><Loader2 size={28} className="text-[#145a2c] animate-spin" /></div></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <FileText size={28} className="text-[#145a2c]" />
              News Settings
            </h1>
            <p className="admin-subtitle">Configure how news articles are displayed</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="admin-btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="admin-card p-6">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Display Settings</h3>
          <div className="space-y-5">
            <div>
              <label className="admin-label">Posts Per Page</label>
              <select value={postsPerPage} onChange={(e) => setPostsPerPage(Number(e.target.value))} className="admin-select">
                {[6, 9, 12, 18, 24].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="admin-label">Default Category for New Articles</label>
              <select value={defaultCategory} onChange={(e) => setDefaultCategory(e.target.value)} className="admin-select">
                {['news', 'review', 'launch', 'comparison', 'guide'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showAuthor} onChange={(e) => setShowAuthor(e.target.checked)} className="w-4 h-4 rounded accent-[#145a2c]" />
              <span className="text-sm font-medium text-gray-700">Show author name on articles</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showReadTime} onChange={(e) => setShowReadTime(e.target.checked)} className="w-4 h-4 rounded accent-[#145a2c]" />
              <span className="text-sm font-medium text-gray-700">Show read time on articles</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
