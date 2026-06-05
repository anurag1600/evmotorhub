import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { FAQItem } from '@/lib/types';
import FAQPageClient from './FAQPageClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | EVMotorHub',
  description: 'Find answers to common questions about electric vehicles in India - pricing, charging, subsidies, range, and more.',
};

async function getFAQItems() {
  const { data } = await supabase
    .from('faq_items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  return (data || []) as FAQItem[];
}

export default async function FAQPage() {
  const items = await getFAQItems();

  const faqSchema = items.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': items.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer,
      },
    })),
  } : null;

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <FAQPageClient items={items} />
    </>
  );
}
