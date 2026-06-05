import type { Metadata } from 'next';
import { AdminProvider } from '@/lib/admin-context';
import AdminNav from '@/components/admin/AdminNav';
import '@/components/admin/admin.css';

export const metadata: Metadata = {
  title: 'Admin Dashboard | EVMotorHub',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <div className="flex h-screen bg-gray-50">
        <AdminNav />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AdminProvider>
  );
}
