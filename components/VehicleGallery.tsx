'use client';

import { useState, useEffect, useCallback } from 'react';
import ImageWithFallback from '@/components/ImageWithFallback';
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const goToSlide = useCallback((idx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIdx(idx);
    setTimeout(() => setIsTransitioning(false), 400);
  }, [isTransitioning]);

  const next = useCallback(() => {
    goToSlide((activeIdx + 1) % allImages.length);
  }, [activeIdx, allImages.length, goToSlide]);

  const prev = useCallback(() => {
    goToSlide((activeIdx - 1 + allImages.length) % allImages.length);
  }, [activeIdx, allImages.length, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [next, prev]);

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
      {/* Main Image Container */}
      <div
        className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-green-50 border border-gray-100 group"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image with fade transition */}
        <div className="relative w-full h-full">
          {allImages.map((url, idx) => (
            <div
              key={url + idx}
              className={`absolute inset-0 transition-opacity duration-400 ease-in-out ${
                idx === activeIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <ImageWithFallback
                src={url}
                alt={`${vehicleName} - Image ${idx + 1}`}
                fallbackCategory="vehicle"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority={idx === 0}
              />
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2 z-20">
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
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-800 shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
            {/* Counter */}
            <div className="absolute bottom-3 right-3 z-20 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-medium">
              {activeIdx + 1} / {allImages.length}
            </div>
          </>
        )}

        {/* Progress indicators */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {allImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {allImages.map((url, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-300 ${
                i === activeIdx
                  ? 'border-[#145a2c] ring-2 ring-[#145a2c]/30 scale-105 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100'
              }`}
            >
              <ImageWithFallback
                src={url}
                alt={`${vehicleName} thumbnail ${i + 1}`}
                fallbackCategory="vehicle"
                fill
                className="object-cover"
                sizes="80px"
              />
              {i === activeIdx && (
                <div className="absolute inset-0 bg-[#145a2c]/10 pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
