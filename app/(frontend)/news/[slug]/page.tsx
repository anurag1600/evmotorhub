import { notFound } from 'next/navigation';
import Image from 'next/image';
import ImageWithFallback from '@/components/ImageWithFallback';
import Link from 'next/link';
import { Metadata } from 'next';
import { Clock, ChevronRight, Tag, ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NewsArticle } from '@/lib/types';
import { getCategoryColor, getCategoryLabel, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import NewsCard from '@/components/NewsCard';
import ContentBlockRenderer from '@/components/ContentBlockRenderer';
import { getSeoSettings, buildNoindexMeta, buildCanonicalUrl } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const [seo, { data }] = await Promise.all([
    getSeoSettings(),
    supabase.from('news').select('title, excerpt').eq('slug', params.slug).maybeSingle(),
  ]);

  if (!data) return { title: 'Article Not Found' };
  return {
    title: `${data.title} - EV News & Reviews`,
    description: data.excerpt,
    ...buildNoindexMeta('news', seo),
    ...buildCanonicalUrl(`/news/${params.slug}`, seo),
  };
}

function ArticleSchema({ article }: { article: NewsArticle }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': article.title,
    'description': article.excerpt,
    'image': article.image_url,
    'author': { '@type': 'Person', 'name': article.author, 'image': article.author_image },
    'datePublished': article.published_at,
    'publisher': {
      '@type': 'Organization',
      'name': 'EVMotorHub',
      'logo': { '@type': 'ImageObject', 'url': 'https://evmotorhub.in/EV_logo_White.webp' },
    },
    'mainEntityOfPage': { '@type': 'WebPage', '@id': `https://evmotorhub.in/news/${article.slug}` },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function BreadcrumbSchema({ article }: { article: NewsArticle }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://evmotorhub.in' },
      { '@type': 'ListItem', 'position': 2, 'name': 'News', 'item': 'https://evmotorhub.in/news' },
      { '@type': 'ListItem', 'position': 3, 'name': getCategoryLabel(article.category), 'item': `https://evmotorhub.in/news?category=${article.category}` },
      { '@type': 'ListItem', 'position': 4, 'name': article.title },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

async function getArticle(slug: string) {
  const { data } = await supabase
    .from('news')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return data as NewsArticle | null;
}

async function getRelated(category: string, id: string) {
  const { data } = await supabase
    .from('news')
    .select('id, title, slug, image_url, category, published_at, author, excerpt')
    .eq('category', category)
    .neq('id', id)
    .order('published_at', { ascending: false })
    .limit(3);
  return (data || []) as NewsArticle[];
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const [related, seo] = await Promise.all([
    getRelated(article.category, article.id),
    getSeoSettings(),
  ]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {seo?.schema_article !== false && <ArticleSchema article={article} />}
      {seo?.schema_breadcrumb !== false && <BreadcrumbSchema article={article} />}
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link href="/" className="hover:text-[#145a2c]">Home</Link>
            <ChevronRight size={12} />
            <Link href="/news" className="hover:text-[#145a2c]">News</Link>
            <ChevronRight size={12} />
            <Link href={`/news?category=${article.category}`} className="hover:text-[#145a2c]">
              {getCategoryLabel(article.category)}
            </Link>
            <ChevronRight size={12} />
            <span className="text-gray-900 font-medium line-clamp-1">{article.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Article */}
          <article className="lg:col-span-2">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              {/* Cover Image */}
              <div className="relative h-56 sm:h-72 lg:h-80">
                <ImageWithFallback
                  src={article.image_url}
                  alt={article.title}
                  fallbackCategory="news"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className={cn('absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full', getCategoryColor(article.category))}>
                  {getCategoryLabel(article.category)}
                </span>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug mb-4">
                  {article.title}
                </h1>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    {article.author_image && (
                      <Image
                        src={article.author_image}
                        alt={article.author}
                        width={36}
                        height={36}
                        className="rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{article.author}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(article.published_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    {article.read_time_mins} min read
                  </div>
                </div>

                {/* Excerpt */}
                <p className="text-base text-gray-600 leading-relaxed mb-6 font-medium border-l-4 border-green-400 pl-4 bg-green-50 py-3 rounded-r-xl">
                  {article.excerpt}
                </p>

                {/* Body Content */}
                {article.content_blocks && article.content_blocks.length > 0 ? (
                  <ContentBlockRenderer blocks={article.content_blocks} />
                ) : (
                  <div
                    className="article-content text-gray-700 text-sm sm:text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />
                )}

                {/* Tags */}
                {article.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag size={14} className="text-gray-400" />
                      {article.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-green-100 hover:text-green-700 cursor-pointer transition-colors">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Back */}
            <div className="mt-5">
              <Link href="/news" className="inline-flex items-center gap-2 text-sm text-[#145a2c] font-medium hover:gap-3 transition-all">
                <ArrowLeft size={14} /> Back to all articles
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Related Articles */}
            {related.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Related Articles</h3>
                <div className="space-y-4">
                  {related.map((a) => (
                    <Link key={a.id} href={`/news/${a.slug}`} className="group flex gap-3 items-start">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <ImageWithFallback src={a.image_url} alt={a.title} fallbackCategory="news" fill className="object-cover" sizes="64px" />
                      </div>
                      <div>
                        <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded mb-1 inline-block', getCategoryColor(a.category))}>
                          {getCategoryLabel(a.category)}
                        </span>
                        <p className="text-xs text-gray-700 font-medium line-clamp-2 group-hover:text-[#145a2c] transition-colors">
                          {a.title}
                        </p>
                        <span className="text-xs text-gray-400 mt-0.5 block">{timeAgo(a.published_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/news" className="flex items-center gap-1 text-sm text-[#145a2c] font-medium mt-4 hover:gap-2 transition-all">
                  View all articles <ArrowRight size={13} />
                </Link>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-[#0f4020] to-[#145a2c] rounded-2xl p-5 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wide mb-3 text-green-200">Explore EVs</h3>
              <div className="space-y-2">
                {[
                  { label: 'Best EV Scooters', href: '/vehicles?type=scooter' },
                  { label: 'Best EV Cars', href: '/vehicles?type=car' },
                  { label: 'Compare EVs', href: '/compare' },
                  { label: 'EMI Calculator', href: '/emi-calculator' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2.5 transition-colors text-sm"
                  >
                    {item.label}
                    <ArrowRight size={13} className="text-green-300" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* More Articles */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-5">More {getCategoryLabel(article.category)} Articles</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((a) => (
                <NewsCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
