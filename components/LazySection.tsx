'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  /** If true, render immediately without waiting for intersection (for SSR or above-the-fold) */
  forceVisible?: boolean;
  className?: string;
}

export default function LazySection({
  children,
  fallback,
  rootMargin = '200px 0px',
  threshold = 0,
  forceVisible = false,
  className,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(forceVisible);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forceVisible || isVisible) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [forceVisible, isVisible, rootMargin, threshold]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback ?? <DefaultSkeleton />)}
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <div className="py-16 md:py-24 bg-gray-50 animate-pulse" aria-hidden="true">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-4 w-32 bg-gray-200 rounded-full mb-3" />
          <div className="h-8 w-72 bg-gray-200 rounded-lg" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-20 bg-gray-200 rounded-full" />
                <div className="h-5 w-3/4 bg-gray-200 rounded" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-12 bg-gray-100 rounded-lg" />
                  <div className="h-12 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-6 w-1/2 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
