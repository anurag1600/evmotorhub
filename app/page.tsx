import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Zap, Shield, TrendingUp, Award, Search,
  Car, Bike, Scale, Calculator, MapPin, ChevronRight,
  Star, Users, Database, Radio
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Vehicle, NewsArticle, Manufacturer, HeroSlide, SiteConfig } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import VehicleCard from '@/components/VehicleCard';
import NewsCard from '@/components/NewsCard';
import HeroCarousel from '@/components/HeroCarousel';

export const revalidate = 3600;

async function getData() {
  const [vehiclesRes, newsRes, manufacturersRes, heroSlidesRes, siteConfigRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('*, manufacturers(name, slug)')
      .or('is_featured.eq.true,is_latest.eq.true')
      .order('is_featured', { ascending: false })
      .limit(8),
    supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(6),
    supabase
      .from('manufacturers')
      .select('*')
      .eq('is_featured', true)
      .order('name')
      .limit(8),
    supabase
      .from('hero_slides')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true })
      .limit(5),
    supabase
      .from('site_config')
      .select('*')
      .limit(1),
  ]);

  const upcomingRes = await supabase
    .from('vehicles')
    .select('*, manufacturers(name, slug)')
    .eq('is_upcoming', true)
    .limit(4);

  return {
    vehicles: (vehiclesRes.data || []) as (Vehicle & { manufacturers: { name: string; slug: string } })[],
    news: (newsRes.data || []) as NewsArticle[],
    manufacturers: (manufacturersRes.data || []) as Manufacturer[],
    upcoming: (upcomingRes.data || []) as (Vehicle & { manufacturers: { name: string; slug: string } })[],
    heroSlides: (heroSlidesRes.data || []) as HeroSlide[],
    siteConfig: (siteConfigRes.data?.[0] || null) as SiteConfig | null,
  };
}

const stats = [
  { value: '50+', label: 'EV Models Listed', icon: Database },
  { value: '8+', label: 'Top Brands', icon: Award },
  { value: '12K+', label: 'Charging Stations', icon: Zap },
  { value: '2M+', label: 'Monthly Visitors', icon: Users },
];

const categories = [
  {
    label: 'Electric Scooters',
    href: '/vehicles?type=scooter',
    icon: Radio,
    desc: 'Best for city commute',
    count: '20+ models',
    image: 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    label: 'Electric Bikes',
    href: '/vehicles?type=bike',
    icon: Bike,
    desc: 'Performance meets efficiency',
    count: '10+ models',
    image: 'https://images.pexels.com/photos/1544463/pexels-photo-1544463.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    label: 'Electric Cars',
    href: '/vehicles?type=car',
    icon: Car,
    desc: 'Family & long-distance EVs',
    count: '15+ models',
    image: 'https://images.pexels.com/photos/3422964/pexels-photo-3422964.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

const tools = [
  { label: 'Compare EVs', href: '/compare', icon: Scale, desc: 'Side-by-side comparison of any two vehicles', color: 'bg-green-50 text-green-700 border-green-100' },
  { label: 'EMI Calculator', href: '/emi-calculator', icon: Calculator, desc: 'Calculate your monthly EV loan payments', color: 'bg-teal-50 text-teal-700 border-teal-100' },
  { label: 'Charging Stations', href: '/charging-stations', icon: MapPin, desc: 'Find EV charging points near you', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
];

const whyUs = [
  { icon: TrendingUp, title: 'Real-time Pricing', desc: 'Always up-to-date ex-showroom prices from official sources across India.' },
  { icon: Shield, title: 'Expert Reviews', desc: 'In-depth, unbiased reviews from certified EV test drivers and engineers.' },
  { icon: Zap, title: 'Spec Comparisons', desc: 'Compare any two vehicles side-by-side across 30+ technical parameters.' },
  { icon: Star, title: 'Owner Ratings', desc: 'Verified ratings from real EV owners across India — no fake reviews.' },
];

export default async function HomePage() {
  const { vehicles, news, manufacturers, upcoming, heroSlides, siteConfig } = await getData();

  const scooters = vehicles.filter(v => v.type === 'scooter');
  const bikes = vehicles.filter(v => v.type === 'bike');
  const cars = vehicles.filter(v => v.type === 'car');

  return (
    <div className="bg-white">
      {/* Hero Carousel */}
      <HeroCarousel
        slides={heroSlides}
        heroTitle={siteConfig?.hero_title || "Find Your Perfect Electric Vehicle in India"}
        heroSubtitle={siteConfig?.hero_subtitle || "India's EV Revolution is Here"}
        heroDescription={siteConfig?.hero_description || "Compare 50+ EV scooters, bikes, and cars. Real specs, honest prices, expert reviews — everything you need to switch to electric."}
        heroCtaText={siteConfig?.hero_cta_text || "Explore Vehicles"}
        heroCtaUrl={siteConfig?.hero_cta_url || "/vehicles"}
      />

      {/* Stats Bar */}
      <section className="bg-[#0a2e14] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 px-4 sm:px-6 py-4">
                <Icon size={20} className="text-green-400 flex-shrink-0" />
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          <div className="bg-gray-50 rounded-xl p-1.5 flex items-center gap-2 shadow-sm border border-gray-200">
            <Search className="ml-3 text-gray-400 flex-shrink-0" size={18} />
            <Link href="/vehicles" className="flex-1 py-2.5 text-gray-500 text-sm">
              Search scooters, bikes, cars...
            </Link>
            <Link
              href="/vehicles"
              className="bg-[#145a2c] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0f4020] transition-colors flex-shrink-0"
            >
              Search
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {['Ola S1 Pro', 'Tata Nexon EV', 'Ather 450X', 'TVS iQube', 'Under 1L'].map((term) => (
              <Link
                key={term}
                href={`/vehicles?q=${encodeURIComponent(term)}`}
                className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors border border-gray-200"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Categories */}
      <section className="py-14 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-1">Browse by Category</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Find Your EV Type</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 md:gap-6">
            {categories.map((cat) => (
              <Link key={cat.href} href={cat.href} className="group relative rounded-2xl overflow-hidden h-52 sm:h-64 block">
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a2e14]/90 via-[#145a2c]/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="text-xs font-medium text-green-300 mb-1">{cat.count}</div>
                  <h3 className="text-white font-bold text-xl mb-1">{cat.label}</h3>
                  <p className="text-gray-300 text-sm">{cat.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-green-300 text-sm font-medium group-hover:gap-2 transition-all">
                    Explore <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured EVs */}
      <section className="py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-1">Top Picks</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Featured Electric Vehicles</h2>
            </div>
            <Link href="/vehicles" className="hidden sm:flex items-center gap-1 text-[#145a2c] text-sm font-medium hover:gap-2 transition-all">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {scooters.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-[#145a2c] rounded-full" />
                <h3 className="text-lg font-semibold text-gray-800">Electric Scooters</h3>
                <Link href="/vehicles?type=scooter" className="ml-auto text-sm text-green-700 hover:underline flex items-center gap-1">
                  All scooters <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {scooters.slice(0, 4).map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            </div>
          )}

          {cars.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-[#145a2c] rounded-full" />
                <h3 className="text-lg font-semibold text-gray-800">Electric Cars</h3>
                <Link href="/vehicles?type=car" className="ml-auto text-sm text-green-700 hover:underline flex items-center gap-1">
                  All cars <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {cars.slice(0, 4).map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            </div>
          )}

          {bikes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-[#145a2c] rounded-full" />
                <h3 className="text-lg font-semibold text-gray-800">Electric Bikes</h3>
                <Link href="/vehicles?type=bike" className="ml-auto text-sm text-green-700 hover:underline flex items-center gap-1">
                  All bikes <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                {bikes.slice(0, 4).map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tools CTA */}
      <section className="py-14 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-1">Smart EV Tools</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Everything You Need to Go Electric</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {tools.map((tool) => (
              <Link key={tool.href} href={tool.href} className="group">
                <div className={`rounded-2xl border p-6 bg-white hover:shadow-lg transition-all duration-300 hover:border-green-300 ${tool.color}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.color}`}>
                    <tool.icon size={22} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-[#145a2c] transition-colors">
                    {tool.label}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{tool.desc}</p>
                  <span className="flex items-center gap-1 text-sm font-medium text-[#145a2c] group-hover:gap-2 transition-all">
                    Try Now <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="py-14 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-1">Coming Soon</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Upcoming Electric Vehicles</h2>
              </div>
              <Link href="/vehicles?upcoming=true" className="hidden sm:flex items-center gap-1 text-[#145a2c] text-sm font-medium hover:gap-2 transition-all">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {upcoming.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Manufacturers */}
      <section className="py-14 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-1">All Brands</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Top EV Manufacturers in India</h2>
            </div>
            <Link href="/manufacturers" className="hidden sm:flex items-center gap-1 text-[#145a2c] text-sm font-medium hover:gap-2 transition-all">
              All brands <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
            {manufacturers.map((m) => (
              <Link
                key={m.id}
                href={`/manufacturers/${m.slug}`}
                className="group bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:border-green-300 hover:shadow-md transition-all duration-300 text-center"
              >
                <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-50">
                  <Image
                    src={m.logo_url || m.hero_image_url}
                    alt={m.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 group-hover:text-[#145a2c] transition-colors leading-tight">
                  {m.name}
                </span>
                <span className="text-xs text-gray-400">{m.total_models} models</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-1">Stay Updated</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Latest EV News &amp; Reviews</h2>
            </div>
            <Link href="/news" className="hidden sm:flex items-center gap-1 text-[#145a2c] text-sm font-medium hover:gap-2 transition-all">
              All articles <ArrowRight size={14} />
            </Link>
          </div>

          {news.length > 0 && (
            <>
              <div className="mb-6">
                <NewsCard article={news[0]} featured />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {news.slice(1, 4).map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Why EVMotorHub */}
      <section className="py-14 md:py-20 bg-gradient-to-br from-[#0a2e14] to-[#145a2c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-green-300 uppercase tracking-wider mb-2">Why EVMotorHub</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">India&apos;s Most Trusted EV Research Platform</h2>
            <p className="text-gray-300 mt-3 max-w-xl mx-auto">
              We&apos;re a team of EV enthusiasts and engineers dedicated to making your EV buying journey easy, informed, and exciting.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {whyUs.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-colors">
                <div className="w-11 h-11 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={20} className="text-green-300" />
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/vehicles"
              className="inline-flex items-center gap-2 bg-white text-[#145a2c] px-8 py-3.5 rounded-xl font-bold text-base hover:bg-green-50 transition-colors shadow-lg"
            >
              <Zap size={18} />
              Explore All EVs
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 bg-[#edfaf1] border-y border-green-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Zap size={28} className="text-[#145a2c] mx-auto mb-3" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Get EV Updates in Your Inbox</h2>
          <p className="text-gray-600 text-sm mb-6">New launches, price drops, government subsidies — delivered weekly.</p>
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
            />
            <button className="bg-[#145a2c] text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-[#0f4020] transition-colors flex-shrink-0">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
