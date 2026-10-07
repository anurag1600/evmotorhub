'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PopupAd, PopupFrequency } from '@/lib/types';

function getStorageKey(popup: PopupAd, freq: PopupFrequency): string {
  const base = `popup_ad_${popup.id}`;
  switch (freq) {
    case 'once_per_visit':
      return `${base}_visit`;
    case 'once_per_session':
      return `${base}_session`;
    case 'once_per_day':
      return `${base}_day`;
    case 'once_per_week':
      return `${base}_week`;
    default:
      return '';
  }
}

function shouldShowPopup(popup: PopupAd): boolean {
  const freq = popup.frequency;
  if (freq === 'always') return true;

  const key = getStorageKey(popup, freq);
  if (!key) return true;

  const stored = localStorage.getItem(key);
  if (!stored) return true;

  const storedTime = parseInt(stored, 10);
  const now = Date.now();

  if (freq === 'once_per_session') {
    return false;
  }
  if (freq === 'once_per_visit') {
    return false;
  }
  if (freq === 'once_per_day') {
    return now - storedTime > 24 * 60 * 60 * 1000;
  }
  if (freq === 'once_per_week') {
    return now - storedTime > 7 * 24 * 60 * 60 * 1000;
  }

  return true;
}

function markPopupShown(popup: PopupAd) {
  const freq = popup.frequency;
  if (freq === 'always') return;

  const key = getStorageKey(popup, freq);
  if (!key) return;

  if (freq === 'once_per_day' || freq === 'once_per_week') {
    localStorage.setItem(key, Date.now().toString());
  } else {
    sessionStorage.setItem(key, Date.now().toString());
    localStorage.setItem(key, Date.now().toString());
  }
}

function checkCooldown(popup: PopupAd): boolean {
  if (popup.cooldown_minutes <= 0) return true;
  const key = `popup_ad_${popup.id}_cooldown`;
  const stored = localStorage.getItem(key);
  if (!stored) return true;
  const elapsed = Date.now() - parseInt(stored, 10);
  return elapsed > popup.cooldown_minutes * 60 * 1000;
}

function setCooldown(popup: PopupAd) {
  if (popup.cooldown_minutes <= 0) return;
  localStorage.setItem(`popup_ad_${popup.id}_cooldown`, Date.now().toString());
}

function matchesPageTargets(popup: PopupAd, currentPath: string): boolean {
  if (popup.exclude_pages && popup.exclude_pages.length > 0) {
    for (const ex of popup.exclude_pages) {
      if (ex === 'home' && currentPath === '/') return false;
      if (currentPath.startsWith(ex)) return false;
    }
  }
  if (!popup.page_targets || popup.page_targets.length === 0) return true;
  for (const target of popup.page_targets) {
    if (target === 'all') return true;
    if (target === 'home' && currentPath === '/') return true;
    if (currentPath.startsWith(target)) return true;
  }
  return false;
}

export default function PopupAdContainer({ currentPath }: { currentPath: string }) {
  const [popup, setPopup] = useState<PopupAd | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackImpressions = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchPopup();
  }, [currentPath]);

  useEffect(() => {
    if (!popup || dismissed) return;

    const delayTimer = setTimeout(() => {
      if (!shouldShowPopup(popup) || !checkCooldown(popup)) {
        return;
      }
      setVisible(true);
      markPopupShown(popup);
      setCooldown(popup);

      if (!trackImpressions.current.has(popup.id)) {
        trackImpressions.current.add(popup.id);
        supabase
          .from('popup_ads')
          .update({ impression_count: (popup.impression_count || 0) + 1 })
          .eq('id', popup.id);
      }

      if (popup.display_duration > 0) {
        closeTimerRef.current = setTimeout(() => {
          setVisible(false);
          setDismissed(true);
        }, popup.display_duration * 1000);
      }
    }, popup.delay_seconds * 1000);

    return () => {
      clearTimeout(delayTimer);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [popup, dismissed]);

  const fetchPopup = async () => {
    try {
      const now = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('popup_ads')
        .select('*')
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const matching = (data as PopupAd[]).find(p => matchesPageTargets(p, currentPath));
        if (matching) {
          setPopup(matching);
        }
      }
    } catch (err) {
      console.error('Failed to fetch popup ad:', err);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setDismissed(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  const handleCTAClick = async () => {
    if (popup) {
      await supabase
        .from('popup_ads')
        .update({ click_count: (popup.click_count || 0) + 1 })
        .eq('id', popup.id);
    }
  };

  if (!popup || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      />

      <div
        className={cn(
          'relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden',
          'animate-in zoom-in-95 duration-300'
        )}
      >
        {popup.close_button_enabled && (
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-20 p-1.5 bg-white/90 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shadow-sm"
            aria-label="Close popup"
          >
            <X size={18} />
          </button>
        )}

        <div className="absolute top-2 left-3 text-[10px] text-gray-400 uppercase tracking-wider z-10">
          Advertisement
        </div>

        {popup.image_url && (
          <div className="relative w-full h-48 overflow-hidden">
            <img
              src={popup.image_url}
              alt={popup.title || popup.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-5 space-y-3">
          {popup.title && (
            <h3 className="text-lg font-bold text-gray-900 leading-snug">{popup.title}</h3>
          )}
          {popup.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{popup.description}</p>
          )}
          {popup.cta_text && popup.cta_url && (
            <a
              href={popup.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCTAClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#145a2c] text-white rounded-xl text-sm font-semibold hover:bg-[#0f4020] transition-colors"
            >
              {popup.cta_text}
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
