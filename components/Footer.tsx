'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, MapPin, Phone, Mail, Facebook, Twitter, Youtube, Instagram, Linkedin, Send, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SiteConfig {
  footer_show_social?: boolean;
  footer_show_quick_links?: boolean;
  footer_show_contact?: boolean;
  footer_show_legal?: boolean;
  footer_show_copyright?: boolean;
  footer_show_newsletter?: boolean;
  footer_copyright_text?: string;
  footer_company_name?: string;
  footer_tagline?: string;
  footer_description?: string;
  footer_powered_by_text?: string;
  footer_logo_url?: string;
  footer_custom_links?: { label: string; url: string }[];
  social_media?: Record<string, string>;
  contact_info?: Record<string, string>;
}

const footerLinks = {
  explore: [
    { label: 'Electric Scooters', href: '/vehicles?type=scooter' },
    { label: 'Electric Bikes', href: '/vehicles?type=bike' },
    { label: 'Electric Cars', href: '/vehicles?type=car' },
    { label: 'Charging Stations', href: '/charging-stations' },
  ],
  resources: [
    { label: 'News & Updates', href: '/news' },
    { label: 'EV Blog', href: '/news?category=blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Compare EVs', href: '/compare' },
  ],
  legal: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ],
};

const socialLinks = [
  { icon: Facebook, key: 'facebook', label: 'Facebook' },
  { icon: Twitter, key: 'twitter', label: 'Twitter' },
  { icon: Instagram, key: 'instagram', label: 'Instagram' },
  { icon: Linkedin, key: 'linkedin', label: 'LinkedIn' },
  { icon: Youtube, key: 'youtube', label: 'YouTube' },
];

export default function Footer() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    supabase.from('site_config').select('*').limit(1).then(({ data }) => {
      if (data?.[0]) setConfig(data[0]);
    });
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await supabase.from('email_subscribers').insert([{ email: email.trim() }]);
      setSubscribed(true);
      setEmail('');
    } catch {
      setSubscribed(true);
    }
  };

  const contactInfo = config?.contact_info || {};
  const socialMedia = config?.social_media || {};
  const customLinks = config?.footer_custom_links || [];
  const showLegal = config?.footer_show_legal !== false;
  const showSocial = config?.footer_show_social !== false;
  const showContact = config?.footer_show_contact !== false;
  const showNewsletter = config?.footer_show_newsletter !== false;
  const showCopyright = config?.footer_show_copyright !== false;

  const logoSrc = config?.footer_logo_url || '/EV_logo_White.webp';
  const companyName = config?.footer_company_name || 'EVMotorHub';

  // Build the legal/quick links column from defaults + custom links
  const legalLinks = [...footerLinks.legal, ...customLinks.map(l => ({ label: l.label, href: l.url }))];

  return (
    <footer className="relative bg-[#0a2e14] text-white overflow-hidden">
      {/* Subtle EV-themed circuit pattern background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" aria-hidden="true">
        <svg width="100%" height="100%" viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <path d="M0 320 H200 V200 H400 V100 H600 V250 H800 V180 H1000 V300 H1200" stroke="#22c55e" strokeWidth="2" fill="none" />
          <path d="M0 80 H150 V150 H350 V50 H550 V200 H750 V130 H950 V280 H1200" stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.6" />
          <circle cx="200" cy="200" r="5" fill="#22c55e" />
          <circle cx="400" cy="100" r="5" fill="#22c55e" />
          <circle cx="600" cy="250" r="5" fill="#22c55e" />
          <circle cx="800" cy="180" r="5" fill="#22c55e" />
          <circle cx="1000" cy="300" r="5" fill="#22c55e" />
          <circle cx="150" cy="150" r="4" fill="#22c55e" />
          <circle cx="350" cy="50" r="4" fill="#22c55e" />
          <circle cx="550" cy="200" r="4" fill="#22c55e" />
          <circle cx="750" cy="130" r="4" fill="#22c55e" />
          <circle cx="950" cy="280" r="4" fill="#22c55e" />
        </svg>
      </div>

      {/* Main footer content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Column 1: Brand + Social */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-5">
              <Image
                src={logoSrc}
                alt={companyName}
                width={180}
                height={44}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
              {config?.footer_description || "India's trusted EV marketplace. Research, compare, and find your perfect electric vehicle."}
            </p>
            {showSocial && (
              <div className="flex items-center gap-2">
                {socialLinks.map(({ icon: Icon, key, label }) => {
                  const href = socialMedia[key];
                  if (!href) return null;
                  return (
                    <a
                      key={key}
                      href={href}
                      aria-label={label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-[#145a2c] text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: Explore */}
          <div>
            <h3 className="text-xs font-bold text-green-300 uppercase tracking-wider mb-5">Explore</h3>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-0.5 inline-block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="text-xs font-bold text-green-300 uppercase tracking-wider mb-5">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-0.5 inline-block">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal / Custom Links */}
          {showLegal && (
            <div>
              <h3 className="text-xs font-bold text-green-300 uppercase tracking-wider mb-5">Quick Links</h3>
              <ul className="space-y-3">
                {legalLinks.map((link, i) => (
                  <li key={`${link.href}-${i}`}>
                    <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-0.5 inline-block">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Column 5: Newsletter */}
          {showNewsletter && (
            <div>
              <h3 className="text-xs font-bold text-green-300 uppercase tracking-wider mb-5">Newsletter</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                New launches, prices, and EV news delivered weekly.
              </p>
              {subscribed ? (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-3 text-sm text-green-300">
                  <span className="font-medium">Subscribed!</span> Check your inbox.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#145a2c] focus:ring-1 focus:ring-[#145a2c] transition-all"
                  />
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-[#145a2c] hover:bg-[#0f4020] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200"
                  >
                    <Send size={14} />
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Contact Info Bar */}
        {showContact && (contactInfo.address || contactInfo.email || contactInfo.phone) && (
          <div className="mt-14 pt-8 border-t border-white/10">
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
              {contactInfo.phone && (
                <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                  <Phone size={15} className="text-green-400" />
                  <span>{contactInfo.phone}</span>
                </a>
              )}
              {contactInfo.email && (
                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                  <Mail size={15} className="text-green-400" />
                  <span>{contactInfo.email}</span>
                </a>
              )}
              {contactInfo.address && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin size={15} className="text-green-400" />
                  <span>{contactInfo.address}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      {showCopyright && (
        <div className="relative border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 text-center sm:text-left leading-relaxed">
                {config?.footer_copyright_text || '\u00A9 2024 EVMotorHub. All rights reserved. Prices are ex-showroom & subject to change.'}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Zap size={12} className="text-green-400" />
                <span>{config?.footer_powered_by_text || 'Powered by clean energy data'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
