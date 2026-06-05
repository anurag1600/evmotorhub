'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  cta_button_text?: string;
  cta_button_url?: string;
  image_url: string;
}

interface HeroCarouselProps {
  slides: Slide[];
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroCtaText: string;
  heroCtaUrl: string;
}

export default function HeroCarousel({
  slides,
  heroTitle,
  heroSubtitle,
  heroDescription,
  heroCtaText,
  heroCtaUrl,
}: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const allSlides = slides.length > 0 ? slides : [];
  const hasSlides = allSlides.length > 0;

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % allSlides.length);
  }, [allSlides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + allSlides.length) % allSlides.length);
  }, [allSlides.length]);

  useEffect(() => {
    if (!hasSlides) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [hasSlides, next]);

  if (!hasSlides) {
    return (
      <section className="relative bg-gradient-to-br from-[#0a2e14] via-[#0f4020] to-[#145a2c] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-400 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 text-sm font-medium px-3 py-1.5 rounded-full mb-5 border border-green-500/30">
              <Zap size={14} />
              {heroSubtitle}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-5">
              {heroTitle}
            </h1>
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
              {heroDescription}
            </p>
            <Link
              href={heroCtaUrl}
              className="inline-flex items-center gap-2 bg-white text-[#145a2c] px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-50 transition-colors shadow-lg"
            >
              {heroCtaText}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const slide = allSlides[current];

  return (
    <section className="relative w-full h-[420px] sm:h-[500px] md:h-[560px] lg:h-[600px] overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0 transition-opacity duration-700">
        <Image
          src={slide.image_url}
          alt={slide.title}
          fill
          className="object-cover"
          priority={current === 0}
          sizes="100vw"
          unoptimized
        />
      </div>

      {/* Gradient Overlay - dark on left for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-xl animate-fade-in" key={slide.id}>
          {slide.subtitle && (
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 text-sm font-medium px-3 py-1.5 rounded-full mb-4 border border-green-500/30 backdrop-blur-sm">
              <Zap size={14} />
              {slide.subtitle}
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
            {slide.title}
          </h1>
          {slide.description && (
            <p className="text-gray-200 text-sm sm:text-base leading-relaxed mb-6 max-w-md">
              {slide.description}
            </p>
          )}
          {slide.cta_button_text && slide.cta_button_url && (
            <Link
              href={slide.cta_button_url}
              className="inline-flex items-center gap-2 bg-[#145a2c] hover:bg-[#0f4020] text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg"
            >
              {slide.cta_button_text}
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      {allSlides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {allSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
