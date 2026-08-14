'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAdmin } from '@/lib/admin-context';
import { LayoutGrid, FileText, Car, Package, Image as ImageIcon, Settings, Menu, X, LogOut, Lock, Loader as Loader2, ChevronRight, Search, Chrome as Home, MessageSquare, Scale, CircleHelp as HelpCircle, Globe, Zap, FileSliders as Sliders, Mail, Megaphone, ShoppingBag, MapPin, Power, ClipboardCheck, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminMenuItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
  { label: 'News', href: '/admin/news', icon: FileText },
  { label: 'Vehicles', href: '/admin/vehicles', icon: Car },
  { label: 'Variant Management', href: '/admin/variants', icon: Power },
  { label: 'Manufacturers', href: '/admin/manufacturers', icon: Package },
  { label: 'Charging Stations', href: '/admin/charging', icon: Zap },
  { label: 'Pricing', href: '/admin/pricing', icon: MapPin },
  { label: 'Categories', href: '/admin/categories', icon: LayoutGrid },
  { label: 'Popular Comparisons', href: '/admin/comparisons', icon: Scale },
  { label: 'CMS Pages', href: '/admin/cms', icon: Globe },
  { label: 'FAQ', href: '/admin/faq', icon: HelpCircle },
  { label: 'Advertisements', href: '/admin/advertisements', icon: Megaphone },
  { label: 'Offer Enquiries', href: '/admin/offer-enquiries', icon: ShoppingBag },
  { label: 'Manufacturer Submissions', href: '/admin/manufacturer-submissions', icon: ClipboardCheck },
  { label: 'Vehicle Submissions', href: '/admin/vehicle-submissions', icon: Upload },
  { label: 'Charging Submissions', href: '/admin/charging-submissions', icon: Zap },
  { label: 'Contact Submissions', href: '/admin/contact-submissions', icon: Mail },
  { label: 'Homepage Settings', href: '/admin/settings', icon: Home },
  { label: 'Contact Settings', href: '/admin/contact', icon: MessageSquare },
  { label: 'Footer Settings', href: '/admin/footer', icon: Sliders },
  { label: 'SEO Settings', href: '/admin/seo', icon: Search },
];

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { adminUser, logout, loading, isAdmin } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Redirect if not admin
  { label: 'Charging Submissions', href: '/admin/charging-submissions', icon: Zap },
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/admin/login');
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="text-[#145a2c] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-gray-100 flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <Link href="/admin/dashboard" className="inline-block">
            <Image
              src="/EV_logo_White.webp"
              alt="EVMotorHub Admin"
              width={140}
              height={35}
              className="h-8 w-auto"
              style={{ filter: 'invert(1) sepia(1) saturate(2) hue-rotate(95deg) brightness(0.4)' }}
            />
          </Link>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Lock size={12} />
            Admin Portal
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-1">
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#145a2c] text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Icon size={16} />
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-gray-100 space-y-3">
          {adminUser && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Logged in as</div>
              <div className="text-sm font-semibold text-gray-900 truncate">{adminUser.email}</div>
              <div className="text-xs text-green-600 mt-1 capitalize">
                {adminUser.role === 'super_admin' ? 'Super Admin' : 'Editor'}
              </div>
            </div>
          )}
          <Link
            href="/admin/change-password"
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors',
              pathname === '/admin/change-password' && 'bg-[#145a2c] text-white'
            )}
          >
            <Settings size={14} />
            Change Password
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-40">
        <div className="flex items-center justify-between p-4">
          <Image
            src="/EV_logo_White.webp"
            alt="EVMotorHub"
            width={120}
            height={30}
            className="h-6 w-auto"
            style={{ filter: 'invert(1) sepia(1) saturate(2) hue-rotate(95deg) brightness(0.4)' }}
          />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 hover:bg-gray-50 rounded-lg"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <nav className="bg-gray-50 border-t border-gray-100 p-3 space-y-1">
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                    isActive ? 'bg-[#145a2c] text-white' : 'text-gray-600'
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => { setMobileOpen(false); handleLogout(); }}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </nav>
        )}
      </div>

      {/* Spacer for mobile */}
      {mobileOpen && <div className="md:hidden h-12" />}
    </>
  );
}
