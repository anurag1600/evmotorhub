'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/lib/admin-context';
import {
  LayoutGrid, FileText, Car, Package, TrendingUp, CircleAlert as AlertCircle,
  ArrowRight, Loader as Loader2, Zap, ClipboardCheck, Upload, Mail, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalVehicles: number;
  totalNews: number;
  draftVehicles: number;
  draftNews: number;
  upcomingVehicles: number;
  totalManufacturers: number;
  activeManufacturers: number;
  chargingStations: number;
  pendingManufacturerSubs: number;
  pendingVehicleSubs: number;
  pendingChargingSubs: number;
}

export default function AdminDashboard() {
  const { isAdmin } = useAdmin();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    totalNews: 0,
    draftVehicles: 0,
    draftNews: 0,
    upcomingVehicles: 0,
    totalManufacturers: 0,
    activeManufacturers: 0,
    chargingStations: 0,
    pendingManufacturerSubs: 0,
    pendingVehicleSubs: 0,
    pendingChargingSubs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          vehiclesRes, newsRes, manufacturersRes, allMfgRes,
          chargingRes, mfgSubsRes, vehicleSubsRes, chargingSubsRes
        ] = await Promise.all([
          supabase.from('vehicles').select('id, status, is_upcoming'),
          supabase.from('news').select('id, status'),
          supabase.from('manufacturers').select('id, is_featured, status'),
          supabase.from('manufacturers').select('id', { count: 'exact', head: true }),
          supabase.from('charging_stations').select('id', { count: 'exact', head: true }),
          supabase.from('manufacturer_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('vehicle_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('charging_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);

        const vehicles = vehiclesRes.data || [];
        const news = newsRes.data || [];
        const manufacturers = manufacturersRes.data || [];

        setStats({
          totalVehicles: vehicles.length,
          totalNews: news.length,
          draftVehicles: vehicles.filter((v: any) => v.status === 'draft').length,
          draftNews: news.filter((n: any) => n.status === 'draft').length,
          upcomingVehicles: vehicles.filter((v: any) => v.is_upcoming).length,
          totalManufacturers: allMfgRes.count || 0,
          activeManufacturers: manufacturers.filter((m: any) => m.is_featured).length,
          chargingStations: chargingRes.count || 0,
          pendingManufacturerSubs: mfgSubsRes.count || 0,
          pendingVehicleSubs: vehicleSubsRes.count || 0,
          pendingChargingSubs: chargingSubsRes.count || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return null;
  }

  const overviewCards = [
    { label: 'Total Vehicles', value: stats.totalVehicles, icon: Car, color: 'bg-blue-50 text-blue-600', href: '/admin/vehicles' },
    { label: 'Total Manufacturers', value: stats.totalManufacturers, icon: Package, color: 'bg-indigo-50 text-indigo-600', href: '/admin/manufacturers' },
    { label: 'Active Brands', value: stats.activeManufacturers, icon: TrendingUp, color: 'bg-green-50 text-[#145a2c]', href: '/admin/manufacturers' },
    { label: 'Total News', value: stats.totalNews, icon: FileText, color: 'bg-purple-50 text-purple-600', href: '/admin/news' },
    { label: 'Charging Stations', value: stats.chargingStations, icon: Zap, color: 'bg-teal-50 text-teal-600', href: '/admin/charging' },
    { label: 'Upcoming EVs', value: stats.upcomingVehicles, icon: TrendingUp, color: 'bg-cyan-50 text-cyan-600', href: '/admin/vehicles' },
  ];

  const pendingItems = [
    { label: 'Manufacturer Submissions', value: stats.pendingManufacturerSubs, icon: ClipboardCheck, href: '/admin/manufacturer-submissions', color: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
    { label: 'Vehicle Submissions', value: stats.pendingVehicleSubs, icon: Upload, href: '/admin/vehicle-submissions', color: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
    { label: 'Charging Submissions', value: stats.pendingChargingSubs, icon: Zap, href: '/admin/charging-submissions', color: 'bg-amber-50 text-amber-600', border: 'border-amber-100' },
  ];

  const hasPendingWork = stats.pendingManufacturerSubs > 0 || stats.pendingVehicleSubs > 0 || stats.pendingChargingSubs > 0;

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <LayoutGrid size={28} className="text-[#145a2c]" />
              Dashboard
            </h1>
            <p className="admin-subtitle">Welcome to EVMotorHub Admin Panel</p>
          </div>
        </div>

        {/* Overview Stats Grid */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Overview</h2>
          <div className="admin-grid-3">
            {overviewCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.label} href={card.href} className="admin-card p-6 hover:shadow-md transition-shadow group">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn('p-2.5 rounded-lg', card.color)}>
                      <Icon size={18} />
                    </div>
                    {loading && <Loader2 size={14} className="text-gray-400 animate-spin" />}
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                  <div className="text-xs text-gray-500 mb-1">{card.label}</div>
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pending Submissions Section */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock size={14} className="text-amber-500" />
            Needs Attention
          </h2>
          <div className="admin-grid-3">
            {pendingItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'admin-card p-6 hover:shadow-md transition-shadow group border-2',
                    item.value > 0 ? item.border : 'border-transparent'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn('p-2.5 rounded-lg', item.color)}>
                      <Icon size={18} />
                    </div>
                    {item.value > 0 && (
                      <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                  {item.value > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-medium text-[#145a2c] group-hover:gap-2 transition-all">
                      Review now <ArrowRight size={12} />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
          {!hasPendingWork && !loading && (
            <div className="mt-3 text-sm text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              All caught up — no pending submissions.
            </div>
          )}
        </div>

        {/* Drafts & Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Drafts + Alerts */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Status Overview</h2>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="text-xs font-semibold text-blue-700 mb-1">System Status</div>
                <p className="text-xs text-blue-600">All systems operational. Database connected.</p>
              </div>
              {stats.draftVehicles > 0 && (
                <Link href="/admin/vehicles" className="block p-3 bg-amber-50 border border-amber-100 rounded-lg hover:border-amber-200 transition-colors">
                  <div className="text-xs font-semibold text-amber-700 mb-1">Draft Vehicles</div>
                  <p className="text-xs text-amber-600">You have {stats.draftVehicles} vehicles in draft.</p>
                </Link>
              )}
              {stats.draftNews > 0 && (
                <Link href="/admin/news" className="block p-3 bg-red-50 border border-red-100 rounded-lg hover:border-red-200 transition-colors">
                  <div className="text-xs font-semibold text-red-700 mb-1">Draft Articles</div>
                  <p className="text-xs text-red-600">You have {stats.draftNews} articles in draft.</p>
                </Link>
              )}
              {stats.upcomingVehicles > 0 && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="text-xs font-semibold text-[#145a2c] mb-1">Upcoming Vehicles</div>
                  <p className="text-xs text-green-600">{stats.upcomingVehicles} vehicles launching soon.</p>
                </div>
              )}
              {stats.draftVehicles === 0 && stats.draftNews === 0 && (
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                  <p className="text-xs text-gray-500">No drafts pending publication.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Add New Vehicle', href: '/admin/vehicles/new', icon: Car },
                { label: 'Add News Article', href: '/admin/news/new', icon: FileText },
                { label: 'Manage Manufacturers', href: '/admin/manufacturers', icon: Package },
                { label: 'Manage Charging Stations', href: '/admin/charging', icon: Zap },
                { label: 'Review Submissions', href: '/admin/manufacturer-submissions', icon: ClipboardCheck },
                { label: 'Update SEO Settings', href: '/admin/seo', icon: FileText },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200 group"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <action.icon size={15} className="text-gray-400 group-hover:text-[#145a2c] transition-colors" />
                    {action.label}
                  </span>
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
