'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, MapPin, Phone, Mail, Facebook, Twitter, Youtube, Instagram, Linkedin, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
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
  const [config, setConfig] = useState<any>(null);
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

  return (
    <footer className="bg-[#0a2e14] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* 5-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Column 1: Brand + Social */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/EV_logo_White.webp"
                alt={config?.footer_company_name || 'EVMotorHub'}
                width={160}
                height={40}
                className="h-9 w-auto"
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              {config?.footer_description || 'India\'s trusted EV marketplace. Research, compare, and find your perfect electric vehicle.'}
            </p>

            {/* Social Icons */}
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
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-[#145a2c] text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Explore */}
          <div>
            <h3 className="text-xs font-bold text-green-300 uppercase tracking-wider mb-4">Explore</h3>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="text-xs font-bold text-green-300 uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h3 className="text-xs font-bold text-green-300 uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Newsletter */}
          <div>
            <h3 className="text-xs font-bold text-green-300 uppercase tracking-wider mb-4">Newsletter</h3>
            <p className="text-sm text-gray-400 mb-4">
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
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#145a2c] transition-colors"
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#145a2c] hover:bg-[#0f4020] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Send size={14} />
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Contact Info Bar */}
        {(contactInfo.address || contactInfo.email || contactInfo.phone) && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {contactInfo.address && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin size={14} className="text-green-400" />
                  <span>{contactInfo.address}</span>
                </div>
              )}
              {contactInfo.email && (
                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                  <Mail size={14} className="text-green-400" />
                  <span>{contactInfo.email}</span>
                </a>
              )}
              {contactInfo.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Phone size={14} className="text-green-400" />
                  <span>{contactInfo.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 text-center sm:text-left">
              {config?.footer_copyright_text || '\u00A9 2024 EVMotorHub. All rights reserved. Prices are ex-showroom & subject to change.'}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Zap size={12} className="text-green-400" />
              <span>{config?.footer_powered_by_text || 'Powered by clean energy data'}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
