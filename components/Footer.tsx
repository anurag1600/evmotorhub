'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, MapPin, Phone, Mail, Facebook, Twitter, Youtube, Instagram, Linkedin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const defaultFooterLinks = {
  vehicles: [
    { label: 'Electric Scooters', href: '/vehicles?type=scooter' },
    { label: 'Electric Bikes', href: '/vehicles?type=bike' },
    { label: 'Electric Cars', href: '/vehicles?type=car' },
    { label: 'Upcoming EVs', href: '/vehicles?upcoming=true' },
    { label: 'Compare EVs', href: '/compare' },
  ],
  resources: [
    { label: 'Latest News', href: '/news' },
    { label: 'EV Reviews', href: '/news?category=review' },
    { label: 'Buyer Guides', href: '/news?category=guide' },
    { label: 'EMI Calculator', href: '/emi-calculator' },
    { label: 'Charging Stations', href: '/charging-stations' },
  ],
  brands: [
    { label: 'Ola Electric', href: '/manufacturers/ola-electric' },
    { label: 'Ather Energy', href: '/manufacturers/ather-energy' },
    { label: 'Tata Motors', href: '/manufacturers/tata-motors' },
    { label: 'TVS Motor', href: '/manufacturers/tvs-motor' },
    { label: 'All Brands', href: '/manufacturers' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ],
};

const defaultCities = [
  'Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat',
  'Rajasthan', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Pune'
];

interface FooterConfig {
  footer_show_social: boolean;
  footer_show_quick_links: boolean;
  footer_show_contact: boolean;
  footer_show_legal: boolean;
  footer_show_copyright: boolean;
  footer_show_newsletter: boolean;
  footer_copyright_text: string;
  footer_custom_links: { label: string; url: string }[];
  social_media: Record<string, string>;
  contact_info: Record<string, string>;
}

export default function Footer() {
  const [config, setConfig] = useState<FooterConfig | null>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    supabase.from('site_config').select('*').limit(1).then(({ data }) => {
      if (data?.[0]) {
        setConfig({
          footer_show_social: data[0].footer_show_social !== false,
          footer_show_quick_links: data[0].footer_show_quick_links !== false,
          footer_show_contact: data[0].footer_show_contact !== false,
          footer_show_legal: data[0].footer_show_legal !== false,
          footer_show_copyright: data[0].footer_show_copyright !== false,
          footer_show_newsletter: data[0].footer_show_newsletter !== false,
          footer_copyright_text: data[0].footer_copyright_text || '',
          footer_custom_links: data[0].footer_custom_links || [],
          social_media: data[0].social_media || {},
          contact_info: data[0].contact_info || {},
        });
      }
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

  const socialLinks = [
    { icon: Facebook, key: 'facebook', label: 'Facebook' },
    { icon: Twitter, key: 'twitter', label: 'Twitter' },
    { icon: Instagram, key: 'instagram', label: 'Instagram' },
    { icon: Linkedin, key: 'linkedin', label: 'LinkedIn' },
    { icon: Youtube, key: 'youtube', label: 'YouTube' },
  ];

  const showSocial = config?.footer_show_social !== false;
  const showQuickLinks = config?.footer_show_quick_links !== false;
  const showContact = config?.footer_show_contact !== false;
  const showLegal = config?.footer_show_legal !== false;
  const showCopyright = config?.footer_show_copyright !== false;
  const showNewsletter = config?.footer_show_newsletter !== false;

  const contactInfo = config?.contact_info || {};
  const socialMedia = config?.social_media || {};

  return (
    <footer className="bg-[#0a2e14] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/EV_logo_White.png"
                alt="EVMotorHub"
                width={180}
                height={45}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5 max-w-xs">
              India&apos;s most trusted EV marketplace. Research, compare, and discover the best electric vehicles for your lifestyle and budget.
            </p>

            {showContact && (
              <div className="space-y-2 text-sm text-gray-400 mb-6">
                {contactInfo.address && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-green-400 flex-shrink-0" />
                    <span>{contactInfo.address}</span>
                  </div>
                )}
                {contactInfo.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-green-400 flex-shrink-0" />
                    <a href={`mailto:${contactInfo.email}`} className="hover:text-green-400 transition-colors">{contactInfo.email}</a>
                  </div>
                )}
                {contactInfo.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-green-400 flex-shrink-0" />
                    <span>{contactInfo.phone}</span>
                  </div>
                )}
              </div>
            )}

            {showSocial && (
              <div className="flex items-center gap-3">
                {socialLinks.map(({ icon: Icon, key, label }) => {
                  const href = socialMedia[key];
                  if (!href) return null;
                  return (
                    <a key={key} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-green-600 transition-colors">
                      <Icon size={15} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {showQuickLinks && (
            <>
              {/* Vehicles */}
              <div>
                <h3 className="text-sm font-semibold text-green-300 uppercase tracking-wider mb-4">Vehicles</h3>
                <ul className="space-y-2.5">
                  {defaultFooterLinks.vehicles.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-gray-400 hover:text-green-300 transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-sm font-semibold text-green-300 uppercase tracking-wider mb-4">Resources</h3>
                <ul className="space-y-2.5">
                  {defaultFooterLinks.resources.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-gray-400 hover:text-green-300 transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="text-sm font-semibold text-green-300 uppercase tracking-wider mb-4">Company</h3>
                <ul className="space-y-2.5">
                  {defaultFooterLinks.company.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-gray-400 hover:text-green-300 transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Newsletter */}
          {showNewsletter && (
            <div className={showQuickLinks ? '' : 'lg:col-span-2'}>
              <h3 className="text-sm font-semibold text-green-300 uppercase tracking-wider mb-4">Stay Updated</h3>
              <p className="text-sm text-gray-400 mb-4">New launches, price drops, subsidies - delivered weekly.</p>
              {subscribed ? (
                <div className="bg-green-500/20 text-green-300 px-4 py-3 rounded-lg text-sm">
                  Subscribed! Check your inbox.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    required
                    className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                  />
                  <button type="submit" className="bg-[#145a2c] hover:bg-[#0f4020] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Subscribe
                  </button>
                </form>
              )}
              {/* Custom Links */}
              {config?.footer_custom_links && config.footer_custom_links.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {config.footer_custom_links.map((link, i) => (
                    <li key={i}>
                      <Link href={link.url} className="text-sm text-gray-400 hover:text-green-300 transition-colors">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* City Links */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Find EVs by City</p>
          <div className="flex flex-wrap gap-2">
            {defaultCities.map((city) => (
              <Link key={city} href={`/charging-stations?city=${city}`}
                className="text-xs text-gray-400 hover:text-green-300 transition-colors px-2 py-1 rounded border border-white/10 hover:border-green-600">
                {city}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      {showCopyright && (
        <div className="border-t border-white/10 py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              {config?.footer_copyright_text || '\u00A9 2024 EVMotorHub. All rights reserved. Prices are ex-showroom & subject to change.'}
            </p>
            {showLegal && (
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <Link href="/about" className="hover:text-gray-300 transition-colors">About Us</Link>
                <Link href="/contact" className="hover:text-gray-300 transition-colors">Contact</Link>
                <Link href="/faq" className="hover:text-gray-300 transition-colors">FAQ</Link>
                <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Use</Link>
                <Link href="/disclaimer" className="hover:text-gray-300 transition-colors">Disclaimer</Link>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Zap size={12} className="text-green-400" />
              <span>Powered by clean energy data</span>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
