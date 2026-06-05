'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Zap, Search, ArrowRight, Shield, Award, Database, Users } from 'lucide-react';

interface HeroSectionProps {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroBadgeText: string;
  heroCtaText: string;
  heroCtaUrl: string;
  heroCta2Text: string;
  heroCta2Url: string;
  heroRightMainImage: string;
  heroRightSecondaryImages: string[];
  homepageStats: {
    total_vehicles: number;
    total_manufacturers: number;
    total_charging_stations: number;
    monthly_visitors: number;
  };
}

const defaultStats = [
  { value: '50+', label: 'EV Models', icon: Database },
  { value: '8+', label: 'Top Brands', icon: Award },
  { value: '12K+', label: 'Charging Stations', icon: Zap },
  { value: '2M+', label: 'Monthly Visitors', icon: Users },
];

const PLACEHOLDER_MAIN = 'https://images.pexels.com/photos/3422964/pexels-photo-3422964.jpeg?auto=compress&cs=tinysrgb&w=800';
const PLACEHOLDER_SECONDARY = [
  'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1544463/pexels-photo-1544463.jpeg?auto=compress&cs=tinysrgb&w=400',
];

export default function HeroSection({
  heroTitle,
  heroSubtitle,
  heroDescription,
  heroBadgeText,
  heroCtaText,
  heroCtaUrl,
  heroCta2Text,
  heroCta2Url,
  heroRightMainImage,
  heroRightSecondaryImages,
  homepageStats,
}: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const stats = homepageStats?.total_vehicles ? [
    { value: `${homepageStats.total_vehicles}+`, label: 'EV Models', icon: Database },
    { value: `${homepageStats.total_manufacturers}+`, label: 'Top Brands', icon: Award },
    { value: `${Math.round(homepageStats.total_charging_stations / 1000)}K+`, label: 'Charging Stations', icon: Zap },
    { value: `${Math.round(homepageStats.monthly_visitors / 1000000)}M+`, label: 'Monthly Visitors', icon: Users },
  ] : defaultStats;

  const mainImg = heroRightMainImage || PLACEHOLDER_MAIN;
  const secondaryImgs = heroRightSecondaryImages?.length
    ? heroRightSecondaryImages.slice(0, 2)
    : PLACEHOLDER_SECONDARY;

  return (
    <section className="relative bg-gradient-to-br from-[#0a2e14] via-[#0f4020] to-[#145a2c] overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-400 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="order-2 lg:order-1">
            {/* Badge */}
            {(heroBadgeText || heroSubtitle) && (
              <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-green-500/30 backdrop-blur-sm">
                <Zap size={14} />
                {heroBadgeText || heroSubtitle}
              </div>
            )}

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.4rem] font-extrabold text-white leading-tight mb-5">
              {heroTitle}
            </h1>

            {/* Description */}
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
              {heroDescription}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                href={heroCtaUrl || '/vehicles'}
                className="inline-flex items-center gap-2 bg-white text-[#145a2c] px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-50 transition-colors shadow-lg"
              >
                {heroCtaText || 'Explore Vehicles'}
                <ArrowRight size={16} />
              </Link>
              {heroCta2Text && (
                <Link
                  href={heroCta2Url || '#'}
                  className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  {heroCta2Text}
                </Link>
              )}
            </div>

            {/* Search Bar */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1.5 flex items-center gap-2 border border-white/10 max-w-md mb-8">
              <Search className="ml-3 text-gray-300 flex-shrink-0" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scooters, bikes, cars..."
                className="flex-1 py-2.5 bg-transparent text-white text-sm placeholder-gray-400 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    window.location.href = `/vehicles?q=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }}
              />
              <Link
                href={searchQuery.trim() ? `/vehicles?q=${encodeURIComponent(searchQuery.trim())}` : '/vehicles'}
                className="bg-[#145a2c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0f4020] transition-colors flex-shrink-0"
              >
                Search
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-3">
              {stats.map(({ value, label, icon: Icon }) => (
                <div key={label} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Icon size={14} className="text-green-400" />
                    <span className="text-lg sm:text-xl font-bold text-white">{value}</span>
                  </div>
                  <span className="text-xs text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Image Cards */}
          <div className="order-1 lg:order-2 relative">
            {/* Main EV Image */}
            <div className="relative h-64 sm:h-72 lg:h-96 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <Image
                src={mainImg}
                alt="Electric Vehicle"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                unoptimized={mainImg.includes('pexels.com') ? false : true}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a2e14]/40 to-transparent" />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="text-xs text-gray-500">Trending in India</div>
                <div className="text-sm font-bold text-[#145a2c]">Electric Vehicles</div>
              </div>
            </div>

            {/* Secondary Images */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              {secondaryImgs.map((img, i) => (
                <div key={i} className="relative h-32 sm:h-36 rounded-xl overflow-hidden shadow-lg border border-white/10">
                  <Image
                    src={img}
                    alt={`EV Category ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    unoptimized={img.includes('pexels.com') ? false : true}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a2e14]/30 to-transparent" />
                  <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                    <span className="text-xs font-semibold text-[#145a2c]">
                      {i === 0 ? 'Scooters' : 'Bikes'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-3 -left-3 lg:bottom-8 lg:-left-6 bg-white rounded-xl shadow-xl p-3 border border-green-100 hidden lg:flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-green-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Verified Data</div>
                <div className="text-[10px] text-gray-500">100% Authentic Specs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
