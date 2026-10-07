'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MonitorPlay, ArrowLeft, Loader as Loader2 } from 'lucide-react';
import PopupForm from '@/components/admin/PopupForm';
import type { PopupAd } from '@/lib/types';

export default function EditPopupAdPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<PopupAd | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    supabase
      .from('popup_ads')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setPopup(data as PopupAd);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-gray-400" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/advertisements/popups" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MonitorPlay size={22} className="text-[#145a2c]" />
          Edit Popup Ad
        </h1>
      </div>

      <PopupForm
        initialData={popup}
        onSubmit={() => router.push('/admin/advertisements/popups')}
        onCancel={() => router.push('/admin/advertisements/popups')}
        submitLabel="Update Popup"
      />
    </div>
  );
}
