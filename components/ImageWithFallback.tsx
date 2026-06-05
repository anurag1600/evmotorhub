'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

const PLACEHOLDER_SCOOTER = 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=600';
const PLACEHOLDER_CAR = 'https://images.pexels.com/photos/3422964/pexels-photo-3422964.jpeg?auto=compress&cs=tinysrgb&w=600';
const PLACEHOLDER_NEWS = 'https://images.pexels.com/photos/97075/pexels-photo-97075.jpeg?auto=compress&cs=tinysrgb&w=600';
const PLACEHOLDER_GENERAL = 'https://images.pexels.com/photos/1105325/pexels-photo-1105325.jpeg?auto=compress&cs=tinysrgb&w=600';

export function getPlaceholderImage(category: 'vehicle' | 'news' | 'manufacturer' | 'general' = 'general'): string {
  switch (category) {
    case 'vehicle': return PLACEHOLDER_SCOOTER;
    case 'news': return PLACEHOLDER_NEWS;
    case 'manufacturer': return PLACEHOLDER_GENERAL;
    default: return PLACEHOLDER_GENERAL;
  }
}

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackCategory?: 'vehicle' | 'news' | 'manufacturer' | 'general';
  fallbackSrc?: string;
}

export default function ImageWithFallback({
  src,
  fallbackCategory = 'general',
  fallbackSrc,
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc || getPlaceholderImage(fallbackCategory));
  const [errored, setErrored] = useState(false);

  const handleError = () => {
    if (!errored) {
      setErrored(true);
      setImgSrc(fallbackSrc || getPlaceholderImage(fallbackCategory));
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      onError={handleError}
      unoptimized={typeof imgSrc === 'string' && imgSrc.includes('pexels.com') ? false : true}
      {...props}
    />
  );
}
