'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/lib/admin-context';
import { LayoutGrid, FileText, Car, Package, TrendingUp, CircleAlert as AlertCircle, ArrowRight, Loader as Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalVehicles: number;
  totalNews: number;
  draftVehicles: number;
  draftNews: number;
  upcomingVehicles: number;
  activeManufacturers: number;
}

const statCards = [
  { label: 'Total Vehicles', key: 'totalVehicles', icon: Car, color: 'bg-blue-50 text-blue-600' },
  { label: 'Total News Articles', key: 'totalNews', icon: FileText, color: 'bg-purple-50 text-purple-600' },
  { label: 'Draft Vehicles', key: 'draftVehicles', icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
  { label: 'Draft Articles', key: 'draftNews', icon: FileText, color: 'bg-red-50 text-red-600' },
  { label: 'Upcoming EVs', key: 'upcomingVehicles', icon: TrendingUp, color: 'bg-green-50 text-[#145a2c]' },
  { label: 'Active Brands', key: 'activeManufacturers', icon: Package, color: 'bg-indigo-50 text-indigo-600' },
];

const quickActions = [
  { label: 'Add New Vehicle', href: '/admin/vehicles/new', icon: Car },
  { label: 'Add News Article', href: '/admin/news/new', icon: FileText },
  { label: 'Manage Manufacturers', href: '/admin/manufacturers', icon: Package },
  { label: 'Manage Charging Stations', href: '/admin/charging', icon: Car },
  { label: 'Manage FAQ', href: '/admin/faq', icon: 'help' },
  { label: 'Update SEO Settings', href: '/admin/seo', icon: 'settings' },
];

export default function AdminDashboard() {
  const { isAdmin } = useAdmin();
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    totalNews: 0,
    draftVehicles: 0,
    draftNews: 0,
    upcomingVehicles: 0,
    activeManufacturers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [vehiclesRes, newsRes, manufacturersRes] = await Promise.all([
          supabase.from('vehicles').select('id, status, is_upcoming'),
          supabase.from('news').select('id, status'),
          supabase.from('manufacturers').select('id').eq('is_featured', true),
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
          activeManufacturers: manufacturers.length,
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

        {/* Stats Grid */}
        <div className="admin-grid-3 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            const value = stats[card.key as keyof DashboardStats];
            return (
              <div key={card.key} className="admin-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('p-2.5 rounded-lg', card.color)}>
                    <Icon size={18} />
                  </div>
                  {loading && <Loader2 size={14} className="text-gray-400 animate-spin" />}
                </div>
                <div className="text-xs text-gray-500 mb-1">{card.label}</div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Actions Card */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                  <ArrowRight size={14} className="text-gray-400" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Important Notes</h2>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="text-xs font-semibold text-blue-700 mb-1">System Status</div>
                <p className="text-xs text-blue-600">All systems operational. Database connected.</p>
              </div>
              {stats.draftVehicles > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <div className="text-xs font-semibold text-amber-700 mb-1">Draft Vehicles</div>
                  <p className="text-xs text-amber-600">You have {stats.draftVehicles} vehicles in draft.</p>
                </div>
              )}
              {stats.draftNews > 0 && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="text-xs font-semibold text-red-700 mb-1">Draft Articles</div>
                  <p className="text-xs text-red-600">You have {stats.draftNews} articles in draft.</p>
                </div>
              )}
              {stats.upcomingVehicles > 0 && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="text-xs font-semibold text-[#145a2c] mb-1">Upcoming Vehicles</div>
                  <p className="text-xs text-green-600">{stats.upcomingVehicles} vehicles launching soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Management Links */}
        <div className="mt-8 p-6 admin-card border-2 border-green-100 bg-green-50">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Need Help?</h2>
          <p className="text-sm text-gray-600 mb-4">
            Use the navigation menu on the left to manage your content. Click on any section to view, add, edit, or delete items.
          </p>
          <div className="flex gap-3">
            <Link href="/admin/news" className="admin-btn-primary">
              <FileText size={14} />
              Manage News
            </Link>
            <Link href="/admin/vehicles" className="admin-btn-primary">
              <Car size={14} />
              Manage Vehicles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
