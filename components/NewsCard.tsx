import Link from 'next/link';
import Image from 'next/image';
import ImageWithFallback from '@/components/ImageWithFallback';
import { Clock, ArrowRight, Tag } from 'lucide-react';
import { NewsArticle } from '@/lib/types';
import { getCategoryLabel, getCategoryColor, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

interface NewsCardProps {
  article: NewsArticle;
  featured?: boolean;
}

export default function NewsCard({ article, featured = false }: NewsCardProps) {
  if (featured) {
    return (
      <Link href={`/news/${article.slug}`} className="group block">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 ev-card-hover md:flex">
          <div className="relative md:w-2/5 h-52 md:h-auto overflow-hidden">
            <ImageWithFallback
              src={article.image_url}
              alt={article.title}
              fallbackCategory="news"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <span className={cn('absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full', getCategoryColor(article.category))}>
              {getCategoryLabel(article.category)}
            </span>
          </div>
          <div className="p-5 md:p-6 flex flex-col justify-between md:w-3/5">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {article.read_time_mins} min read
                </span>
                <span>•</span>
                <span>{timeAgo(article.published_at)}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-xl leading-snug mb-3 group-hover:text-[#145a2c] transition-colors">
                {article.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-3">{article.excerpt}</p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                {article.author_image && (
                  <Image
                    src={article.author_image}
                    alt={article.author}
                    width={28}
                    height={28}
                    className="rounded-full object-cover"
                  />
                )}
                <span className="text-sm text-gray-700 font-medium">{article.author}</span>
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-[#145a2c] group-hover:gap-2 transition-all">
                Read More <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/news/${article.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 ev-card-hover h-full flex flex-col">
        <div className="relative h-44 overflow-hidden">
          <ImageWithFallback
            src={article.image_url}
            alt={article.title}
            fallbackCategory="news"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <span className={cn('absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full', getCategoryColor(article.category))}>
            {getCategoryLabel(article.category)}
          </span>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2.5">
            <Clock size={11} />
            <span>{article.read_time_mins} min read</span>
            <span>•</span>
            <span>{timeAgo(article.published_at)}</span>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 group-hover:text-[#145a2c] transition-colors line-clamp-2 flex-1">
            {article.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{article.excerpt}</p>
          {article.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-auto">
              <Tag size={11} className="text-gray-400" />
              {article.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
