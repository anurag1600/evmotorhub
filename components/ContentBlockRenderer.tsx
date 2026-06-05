'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ContentBlock } from '@/lib/types';

interface ContentBlockRendererProps {
  blocks: ContentBlock[];
}

export default function ContentBlockRenderer({ blocks }: ContentBlockRendererProps) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  const d = block.data;

  switch (block.type) {
    case 'paragraph':
      return <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4">{d.text}</p>;

    case 'heading1':
      return <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-8 mb-4">{d.text}</h1>;
    case 'heading2':
      return <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-6 mb-3">{d.text}</h2>;
    case 'heading3':
      return <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-5 mb-2">{d.text}</h3>;
    case 'heading4':
      return <h4 className="text-base sm:text-lg font-bold text-gray-800 mt-4 mb-2">{d.text}</h4>;
    case 'heading5':
      return <h5 className="text-sm sm:text-base font-bold text-gray-800 mt-4 mb-2">{d.text}</h5>;
    case 'heading6':
      return <h6 className="text-xs sm:text-sm font-bold text-gray-700 mt-3 mb-1 uppercase tracking-wide">{d.text}</h6>;

    case 'unordered_list':
      return (
        <ul className="list-disc pl-5 mb-4 space-y-1.5">
          {(d.items || []).map((item: string, i: number) => (
            <li key={i} className="text-gray-700 text-sm sm:text-base">{item}</li>
          ))}
        </ul>
      );

    case 'ordered_list':
      return (
        <ol className="list-decimal pl-5 mb-4 space-y-1.5">
          {(d.items || []).map((item: string, i: number) => (
            <li key={i} className="text-gray-700 text-sm sm:text-base">{item}</li>
          ))}
        </ol>
      );

    case 'table':
      return (
        <div className="overflow-x-auto mb-4 rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {(d.headers || []).map((h: string, i: number) => (
                  <th key={i} className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(d.rows || []).map((row: string[], ri: number) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  {row.map((cell: string, ci: number) => (
                    <td key={ci} className="px-4 py-3 text-gray-700 border-b border-gray-50">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'image':
      return (
        <figure className="mb-4">
          {d.url && (
            <div className="relative rounded-xl overflow-hidden h-64 sm:h-80">
              <Image src={d.url} alt={d.alt || d.caption || 'Article image'} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 65vw" unoptimized />
            </div>
          )}
          {d.caption && <figcaption className="text-xs text-gray-500 mt-2 text-center">{d.caption}</figcaption>}
        </figure>
      );

    case 'youtube': {
      const videoId = extractYoutubeId(d.url);
      return (
        <div className="mb-4">
          {videoId ? (
            <div className="relative rounded-xl overflow-hidden aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={d.title || 'YouTube video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          ) : (
            <div className="bg-gray-100 rounded-xl p-6 text-center text-sm text-gray-500">
              Invalid YouTube URL
            </div>
          )}
          {d.title && <p className="text-xs text-gray-500 mt-2">{d.title}</p>}
        </div>
      );
    }

    case 'blockquote':
      return (
        <blockquote className="border-l-4 border-green-400 pl-5 pr-4 py-3 my-4 bg-green-50 rounded-r-xl">
          <p className="text-gray-700 italic text-sm sm:text-base leading-relaxed">{d.text}</p>
          {d.author && <footer className="text-xs text-gray-500 mt-2 not-italic">- {d.author}</footer>}
        </blockquote>
      );

    case 'button':
      return (
        <div className="my-4">
          <Link
            href={d.url || '#'}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
              d.style === 'primary' ? 'bg-[#145a2c] hover:bg-[#0f4020] text-white' :
              d.style === 'dark' ? 'bg-gray-900 hover:bg-gray-800 text-white' :
              'border-2 border-[#145a2c] text-[#145a2c] hover:bg-green-50'
            }`}
          >
            {d.text || 'Click Here'}
          </Link>
        </div>
      );

    case 'html':
      if (!d.code) return null;
      return <div className="my-4" dangerouslySetInnerHTML={{ __html: d.code }} />;

    case 'divider':
      return <hr className="border-gray-200 my-6" />;

    case 'product_card':
      return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm my-4">
          <div className="flex flex-col sm:flex-row">
            {d.image_url && (
              <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0">
                <Image src={d.image_url} alt={d.title || 'Product'} fill className="object-cover" sizes="200px" unoptimized />
              </div>
            )}
            <div className="p-5 flex-1">
              {d.badge && (
                <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full mb-2">{d.badge}</span>
              )}
              <h3 className="text-lg font-bold text-gray-900 mb-1">{d.title || 'Product'}</h3>
              {d.price && <p className="text-xl font-extrabold text-[#145a2c] mb-2">{d.price}</p>}
              {d.description && <p className="text-sm text-gray-600 leading-relaxed mb-3">{d.description}</p>}
              {d.link_url && (
                <Link href={d.link_url} className="inline-flex items-center gap-1 text-sm font-semibold text-[#145a2c] hover:underline">
                  View Details &rarr;
                </Link>
              )}
            </div>
          </div>
        </div>
      );

    case 'vehicle_comparison':
      return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm my-4">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Vehicle Comparison
            </h3>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className="p-5">
              <h4 className="font-bold text-gray-900 text-sm mb-3">{d.vehicle1_name || 'Vehicle 1'}</h4>
              {d.vehicle1_specs && typeof d.vehicle1_specs === 'object' && Object.entries(d.vehicle1_specs).map(([key, val]) => (
                <div key={key} className="flex justify-between text-xs py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">{key}</span>
                  <span className="font-medium text-gray-800">{String(val)}</span>
                </div>
              ))}
            </div>
            <div className="p-5">
              <h4 className="font-bold text-gray-900 text-sm mb-3">{d.vehicle2_name || 'Vehicle 2'}</h4>
              {d.vehicle2_specs && typeof d.vehicle2_specs === 'object' && Object.entries(d.vehicle2_specs).map(([key, val]) => (
                <div key={key} className="flex justify-between text-xs py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">{key}</span>
                  <span className="font-medium text-gray-800">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
          {d.verdict && (
            <div className="p-4 bg-green-50 border-t border-green-100">
              <p className="text-sm text-green-800 font-medium">{d.verdict}</p>
            </div>
          )}
        </div>
      );

    case 'image_gallery':
      return (
        <div className="my-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(d.images || []).map((img: { url: string; caption: string }, i: number) => (
              img.url ? (
                <figure key={i} className="relative rounded-xl overflow-hidden h-40 sm:h-48">
                  <Image src={img.url} alt={img.caption || ''} fill className="object-cover hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 33vw" unoptimized />
                  {img.caption && (
                    <figcaption className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-3 py-1.5">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ) : null
            ))}
          </div>
        </div>
      );

    case 'cta_banner':
      return (
        <div
          className="rounded-2xl p-6 sm:p-8 my-4 text-white"
          style={{ backgroundColor: d.background_color || '#145a2c' }}
        >
          <h3 className="text-xl sm:text-2xl font-bold mb-2">{d.title || ''}</h3>
          {d.description && <p className="text-sm opacity-90 mb-4">{d.description}</p>}
          {d.button_text && d.button_url && (
            <Link
              href={d.button_url}
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {d.button_text}
            </Link>
          )}
        </div>
      );

    default:
      return null;
  }
}

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}
