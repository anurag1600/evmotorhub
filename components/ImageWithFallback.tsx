'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

const PLACEHOLDER_IMAGE = '/images/placeholders/image.png';

export function getPlaceholderImage(
  fallbackCategory?: string
): string {
  return PLACEHOLDER_IMAGE;
}

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError' | 'src'> {
  src: string | null | undefined;
  fallbackSrc?: string;
  fallbackCategory?: string;
}

export default function ImageWithFallback({
  src,
  fallbackSrc,
  fallbackCategory,
  alt,
  priority,
  loading,
  ...props
}: ImageWithFallbackProps) {
  const resolvedSrc = src || fallbackSrc || getPlaceholderImage(fallbackCategory);
  const [imgSrc, setImgSrc] = useState(resolvedSrc);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    const newSrc = src || fallbackSrc || PLACEHOLDER_IMAGE;
    setImgSrc(newSrc);
    setErrored(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!errored) {
      setErrored(true);
      setImgSrc(PLACEHOLDER_IMAGE);
    }
  };

  // Priority images load immediately; all others default to lazy loading.
  // Never set both priority and loading='lazy' — Next.js throws a runtime error.
  const isPriority = priority ?? false;
  const resolvedLoading = isPriority ? undefined : (loading ?? 'lazy');

  return (
    <Image
      src={imgSrc}
      alt={alt}
      onError={handleError}
      unoptimized
      priority={isPriority || undefined}
      loading={resolvedLoading}
      {...props}
    />
  );
}
