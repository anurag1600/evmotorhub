import { notFound } from 'next/navigation';
import ImageWithFallback from '@/components/ImageWithFallback';
import Link from 'next/link';
import { Metadata } from 'next';
import { Globe, MapPin, Calendar, Building2, ChevronRight, ArrowRight, ExternalLink, Car } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Manufacturer, Vehicle } from '@/lib/types';
import VehicleCard from '@/components/VehicleCard';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data } = await supabase
    .from('manufacturers')
    .select('name, description')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!data) return { title: 'Manufacturer Not Found' };
  return {
    title: `${data.name} EV Models, Prices & Reviews | EVMotorHub`,
    description: data.description.slice(0, 160),
  };
}

export default async function ManufacturerDetailPage({ params }: { params: { slug: string } }) {
  const { data: manufacturer } = await supabase
    .from('manufacturers')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!manufacturer) notFound();

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*, manufacturers(name, slug)')
    .eq('manufacturer_id', manufacturer.id)
    .order('is_featured', { ascending: false });

  const allVehicles = (vehicles || []) as (Vehicle & { manufacturers: { name: string; slug: string } })[];
  const available = allVehicles.filter(v => !v.is_upcoming);
  const upcoming = allVehicles.filter(v => v.is_upcoming);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-[#145a2c]">Home</Link>
            <ChevronRight size={12} />
            <Link href="/manufacturers" className="hover:text-[#145a2c]">Manufacturers</Link>
            <ChevronRight size={12} />
            <span className="text-gray-900 font-medium">{manufacturer.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-56 sm:h-72 overflow-hidden">
        <ImageWithFallback
          src={manufacturer.hero_image_url}
          alt={manufacturer.name}
          fallbackCategory="manufacturer"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a2e14]/90 via-[#0a2e14]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="flex items-end gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 relative rounded-2xl overflow-hidden bg-white border-2 border-white/30 flex-shrink-0">
              <ImageWithFallback
                src={manufacturer.logo_url || manufacturer.hero_image_url}
                alt={manufacturer.name}
                fallbackCategory="manufacturer"
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
            <div>
              <div className="text-green-300 text-xs font-semibold mb-1 uppercase tracking-wide">{manufacturer.country}</div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">{manufacturer.name}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">About {manufacturer.name}</h2>
              <p className="text-gray-700 text-sm leading-relaxed">{manufacturer.description}</p>
            </div>

            {/* Available Models */}
            {available.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-[#145a2c] rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900">Available Models</h2>
                  <span className="text-sm text-gray-500">({available.length})</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {available.map((v) => (
                    <VehicleCard key={v.id} vehicle={v} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Models */}
            {upcoming.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-amber-400 rounded-full" />
                  <h2 className="text-lg font-bold text-gray-900">Upcoming Models</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {upcoming.map((v) => (
                    <VehicleCard key={v.id} vehicle={v} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Brand Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Brand Information</h3>
              <div className="space-y-3">
                {manufacturer.headquarters && (
                  <div className="flex items-start gap-3">
                    <MapPin size={15} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500">Headquarters</div>
                      <div className="text-sm text-gray-800 font-medium">{manufacturer.headquarters}</div>
                    </div>
                  </div>
                )}
                {manufacturer.founded_year && (
                  <div className="flex items-start gap-3">
                    <Calendar size={15} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500">Founded</div>
                      <div className="text-sm text-gray-800 font-medium">{manufacturer.founded_year}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Building2 size={15} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Country</div>
                    <div className="text-sm text-gray-800 font-medium">{manufacturer.country}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Car size={15} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Total Models</div>
                    <div className="text-sm text-gray-800 font-medium">{allVehicles.length} EVs listed</div>
                  </div>
                </div>
                {manufacturer.website && (
                  <a
                    href={manufacturer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#145a2c] font-medium hover:underline mt-2"
                  >
                    <Globe size={14} />
                    Official Website
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-[#0f4020] to-[#145a2c] rounded-2xl p-5 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wide mb-3 text-green-200">Quick Actions</h3>
              <div className="space-y-2">
                <Link href={`/vehicles?manufacturer=${manufacturer.slug}`} className="flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2.5 transition-colors text-sm">
                  All Models
                  <ArrowRight size={13} className="text-green-300" />
                </Link>
                <Link href="/compare" className="flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2.5 transition-colors text-sm">
                  Compare EVs
                  <ArrowRight size={13} className="text-green-300" />
                </Link>
                <Link href="/emi-calculator" className="flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2.5 transition-colors text-sm">
                  EMI Calculator
                  <ArrowRight size={13} className="text-green-300" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
