'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { StaticPage } from '@/lib/types';
import { Loader as Loader2 } from 'lucide-react';

interface StaticPageRendererProps {
  slug: string;
}

export default function StaticPageRenderer({ slug }: StaticPageRendererProps) {
  const [page, setPage] = useState<StaticPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const { data, error } = await supabase
          .from('static_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (!data) {
          setNotFound(true);
        } else {
          setPage(data as StaticPage);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#145a2c]" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-500">The requested page could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">{page.title}</h1>
        <div className="prose prose-lg max-w-none bg-white rounded-lg p-8 shadow-sm">
          <div dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </div>
    </div>
  );
}
