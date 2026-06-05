'use client';

import { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, MessageSquare, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SiteConfig } from '@/lib/types';

interface FaqItem {
  question: string;
  answer: string;
}

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
  const [faq, setFaq] = useState<FaqItem[]>([]);

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
        setFaq(c.contact_faq || []);
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
          contact_faq: faq,
        })
        .eq('id', config.id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Contact settings saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const addFaq = () => setFaq([...faq, { question: '', answer: '' }]);
  const removeFaq = (idx: number) => setFaq(faq.filter((_, i) => i !== idx));
  const updateFaq = (idx: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faq];
    updated[idx] = { ...updated[idx], [field]: value };
    setFaq(updated);
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

        {/* FAQ */}
        <div className="admin-card p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">FAQ Section</h3>
            <button onClick={addFaq} className="admin-btn-secondary text-xs">
              <Plus size={14} /> Add FAQ
            </button>
          </div>
          <div className="space-y-4">
            {faq.map((item, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                      className="admin-input"
                      placeholder="Question"
                    />
                    <textarea
                      value={item.answer}
                      onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                      className="admin-input resize-none"
                      rows={2}
                      placeholder="Answer"
                    />
                  </div>
                  <button onClick={() => removeFaq(idx)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {faq.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No FAQ items yet. Click &quot;Add FAQ&quot; to create one.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
