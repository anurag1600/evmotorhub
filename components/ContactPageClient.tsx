'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, Zap, Shield, Users, CircleCheck as CheckCircle, Loader as Loader2, ChevronDown } from 'lucide-react';
import { SiteConfig, FAQItem } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const defaultContactInfo = {
  email: 'hello@evmotorhub.in',
  phone: '+91 80 4567 8900',
  address: 'Bengaluru, Karnataka, India',
  whatsapp: '',
};

const DEFAULT_CONTACT_FAQ_LIMIT = 4;

export default function ContactPageClient() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

  const contactInfo = siteConfig?.contact_info || defaultContactInfo;
  const heroTitle = siteConfig?.contact_hero_title || 'Get in Touch';
  const heroSubtitle = siteConfig?.contact_hero_subtitle || "We'd love to hear from you";
  const mapEmbedUrl = siteConfig?.map_embed_url;

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);

  useEffect(() => {
    supabase.from('site_config').select('*').limit(1).then(({ data }) => {
      if (data && data.length > 0) setSiteConfig(data[0] as SiteConfig);
    });

    const limit = siteConfig
      ? (siteConfig as any).faq_contact_limit || DEFAULT_CONTACT_FAQ_LIMIT
      : DEFAULT_CONTACT_FAQ_LIMIT;
    supabase
      .from('faq_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit)
      .then(({ data }) => setFaqItems((data as FAQItem[]) || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { error: dbError } = await supabase.from('contact_submissions').insert([{
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        subject: form.subject,
        message: form.message,
        status: 'new',
      }]);
      if (dbError) throw dbError;

      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#0a2e14] to-[#145a2c] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-400 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare size={28} className="text-green-300" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{heroTitle}</h1>
          </div>
          <p className="text-green-200 text-lg max-w-xl">{heroSubtitle}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Send Us a Message</h2>
              <p className="text-sm text-gray-500 mb-6">Fill out the form and we will get back to you within 24 hours.</p>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-600 mb-6">Thank you for reaching out. We will respond shortly.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-[#145a2c] font-medium text-sm hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (Optional)</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                      <select
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c] focus:border-transparent bg-white"
                        required
                      >
                        <option value="">Select a topic</option>
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Vehicle Listing">Vehicle Listing</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Advertising">Advertising</option>
                        <option value="Bug Report">Bug Report</option>
                        <option value="Feature Request">Feature Request</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c] focus:border-transparent resize-none"
                      placeholder="Tell us how we can help..."
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#145a2c] hover:bg-[#0f4020] text-white px-8 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-[#145a2c]" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Email</div>
                    <a href={`mailto:${contactInfo.email}`} className="text-sm font-medium text-gray-900 hover:text-[#145a2c]">
                      {contactInfo.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Phone size={16} className="text-[#145a2c]" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Phone</div>
                    <a href={`tel:${contactInfo.phone}`} className="text-sm font-medium text-gray-900 hover:text-[#145a2c]">
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-[#145a2c]" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Address</div>
                    <div className="text-sm font-medium text-gray-900">{contactInfo.address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Clock size={16} className="text-[#145a2c]" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Response Time</div>
                    <div className="text-sm font-medium text-gray-900">Within 24 hours</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-[#0f4020] to-[#145a2c] rounded-2xl p-6 text-white">
              <h3 className="text-base font-bold mb-4 text-green-200">Why Reach Out</h3>
              <div className="space-y-3">
                {[
                  { icon: Zap, text: 'Expert EV advice from our team' },
                  { icon: Shield, text: 'Verified data from official sources' },
                  { icon: Users, text: 'Community of 2M+ EV enthusiasts' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                    <Icon size={18} className="text-green-300 flex-shrink-0" />
                    <span className="text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        {mapEmbedUrl && (
          <div className="mt-10 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-[#145a2c]" />
                Our Location
              </h2>
            </div>
            <iframe
              src={mapEmbedUrl}
              width="100%"
              height="350"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Office Location"
            />
          </div>
        )}

        {/* FAQ - pulled from database */}
        {faqItems.length > 0 && (
          <div className="mt-10">
            <div className="text-center mb-8">
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-1">FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-3">
              {faqItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="text-sm font-semibold text-gray-900 pr-4">{item.question}</span>
                    <ChevronDown
                      size={18}
                      className={cn('text-gray-400 flex-shrink-0 transition-transform', openFaq === item.id && 'rotate-180')}
                    />
                  </button>
                  {openFaq === item.id && (
                    <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
