'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MonitorPlay, ArrowLeft } from 'lucide-react';
import PopupForm from '@/components/admin/PopupForm';

export default function NewPopupAdPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/advertisements/popups" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MonitorPlay size={22} className="text-[#145a2c]" />
          Create Popup Ad
        </h1>
      </div>

      <PopupForm
        onSubmit={() => router.push('/admin/advertisements/popups')}
        onCancel={() => router.push('/admin/advertisements/popups')}
        submitLabel="Create Popup"
      />
    </div>
  );
}
