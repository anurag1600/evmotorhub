'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Crumb {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  'vehicles': 'Vehicles',
  'news': 'News & Reviews',
  'manufacturers': 'Manufacturers',
  'charging-stations': 'Charging Stations',
  'compare': 'Compare',
  'emi-calculator': 'EMI Calculator',
  'faq': 'FAQ',
  'about': 'About Us',
  'contact': 'Contact',
  'privacy': 'Privacy Policy',
  'terms': 'Terms of Use',
  'disclaimer': 'Disclaimer',
  'register-company': 'Register Company',
};

export default function Breadcrumbs({ dynamicTitle }: { dynamicTitle?: string }) {
  const pathname = usePathname();

  if (pathname === '/' || pathname === '') return null;
  if (pathname.startsWith('/admin')) return null;

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs: Crumb[] = [{ label: 'Home', href: '/' }];

  let pathAccum = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    pathAccum += '/' + seg;
    const isLast = i === segments.length - 1;

    if (isLast && dynamicTitle) {
      crumbs.push({ label: dynamicTitle });
    } else {
      const label = routeLabels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
      crumbs.push({ label, href: isLast ? undefined : pathAccum });
    }
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-1 py-2.5 text-xs overflow-x-auto whitespace-nowrap scrollbar-hide">
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <li key={idx} className="flex items-center gap-1 flex-shrink-0">
                {idx === 0 && <Home size={13} className="text-gray-400" />}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="text-gray-500 hover:text-[#145a2c] transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn('font-medium', isLast ? 'text-gray-900' : 'text-gray-500')}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

export function DetailBreadcrumbs({ items }: { items: Crumb[] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="border-b border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-1 py-2.5 text-xs overflow-x-auto whitespace-nowrap scrollbar-hide">
          {items.map((crumb, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <li key={idx} className="flex items-center gap-1 flex-shrink-0">
                {idx === 0 && <Home size={13} className="text-gray-400" />}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="text-gray-500 hover:text-[#145a2c] transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn('font-medium', isLast ? 'text-gray-900' : 'text-gray-500')}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
