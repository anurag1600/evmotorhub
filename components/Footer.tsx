import Link from 'next/link';
import Image from 'next/image';
import { Zap, MapPin, Phone, Mail, Facebook, Twitter, Youtube, Instagram } from 'lucide-react';

const footerLinks = {
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
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Disclaimer', href: '/disclaimer' },
  ],
};

const indianStates = [
  'Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat',
  'Rajasthan', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Pune'
];

export default function Footer() {
  return (
    <footer className="bg-[#0a2e14] text-white">
      {/* Main Footer */}
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
            <div className="space-y-2 text-sm text-gray-400 mb-6">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-green-400 flex-shrink-0" />
                <span>Bengaluru, Karnataka, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-green-400 flex-shrink-0" />
                <a href="mailto:hello@evmotorhub.in" className="hover:text-green-400 transition-colors">
                  hello@evmotorhub.in
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-green-400 flex-shrink-0" />
                <span>+91 80 4567 8900</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {[
                { icon: Facebook, href: '#', label: 'Facebook' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Instagram, href: '#', label: 'Instagram' },
                { icon: Youtube, href: '#', label: 'YouTube' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-green-600 transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Vehicles */}
          <div>
            <h3 className="text-sm font-semibold text-green-300 uppercase tracking-wider mb-4">Vehicles</h3>
            <ul className="space-y-2.5">
              {footerLinks.vehicles.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-green-300 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-green-300 uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-green-300 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Brands */}
          <div>
            <h3 className="text-sm font-semibold text-green-300 uppercase tracking-wider mb-4">Top Brands</h3>
            <ul className="space-y-2.5">
              {footerLinks.brands.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-green-300 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-green-300 uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-green-300 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* City Links */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Find EVs by City</p>
          <div className="flex flex-wrap gap-2">
            {indianStates.map((city) => (
              <Link
                key={city}
                href={`/charging-stations?city=${city}`}
                className="text-xs text-gray-400 hover:text-green-300 transition-colors px-2 py-1 rounded border border-white/10 hover:border-green-600"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; 2024 EVMotorHub. All rights reserved. Prices are ex-showroom &amp; subject to change.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <Link href="/about" className="hover:text-gray-300 transition-colors">About Us</Link>
            <Link href="/contact" className="hover:text-gray-300 transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Use</Link>
            <Link href="/disclaimer" className="hover:text-gray-300 transition-colors">Disclaimer</Link>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Zap size={12} className="text-green-400" />
            <span>Powered by clean energy data</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
