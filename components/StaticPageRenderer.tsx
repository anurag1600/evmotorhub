import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { StaticPage } from '@/lib/types';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data } = await supabase
    .from('static_pages')
    .select('title, seo_title, seo_description')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!data) return { title: 'Page Not Found' };
  return {
    title: data.seo_title || data.title,
    description: data.seo_description || '',
  };
}

export default async function StaticPageComponent({ slug }: { slug: string }) {
  const { data: page } = await supabase
    .from('static_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!page) notFound();

  const pageData = page as StaticPage;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">{pageData.title}</h1>
        <div className="prose prose-lg max-w-none bg-white rounded-lg p-8 shadow-sm">
          <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
        </div>
      </div>
    </div>
  );
}
