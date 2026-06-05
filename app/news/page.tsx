'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NewsArticle } from '@/lib/types';
import NewsCard from '@/components/NewsCard';
import { getCategoryColor, getCategoryLabel, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

const categories = [
  { value: '', label: 'All' },
  { value: 'news', label: 'News' },
  { value: 'review', label: 'Reviews' },
  { value: 'launch', label: 'Launches' },
  { value: 'comparison', label: 'Comparisons' },
  { value: 'guide', label: 'Guides' },
];

export default function NewsPage() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('category') || '';

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [featured, setFeatured] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(catParam);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      let query = supabase.from('news').select('*').order('published_at', { ascending: false });
      if (category) query = query.eq('category', category);
      if (search) query = query.ilike('title', `%${search}%`);

      const { data } = await query.limit(30);
      if (data) {
        const feat = data.filter(a => a.is_featured);
        setFeatured(feat.slice(0, 2));
        setArticles(data);
      }
      setLoading(false);
    };
    fetchNews();
  }, [category, search]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a2e14] to-[#145a2c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">EV News &amp; Reviews</h1>
          <p className="text-green-200 text-sm">Latest updates on India&apos;s electric vehicle ecosystem</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#145a2c]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors',
                  category === c.value
                    ? 'bg-[#145a2c] text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-[#145a2c]'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Articles */}
        {!loading && featured.length > 0 && !category && !search && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Featured Articles</h2>
            <div className="space-y-4">
              {featured.map((article) => (
                <NewsCard key={article.id} article={article} featured />
              ))}
            </div>
          </div>
        )}

        {/* All Articles */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {category ? `${getCategoryLabel(category)} Articles` : 'All Articles'}
            {!loading && <span className="text-gray-400 font-normal text-base ml-2">({articles.length})</span>}
          </h2>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <div className="h-44 animate-shimmer" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-100 rounded animate-shimmer w-1/4" />
                    <div className="h-4 bg-gray-100 rounded animate-shimmer w-3/4" />
                    <div className="h-3 bg-gray-100 rounded animate-shimmer w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-300 text-5xl mb-4">📰</div>
              <p className="text-gray-600">No articles found. Try a different filter.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
