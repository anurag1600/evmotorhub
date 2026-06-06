import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Globe, MapPin, Calendar, Car } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Manufacturer } from '@/lib/types';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EV Manufacturers in India | EVMotorHub',
  description: 'Explore all electric vehicle manufacturers in India — Ola Electric, Ather Energy, Tata Motors, TVS, Bajaj, MG, BYD and more.',
};

export const revalidate = 300;

async function getManufacturers() {
  const { data } = await supabase
    .from('manufacturers')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('name');
  return (data || []) as Manufacturer[];
}

export default async function ManufacturersPage() {
  const manufacturers = await getManufacturers();
  const featured = manufacturers.filter(m => m.is_featured);
  const others = manufacturers.filter(m => !m.is_featured);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a2e14] to-[#145a2c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">EV Manufacturers in India</h1>
          <p className="text-green-200 text-sm">{manufacturers.length} brands shaping India&apos;s electric future</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Brands */}
        {featured.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 bg-[#145a2c] rounded-full" />
              <h2 className="text-lg font-bold text-gray-900">Leading EV Brands</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {featured.map((m) => (
                <Link key={m.id} href={`/manufacturers/${m.slug}`} className="group">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden ev-card-hover">
                    {/* Hero Image */}
                    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-gray-50 to-green-50">
                      <Image
                        src={m.hero_image_url}
                        alt={m.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                        sizes="(max-width: 1024px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-bold text-base">{m.name}</h3>
                        <span className="text-xs text-green-300">{m.country}</span>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{m.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Car size={11} />
                          {m.total_models} models
                        </span>
                        {m.founded_year && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            Est. {m.founded_year}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-sm font-medium text-[#145a2c] group-hover:gap-2 transition-all">
                        View models <ArrowRight size={13} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Brands */}
        {others.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 bg-gray-300 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900">More EV Brands</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {others.map((m) => (
                <Link key={m.id} href={`/manufacturers/${m.slug}`} className="group">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 relative rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image src={m.logo_url || m.hero_image_url} alt={m.name} fill className="object-cover" sizes="48px" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm group-hover:text-[#145a2c] transition-colors">{m.name}</h3>
                        <span className="text-xs text-gray-500">{m.country}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Car size={11} />
                      {m.total_models} models
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
