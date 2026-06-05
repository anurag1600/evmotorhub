'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronDown,
  Zap,
  Search,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  {
    label: 'Vehicles',
    href: '/vehicles',
    dropdown: [
      { label: 'Electric Scooters', href: '/vehicles?type=scooter' },
      { label: 'Electric Bikes', href: '/vehicles?type=bike' },
      { label: 'Electric Cars', href: '/vehicles?type=car' },
      { label: 'Upcoming EVs', href: '/vehicles?upcoming=true' },
      { label: 'Compare EVs', href: '/compare' },
    ],
  },
  {
    label: 'Manufacturers',
    href: '/manufacturers',
  },
  {
    label: 'News & Reviews',
    href: '/news',
    dropdown: [
      { label: 'Latest News', href: '/news?category=news' },
      { label: 'Reviews', href: '/news?category=review' },
      { label: 'Launch Updates', href: '/news?category=launch' },
      { label: 'Comparisons', href: '/news?category=comparison' },
      { label: 'Buyer Guides', href: '/news?category=guide' },
    ],
  },
  {
    label: 'Tools',
    href: '#',
    dropdown: [
      { label: 'EMI Calculator', href: '/emi-calculator' },
      { label: 'Charging Stations', href: '/charging-stations' },
      { label: 'Compare Vehicles', href: '/compare' },
    ],
  },
  {
    label: 'Company',
    href: '#',
    dropdown: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
  },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white shadow-md border-b border-green-100'
          : 'bg-white/95 backdrop-blur-sm'
      )}
    >
      {/* Top Bar */}
      <div className="bg-[#0f4020] text-white text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Zap size={12} className="text-green-300" />
            India&apos;s #1 EV Marketplace — Compare, Research, Buy Electric Vehicles
          </span>
          <div className="flex items-center gap-4">
            <Link href="/charging-stations" className="flex items-center gap-1 hover:text-green-300 transition-colors">
              <MapPin size={12} />
              Find Charging Stations
            </Link>
            <Link href="/emi-calculator" className="hover:text-green-300 transition-colors">
              EMI Calculator
            </Link>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/EV_logo_White.png"
              alt="EVMotorHub"
              width={160}
              height={40}
              className="h-9 w-auto"
              style={{ filter: 'invert(1) sepia(1) saturate(2) hue-rotate(95deg) brightness(0.4)' }}
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.dropdown && setActiveDropdown(link.label)}
                onMouseLeave={() => link.dropdown && setActiveDropdown(null)}
              >
                <button
                  onClick={(e) => {
                    if (link.dropdown) {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === link.label ? null : link.label);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
                    pathname === link.href || pathname.startsWith(link.href + '/')
                      ? 'text-[#145a2c] bg-green-50'
                      : 'text-gray-700 hover:text-[#145a2c] hover:bg-green-50'
                  )}
                >
                  <Link href={link.href} className="flex items-center gap-1">
                    {link.label}
                    {link.dropdown && (
                      <ChevronDown
                        size={14}
                        className={cn(
                          'transition-transform',
                          activeDropdown === link.label && 'rotate-180'
                        )}
                      />
                    )}
                  </Link>
                </button>

                {link.dropdown && activeDropdown === link.label && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    {link.dropdown.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-[#145a2c] transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/vehicles"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-[#145a2c] transition-colors"
            >
              <Search size={16} />
              Search
            </Link>
            <Link
              href="/compare"
              className="hidden md:flex items-center gap-1.5 bg-[#145a2c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0f4020] transition-colors"
            >
              <Zap size={14} />
              Compare EVs
            </Link>
            <button
              className="md:hidden p-2 text-gray-600 hover:text-[#145a2c]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <div key={link.label}>
                <Link
                  href={link.href}
                  className="block px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-green-50 hover:text-[#145a2c] rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
                {link.dropdown && (
                  <div className="ml-4 mt-1 space-y-1">
                    {link.dropdown.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-3 py-2 text-sm text-gray-600 hover:text-[#145a2c] hover:bg-green-50 rounded-lg transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <Link
                href="/compare"
                className="flex items-center justify-center gap-1.5 bg-[#145a2c] text-white px-4 py-2.5 rounded-lg text-sm font-medium"
              >
                <Zap size={14} />
                Compare EVs
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
