'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, MessageSquare, Save, Loader as Loader2, CircleHelp as HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SiteConfig } from '@/lib/types';

export default function ContactSettingsPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [contactInfo, setContactInfo] = useState({ email: '', phone: '', address: '', whatsapp: '' });
  const [heroTitle, setHeroTitle] = useState('Get in Touch');
  const [heroSubtitle, setHeroSubtitle] = useState("We'd love to hear from you");
  const [mapEmbedUrl, setMapEmbedUrl] = useState('');

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase.from('site_config').select('*').limit(1);
      if (data && data[0]) {
        const c = data[0] as SiteConfig;
        setConfig(c);
        setContactInfo({ email: c.contact_info?.email || '', phone: c.contact_info?.phone || '', address: c.contact_info?.address || '', whatsapp: c.contact_info?.whatsapp || '' });
        setHeroTitle(c.contact_hero_title || 'Get in Touch');
        setHeroSubtitle(c.contact_hero_subtitle || "We'd love to hear from you");
        setMapEmbedUrl(c.map_embed_url || '');
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
          contact_info: contactInfo,
          contact_hero_title: heroTitle,
          contact_hero_subtitle: heroSubtitle,
          map_embed_url: mapEmbedUrl,
        })
        .eq('id', config.id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Contact settings saved successfully!' });
      toast.success('Contact settings saved successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save settings';
      setMessage({ type: 'error', text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-container flex items-center justify-center py-20">
          <Loader2 size={28} className="text-[#145a2c] animate-spin" />
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
              <MessageSquare size={28} className="text-[#145a2c]" />
              Contact Settings
            </h1>
            <p className="admin-subtitle">Configure the Contact Us page</p>
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Hero Section */}
          <div className="admin-card p-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Hero Section</h3>
            <div className="space-y-4">
              <div>
                <label className="admin-label">Hero Title</label>
                <input type="text" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className="admin-input" />
              </div>
              <div>
                <label className="admin-label">Hero Subtitle</label>
                <input type="text" value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} className="admin-input" />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="admin-card p-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="admin-label flex items-center gap-1.5"><Mail size={12} /> Email</label>
                <input type="email" value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} className="admin-input" />
              </div>
              <div>
                <label className="admin-label flex items-center gap-1.5"><Phone size={12} /> Phone</label>
                <input type="text" value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} className="admin-input" />
              </div>
              <div>
                <label className="admin-label flex items-center gap-1.5"><MapPin size={12} /> Address</label>
                <input type="text" value={contactInfo.address} onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })} className="admin-input" />
              </div>
              <div>
                <label className="admin-label flex items-center gap-1.5">WhatsApp Number</label>
                <input type="text" value={contactInfo.whatsapp} onChange={(e) => setContactInfo({ ...contactInfo, whatsapp: e.target.value })} className="admin-input" placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>
          </div>
        </div>

        {/* Map Embed */}
        <div className="admin-card p-6 mt-6">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Google Map Embed</h3>
          <div>
            <label className="admin-label">Map Embed URL</label>
            <input
              type="text"
              value={mapEmbedUrl}
              onChange={(e) => setMapEmbedUrl(e.target.value)}
              className="admin-input"
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <p className="text-xs text-gray-400 mt-1">Paste the full embed URL from Google Maps Share &gt; Embed a map</p>
          </div>
        </div>

        {/* FAQ - managed from FAQ admin page */}
        <div className="admin-card p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">FAQ Section</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            FAQs displayed on the Contact page are managed centrally from the FAQ Management section. The number of FAQs shown on the contact page is configurable from there.
          </p>
          <Link
            href="/admin/faq"
            className="inline-flex items-center gap-2 text-[#145a2c] text-sm font-medium hover:underline"
          >
            <HelpCircle size={14} />
            Manage FAQs
          </Link>
        </div>
      </div>
    </div>
  );
}
