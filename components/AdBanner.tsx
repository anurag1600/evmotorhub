'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Ad {
  id: string;
  name: string;
  ad_type: string;
  ad_size: string;
  ad_position: string;
  image_url: string;
  destination_url: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  is_active: boolean;
  impressions: number;
  clicks: number;
}

interface AdBannerProps {
  position: string;
  className?: string;
}

const adSizeStyles: Record<string, { width: string; height: string }> = {
  leaderboard: { width: '728px', height: '90px' },
  large_leaderboard: { width: '970px', height: '90px' },
  rectangle: { width: '300px', height: '250px' },
  large_rectangle: { width: '336px', height: '280px' },
  skyscraper: { width: '120px', height: '600px' },
  wide_skyscraper: { width: '160px', height: '600px' },
  square: { width: '250px', height: '250px' },
  mobile_banner: { width: '320px', height: '50px' },
};

export default function AdBanner({ position, className }: AdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchAd();
  }, [position]);

  const fetchAd = async () => {
    try {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('advertisements')
        .select('*')
        .eq('ad_position', position)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        setAd(data as Ad);
        // Track impression
        await supabase
          .from('advertisements')
          .update({ impressions: (data.impressions || 0) + 1 })
          .eq('id', data.id);
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
        .update({ clicks: (ad.clicks || 0) + 1 })
        .eq('id', ad.id);
    }
  };

  if (loading || !ad || dismissed) return null;

  const sizeStyle = adSizeStyles[ad.ad_size] || adSizeStyles.rectangle;
  const isMobileSticky = position === 'mobile_sticky_bottom';

  const adContent = (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-gray-50 border border-gray-100',
        isMobileSticky && 'fixed bottom-0 left-0 right-0 z-40 rounded-none border-t',
        className
      )}
      style={!isMobileSticky ? { maxWidth: sizeStyle.width, minHeight: sizeStyle.height } : undefined}
    >
      {/* Close button for mobile sticky */}
      {isMobileSticky && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 z-10 p-1 bg-white/80 rounded-full text-gray-500 hover:text-gray-700"
        >
          <X size={14} />
        </button>
      )}

      {/* Ad label */}
      <div className="absolute top-1 left-2 text-[10px] text-gray-400 uppercase tracking-wider z-10">
        Ad
      </div>

      {/* Ad image */}
      {ad.destination_url ? (
        <a
          href={ad.destination_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="block w-full h-full"
          style={{ minHeight: sizeStyle.height }}
        >
          <img
            src={ad.image_url}
            alt={ad.name}
            className="w-full h-full object-cover"
          />
        </a>
      ) : (
        <div style={{ minHeight: sizeStyle.height }}>
          <img
            src={ad.image_url}
            alt={ad.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );

  return adContent;
}

// Multiple ads for a position (e.g., listing_after_cards shows after every N items)
export function AdBannerMultiple({ position, limit = 3 }: { position: string; limit?: number }) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, [position]);

  const fetchAds = async () => {
    try {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('advertisements')
        .select('*')
        .eq('ad_position', position)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('sort_order', { ascending: true })
        .limit(limit);

      if (data && data.length > 0) {
        setAds(data as Ad[]);
        // Track impressions for all
        for (const ad of data) {
          await supabase
            .from('advertisements')
            .update({ impressions: (ad.impressions || 0) + 1 })
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
      {ads.map((ad, idx) => {
        const sizeStyle = adSizeStyles[ad.ad_size] || adSizeStyles.rectangle;
        return (
          <div
            key={ad.id}
            className="relative overflow-hidden rounded-xl bg-gray-50 border border-gray-100 my-4"
            style={{ maxWidth: sizeStyle.width, minHeight: sizeStyle.height }}
          >
            <div className="absolute top-1 left-2 text-[10px] text-gray-400 uppercase tracking-wider z-10">
              Ad
            </div>
            {ad.destination_url ? (
              <a
                href={ad.destination_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={async () => {
                  await supabase
                    .from('advertisements')
                    .update({ clicks: (ad.clicks || 0) + 1 })
                    .eq('id', ad.id);
                }}
                className="block w-full h-full"
                style={{ minHeight: sizeStyle.height }}
              >
                <img
                  src={ad.image_url}
                  alt={ad.name}
                  className="w-full h-full object-cover"
                />
              </a>
            ) : (
              <div style={{ minHeight: sizeStyle.height }}>
                <img
                  src={ad.image_url}
                  alt={ad.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
