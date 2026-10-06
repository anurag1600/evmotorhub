'use client';

import { useState } from 'react';
import { Zap, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ChargingStationSubmitModal = dynamic(() => import('@/components/ChargingStationSubmitModal'), { ssr: false });

export default function ChargingStationCTA() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <section className="py-12 md:py-16 bg-gradient-to-br from-[#0a2e14] via-[#0f4020] to-[#145a2c] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" aria-hidden="true">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-green-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-400/20 rounded-full px-4 py-1.5 mb-4">
                <Zap size={14} className="text-green-400" />
                <span className="text-xs font-semibold text-green-300 uppercase tracking-wider">EV Charging Directory</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight tracking-tight">
                Know a Charging Station We&apos;re Missing?
              </h2>
              <p className="text-green-100 text-sm sm:text-base max-w-xl leading-relaxed">
                Help us build India&apos;s most complete EV charging directory. Submit a station or upload multiple at once.
              </p>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-white text-[#0a2e14] hover:bg-green-50 font-bold px-6 py-3.5 rounded-2xl text-sm transition-all duration-300 hover:scale-105 shadow-xl shadow-green-900/20 whitespace-nowrap"
              >
                <MapPin size={18} />
                Submit a Station
              </button>
              <Link
                href="/charging-stations"
                className="inline-flex items-center gap-1.5 text-green-200 hover:text-white text-sm font-medium transition-colors justify-center"
              >
                Browse all stations <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <ChargingStationSubmitModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
