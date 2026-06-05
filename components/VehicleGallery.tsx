'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Calendar, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

interface VehicleGalleryProps {
  mainImage: string;
  galleryImages: string[];
  vehicleName: string;
  isUpcoming: boolean;
  isLatest: boolean;
}

export default function VehicleGallery({
  mainImage, galleryImages, vehicleName, isUpcoming, isLatest
}: VehicleGalleryProps) {
  const allImages = [mainImage, ...galleryImages.filter(url => url && url !== mainImage)];
  const [activeIdx, setActiveIdx] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const next = () => setActiveIdx((prev) => (prev + 1) % allImages.length);
  const prev = () => setActiveIdx((prev) => (prev - 1 + allImages.length) % allImages.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
    setTouchStart(null);
  };

  return (
    <div>
      {/* Main Image */}
      <div
        className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-green-50 border border-gray-100"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={allImages[activeIdx]}
          alt={`${vehicleName} - Image ${activeIdx + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={activeIdx === 0}
          unoptimized
        />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {isUpcoming && (
            <span className="flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              <Calendar size={11} /> Upcoming
            </span>
          )}
          {isLatest && (
            <span className="flex items-center gap-1 bg-[#145a2c] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              <Zap size={11} /> New
            </span>
          )}
        </div>

        {/* Navigation arrows for multiple images */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
            {/* Counter */}
            <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
              {activeIdx + 1} / {allImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {allImages.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                i === activeIdx ? 'border-[#145a2c]' : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <Image
                src={url}
                alt={`${vehicleName} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
