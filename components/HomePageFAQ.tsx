'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, CircleHelp as HelpCircle, ArrowRight } from 'lucide-react';
import { FAQItem } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const DEFAULT_HOMEPAGE_LIMIT = 6;

export default function HomePageFAQ() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [limit, setLimit] = useState(DEFAULT_HOMEPAGE_LIMIT);

  useEffect(() => {
    // Fetch the configured limit from site_config
    supabase
      .from('site_config')
      .select('faq_homepage_limit')
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]?.faq_homepage_limit) {
          setLimit(data[0].faq_homepage_limit);
        }
      });

    supabase
      .from('faq_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit)
      .then(({ data }) => setItems((data as FAQItem[]) || []));
  }, [limit]);

  if (items.length === 0) return null;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': items.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': item.answer },
    })),
  };

  return (
    <section className="py-14 md:py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-1">Got Questions?</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 text-sm pr-4">{item.question}</span>
                <ChevronDown size={18} className={cn('text-gray-400 flex-shrink-0 transition-transform', openId === item.id && 'rotate-180')} />
              </button>
              {openId === item.id && (
                <div className="px-5 pb-5 pt-0 border-t border-gray-50">
                  <p className="text-gray-600 text-sm leading-relaxed pt-4">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/faq" className="inline-flex items-center gap-1 text-[#145a2c] text-sm font-medium hover:gap-2 transition-all">
            View all FAQs <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
