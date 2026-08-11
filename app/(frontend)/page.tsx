import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Zap, Search,
  Car, Bike, Scale, Calculator, MapPin, ChevronRight,
  Database, Award, Users, Radio
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Vehicle, NewsArticle, Manufacturer, SiteConfig, HomepageCategory } from '@/lib/types';
import VehicleCard from '@/components/VehicleCard';
import NewsCard from '@/components/NewsCard';
import HeroSection from '@/components/HeroSection';
import HomePageFAQ from '@/components/HomePageFAQ';
import EVPetrolComparison from '@/components/EVPetrolComparison';
import ImageWithFallback from '@/components/ImageWithFallback';
import AdBanner from '@/components/AdBanner';

export const revalidate = 3600;

async function getData() {
  const [vehiclesRes, newsRes, manufacturersRes, siteConfigRes, comparisonsRes, categoriesRes] = await Promise.all([
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
      .eq('show_on_homepage', true)
      .order('name')
      .limit(8),
    supabase
      .from('site_config')
      .select('*')
      .limit(1),
    supabase
      .from('popular_comparisons')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(6),
    supabase
      .from('homepage_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  const upcomingRes = await supabase
    .from('vehicles')
    .select('*, manufacturers(name, slug)')
    .eq('is_upcoming', true)
    .limit(4);

  const [vehicleCountRes, manufacturerCountRes, newsCountRes] = await Promise.all([
    supabase.from('vehicles').select('id', { count: 'exact', head: true }),
    supabase.from('manufacturers').select('id', { count: 'exact', head: true }),
    supabase.from('news').select('id', { count: 'exact', head: true }),
  ]);

  // Get vehicle counts per type for categories
  const scooterCountRes = await supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('type', 'scooter');
  const bikeCountRes = await supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('type', 'bike');
  const carCountRes = await supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('type', 'car');

  const vehicleCounts: Record<string, number> = {
    scooter: scooterCountRes.count || 0,
    bike: bikeCountRes.count || 0,
    car: carCountRes.count || 0,
  };

  const comparisons = await Promise.all(
    (comparisonsRes.data || []).map(async (comp) => {
      const [v1Res, v2Res] = await Promise.all([
        supabase.from('vehicles').select('*, manufacturers(name, slug)').eq('slug', comp.vehicle1_slug).maybeSingle(),
        supabase.from('vehicles').select('*, manufacturers(name, slug)').eq('slug', comp.vehicle2_slug).maybeSingle(),
      ]);
      if (!v1Res.data || !v2Res.data) return null;
      return { ...comp, vehicle1: v1Res.data, vehicle2: v2Res.data };
    })
  );

  // Enrich categories with vehicle counts
  const categories = (categoriesRes.data || []).map((cat) => ({
    ...cat,
    vehicle_count: cat.vehicle_type ? vehicleCounts[cat.vehicle_type] || 0 : 0,
  })) as (HomepageCategory & { vehicle_count: number })[];

  return {
    vehicles: (vehiclesRes.data || []) as (Vehicle & { manufacturers: { name: string; slug: string } })[],
    news: (newsRes.data || []) as NewsArticle[],
    manufacturers: (manufacturersRes.data || []) as Manufacturer[],
    upcoming: (upcomingRes.data || []) as (Vehicle & { manufacturers: { name: string; slug: string } })[],
    siteConfig: (siteConfigRes.data?.[0] || null) as SiteConfig | null,
    comparisons: comparisons.filter(Boolean) as any[],
    categories,
    vehicleCount: vehicleCountRes.count || 0,
    manufacturerCount: manufacturerCountRes.count || 0,
    newsCount: newsCountRes.count || 0,
  };
}

const tools = [
  { label: 'Compare EVs', href: '/compare', icon: Scale, desc: 'Side-by-side comparison of any two vehicles', color: 'bg-green-50 text-green-700 border-green-100' },
  { label: 'EMI Calculator', href: '/emi-calculator', icon: Calculator, desc: 'Calculate your monthly EV loan payments', color: 'bg-teal-50 text-teal-700 border-teal-100' },
  { label: 'Charging Stations', href: '/charging-stations', icon: MapPin, desc: 'Find EV charging points near you', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
];

export default async function HomePage() {
  const { vehicles, news, manufacturers, upcoming, siteConfig, comparisons, categories, vehicleCount, manufacturerCount, newsCount } = await getData();

  const scooters = vehicles.filter(v => v.type === 'scooter');
  const bikes = vehicles.filter(v => v.type === 'bike');
  const cars = vehicles.filter(v => v.type === 'car');

  const stats = [
    { value: vehicleCount, label: 'EV Models', icon: Database },
    { value: manufacturerCount, label: 'Brands', icon: Award },
    { value: vehicleCount, label: 'Variants', icon: Zap },
    { value: newsCount, label: 'Articles', icon: Users },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <HeroSection
        heroTitle={siteConfig?.hero_title || "Find Your Perfect Electric Vehicle in India"}
        heroSubtitle={siteConfig?.hero_subtitle || "India's EV Revolution is Here"}
        heroDescription={siteConfig?.hero_description || "Compare 50+ EV scooters, bikes, and cars. Real specs, honest prices, expert reviews — everything you need to switch to electric."}
        heroBadgeText={(siteConfig as any)?.hero_badge_text || ""}
        heroCtaText={siteConfig?.hero_cta_text || "Explore Vehicles"}
        heroCtaUrl={siteConfig?.hero_cta_url || "/vehicles"}
        heroCta2Text={(siteConfig as any)?.hero_cta2_text || ""}
        heroCta2Url={(siteConfig as any)?.hero_cta2_url || ""}
        heroRightMainImage={(siteConfig as any)?.hero_right_main_image || ""}
        heroRightSecondaryImages={(siteConfig as any)?.hero_right_secondary_images || []}
      />

      {/* Stats Strip - full-width below hero */}
      <section className="bg-[#0a2e14] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 px-4 sm:px-6 py-5">
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

      {/* Browse by Category */}
      {categories.length > 0 && (
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
                <Link key={cat.id} href={cat.link_url} className="group relative rounded-2xl overflow-hidden h-52 sm:h-64 block">
                  <Image
                    src={cat.image_url}
                    alt={cat.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a2e14]/90 via-[#145a2c]/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="text-xs font-medium text-green-300 mb-1">
                      {cat.vehicle_count > 0 ? `${cat.vehicle_count}+ models` : 'Explore'}
                    </div>
                    <h3 className="text-white font-bold text-xl mb-1">{cat.title}</h3>
                    {cat.subtitle && <p className="text-gray-300 text-sm">{cat.subtitle}</p>}
                    <div className="mt-3 flex items-center gap-1 text-green-300 text-sm font-medium group-hover:gap-2 transition-all">
                      Explore <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ad Banner - Below Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AdBanner position="homepage_below_hero" className="mx-auto" />
      </div>

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

      {/* Popular Comparisons */}
      {comparisons.length > 0 && (
        <section className="py-14 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-1">Head-to-Head</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Popular EV Comparisons</h2>
              </div>
              <Link href="/compare" className="hidden sm:flex items-center gap-1 text-[#145a2c] text-sm font-medium hover:gap-2 transition-all">
                Compare all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {comparisons.map((comp: any) => (
                <Link
                  key={comp.id}
                  href={`/compare?v1=${comp.vehicle1_slug}&v2=${comp.vehicle2_slug}`}
                  className="group bg-white rounded-xl border border-gray-100 p-5 hover:border-green-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                      <ImageWithFallback
                        src={comp.vehicle1.image_url}
                        alt={comp.vehicle1.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                        fallbackCategory="vehicle"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{comp.vehicle1.name}</div>
                      <div className="text-xs text-gray-500">{comp.vehicle1.manufacturers?.name}</div>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex-shrink-0">VS</span>
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                      <ImageWithFallback
                        src={comp.vehicle2.image_url}
                        alt={comp.vehicle2.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                        fallbackCategory="vehicle"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{comp.vehicle2.name}</div>
                      <div className="text-xs text-gray-500">{comp.vehicle2.manufacturers?.name}</div>
                    </div>
                  </div>
                  {comp.title && (
                    <p className="mt-3 text-xs text-gray-500 border-t border-gray-50 pt-3">{comp.title}</p>
                  )}
                </Link>
              ))}
            </div>

            {/* Smart Tools */}
            <div className="mt-10 pt-10 border-t border-gray-200">
              <div className="text-center mb-8">
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
          </div>
        </section>
      )}

      {/* Show Tools section if no comparisons */}
      {comparisons.length === 0 && (
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
      )}

      {/* Upcoming EVs */}
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
                {(m.total_models ?? 0) > 0 && (
                  <span className="text-xs text-gray-400">{m.total_models} models</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News & Reviews */}
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

      {/* EV vs Petrol Comparison - Above FAQ */}
      <EVPetrolComparison />

      {/* Ad Banner - Before FAQ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AdBanner position="homepage_before_faq" className="mx-auto" />
      </div>

      {/* FAQ Section */}
      <HomePageFAQ />

      {/* Manufacturer Registration CTA */}
      <section className="py-14 md:py-20 bg-gradient-to-br from-[#0a2e14] to-[#145a2c] text-white relative overflow-hidden">
        {/* Subtle EV circuit pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" aria-hidden="true">
          <svg width="100%" height="100%" viewBox="0 0 1200 400" fill="none" preserveAspectRatio="xMidYMid slice">
            <path d="M0 300 H200 V180 H400 V80 H600 V230 H800 V150 H1000 V280 H1200" stroke="#22c55e" strokeWidth="2" fill="none" />
            <path d="M0 120 H150 V190 H350 V60 H550 V210 H750 V140 H950 V260 H1200" stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.6" />
            <circle cx="200" cy="180" r="5" fill="#22c55e" />
            <circle cx="400" cy="80" r="5" fill="#22c55e" />
            <circle cx="600" cy="230" r="5" fill="#22c55e" />
            <circle cx="800" cy="150" r="5" fill="#22c55e" />
            <circle cx="1000" cy="280" r="5" fill="#22c55e" />
            <path d="M580 200 L 595 175 L 585 175 L 600 150 L 590 185 L 600 185 L 585 210 Z" fill="#22c55e" opacity="0.4" />
          </svg>
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-400/20 rounded-full px-4 py-1.5 mb-5">
            <Zap size={14} className="text-green-400" />
            <span className="text-xs font-semibold text-green-300 uppercase tracking-wider">For Manufacturers</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold mb-4 leading-tight">
            Are You an EV Manufacturer?
          </h2>
          <p className="text-green-100 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            List your company and vehicles on India&apos;s leading EV marketplace. Reach thousands of buyers, showcase your products, and grow your brand.
          </p>
          <Link
            href="/register-company"
            className="inline-flex items-center gap-2 bg-white text-[#0a2e14] hover:bg-green-50 font-bold px-8 py-3.5 rounded-xl text-base transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Register Your Company
            <ArrowRight size={18} />
          </Link>
          <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-400">53+</div>
              <div className="text-xs text-green-200 mt-1">Brands Listed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-400">1000+</div>
              <div className="text-xs text-green-200 mt-1">Daily Visitors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-400">Free</div>
              <div className="text-xs text-green-200 mt-1">To Register</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Banner - Above Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-8">
        <AdBanner position="homepage_above_footer" className="mx-auto" />
      </div>
    </div>
  );
}
