'use client';

import { usePathname } from 'next/navigation';
import PopupAdContainer from '@/components/PopupAd';

export default function PopupAdWrapper() {
  const pathname = usePathname();
  if (!pathname || pathname.startsWith('/admin')) return null;
  return <PopupAdContainer currentPath={pathname} />;
}
