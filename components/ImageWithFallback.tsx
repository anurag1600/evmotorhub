'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

const PLACEHOLDER_SVG = '/no-image-found.svg';

export function getPlaceholderImage(
  fallbackCategory?: string
): string {
  return PLACEHOLDER_SVG;
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
  ...props
}: ImageWithFallbackProps) {
  const resolvedSrc = src || fallbackSrc || getPlaceholderImage(fallbackCategory);
  const [imgSrc, setImgSrc] = useState(resolvedSrc);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setImgSrc(src || fallbackSrc || PLACEHOLDER_SVG);
    setErrored(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!errored) {
      setErrored(true);
      setImgSrc(PLACEHOLDER_SVG);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      onError={handleError}
      unoptimized
      {...props}
    />
  );
}
