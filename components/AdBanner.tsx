'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adSizeDimensions } from '@/lib/ad-constants';
import type { Advertisement } from '@/lib/types';

interface AdBannerProps {
  position: string;
  className?: string;
  currentPage?: string;
}

function getAdDimensions(ad: Advertisement): { width: number; height: number } {
  if (ad.ad_size === 'custom' && ad.custom_width && ad.custom_height) {
    return { width: ad.custom_width, height: ad.custom_height };
  }
  return adSizeDimensions[ad.ad_size] || adSizeDimensions.rectangle;
}

function matchesPageTarget(ad: Advertisement, currentPage?: string): boolean {
  if (!ad.page_target) return true;
  if (!currentPage) return true;
  const targets = ad.page_target.split(',').map(t => t.trim()).filter(Boolean);
  if (targets.length === 0) return true;
  return targets.some(target => {
    if (target === 'all') return true;
    if (target === 'home' || target === '/') return currentPage === '/';
    return currentPage.startsWith(target);
  });
}

export default function AdBanner({ position, className, currentPage }: AdBannerProps) {
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchAd();
  }, [position]);

  const fetchAd = async () => {
    try {
      const now = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('advertisements')
        .select('*')
        .eq('ad_position', position)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('priority', { ascending: false })
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        const adData = data as Advertisement;
        if (matchesPageTarget(adData, currentPage)) {
          setAd(adData);
          await supabase
            .from('advertisements')
            .update({ impression_count: (adData.impression_count || 0) + 1 })
            .eq('id', adData.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch ad:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async () => {
    if (ad) {
      await supabase
        .from('advertisements')
        .update({ click_count: (ad.click_count || 0) + 1 })
        .eq('id', ad.id);
    }
  };

  if (loading || !ad || dismissed) return null;

  const dims = getAdDimensions(ad);
  const isMobileSticky = position === 'mobile_sticky_bottom';
  const hasContentOverlay = ad.title || ad.description || ad.cta_text;

  const adContent = (
    <div
      className={cn(
        'relative overflow-hidden bg-white',
        isMobileSticky && 'fixed bottom-0 left-0 right-0 z-40',
        className
      )}
      style={{
        width: isMobileSticky ? '100%' : `${dims.width}px`,
        height: isMobileSticky ? 'auto' : `${dims.height}px`,
        maxWidth: '100%',
      }}
    >
      {isMobileSticky && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-1.5 right-1.5 z-20 p-1 bg-white/80 rounded-full text-gray-500 hover:text-gray-700"
          aria-label="Close ad"
        >
          <X size={14} />
        </button>
      )}

      <div className="absolute top-1 left-2 text-[10px] text-gray-400 uppercase tracking-wider z-10">
        Advertisement
      </div>

      {ad.destination_url ? (
        <a
          href={ad.destination_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="block w-full h-full relative"
        >
          <img
            src={ad.image_url}
            alt={ad.name}
            className="w-full h-full object-cover"
            style={{ minHeight: `${dims.height}px` }}
          />
          {hasContentOverlay && (
            <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/60 to-transparent">
              {ad.title && <p className="text-white text-sm font-semibold line-clamp-1">{ad.title}</p>}
              {ad.description && <p className="text-white/80 text-xs line-clamp-1">{ad.description}</p>}
              {ad.cta_text && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-white bg-white/20 rounded-md px-2 py-0.5 w-fit">
                  {ad.cta_text} <ExternalLink size={10} />
                </span>
              )}
            </div>
          )}
        </a>
      ) : (
        <div className="w-full h-full relative">
          <img
            src={ad.image_url}
            alt={ad.name}
            className="w-full h-full object-cover"
            style={{ minHeight: `${dims.height}px` }}
          />
          {hasContentOverlay && (
            <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/60 to-transparent">
              {ad.title && <p className="text-white text-sm font-semibold line-clamp-1">{ad.title}</p>}
              {ad.description && <p className="text-white/80 text-xs line-clamp-1">{ad.description}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return adContent;
}

export function AdBannerMultiple({ position, limit = 3, currentPage }: { position: string; limit?: number; currentPage?: string }) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, [position]);

  const fetchAds = async () => {
    try {
      const now = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('advertisements')
        .select('*')
        .eq('ad_position', position)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('priority', { ascending: false })
        .order('sort_order', { ascending: true })
        .limit(limit);

      if (data && data.length > 0) {
        const filtered = (data as Advertisement[]).filter(ad => matchesPageTarget(ad, currentPage));
        setAds(filtered);
        for (const ad of filtered) {
          await supabase
            .from('advertisements')
            .update({ impression_count: (ad.impression_count || 0) + 1 })
            .eq('id', ad.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch ads:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || ads.length === 0) return null;

  return (
    <>
      {ads.map((ad) => {
        const dims = getAdDimensions(ad);
        const hasContentOverlay = ad.title || ad.description || ad.cta_text;
        return (
          <div
            key={ad.id}
            className="relative overflow-hidden bg-white my-4 mx-auto"
            style={{ width: `${dims.width}px`, height: `${dims.height}px`, maxWidth: '100%' }}
          >
            <div className="absolute top-1 left-2 text-[10px] text-gray-400 uppercase tracking-wider z-10">
              Advertisement
            </div>
            {ad.destination_url ? (
              <a
                href={ad.destination_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={async () => {
                  await supabase
                    .from('advertisements')
                    .update({ click_count: (ad.click_count || 0) + 1 })
                    .eq('id', ad.id);
                }}
                className="block w-full h-full relative"
              >
                <img src={ad.image_url} alt={ad.name} className="w-full h-full object-cover" />
                {hasContentOverlay && (
                  <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/60 to-transparent">
                    {ad.title && <p className="text-white text-sm font-semibold line-clamp-1">{ad.title}</p>}
                    {ad.description && <p className="text-white/80 text-xs line-clamp-1">{ad.description}</p>}
                    {ad.cta_text && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-white bg-white/20 rounded-md px-2 py-0.5 w-fit">
                        {ad.cta_text} <ExternalLink size={10} />
                      </span>
                    )}
                  </div>
                )}
              </a>
            ) : (
              <div className="w-full h-full relative">
                <img src={ad.image_url} alt={ad.name} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export function AdSection({ position, currentPage, className }: { position: string; currentPage?: string; className?: string }) {
  return (
    <div className={cn('w-full bg-gray-100 py-4 flex justify-center', className)}>
      <AdBanner position={position} currentPage={currentPage} />
    </div>
  );
}
