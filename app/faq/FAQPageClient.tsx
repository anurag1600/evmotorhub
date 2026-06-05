'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, CircleHelp as HelpCircle, Search, ArrowRight } from 'lucide-react';
import { FAQItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const categoryLabels: Record<string, string> = {
  general: 'General',
  vehicles: 'Vehicles',
  pricing: 'Pricing & EMI',
  charging: 'Charging',
  policy: 'Policy & Subsidy',
};

interface FAQPageClientProps {
  items: FAQItem[];
}

export default function FAQPageClient({ items }: FAQPageClientProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))];

  const filtered = items.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0a2e14] to-[#145a2c] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 text-sm font-medium px-4 py-2 rounded-full mb-4 border border-green-500/30">
            <HelpCircle size={14} />
            Help Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-300 text-base max-w-xl mx-auto mb-8">
            Find answers to common questions about electric vehicles, charging, pricing, and government subsidies in India.
          </p>
          <div className="max-w-md mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1.5 flex items-center gap-2 border border-white/10">
              <Search className="ml-3 text-gray-300 flex-shrink-0" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="flex-1 py-2.5 bg-transparent text-white text-sm placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filterCategory === cat
                  ? 'bg-[#145a2c] text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              )}
            >
              {cat === 'all' ? 'All' : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <HelpCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No questions found</h3>
            <p className="text-sm text-gray-500">Try a different search or category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenId(openId === item.id ? null : item.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full capitalize flex-shrink-0">
                      {categoryLabels[item.category] || item.category}
                    </span>
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{item.question}</span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={cn('text-gray-400 flex-shrink-0 ml-3 transition-transform', openId === item.id && 'rotate-180')}
                  />
                </button>
                {openId === item.id && (
                  <div className="px-5 pb-5 pt-0 border-t border-gray-50">
                    <p className="text-gray-600 text-sm leading-relaxed pt-4">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-[#0f4020] to-[#145a2c] rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-gray-300 text-sm mb-5">Our team is here to help you with any EV-related queries</p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-[#145a2c] px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-50 transition-colors">
            Contact Us <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
