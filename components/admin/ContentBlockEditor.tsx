'use client';

import { useState } from 'react';
import {
  Plus, Trash2, GripVertical, ChevronUp, ChevronDown,
  Type, Heading1, Heading2, Heading3, List, ListOrdered,
  Table as TableIcon, Image as ImageIcon, Youtube, Quote,
  MousePointer, Code, Minus, ShoppingCart, Scale, LayoutGrid,
  Megaphone, Eye
} from 'lucide-react';
import { ContentBlock, ContentBlockType } from '@/lib/types';
import ImageUpload from '@/components/ImageUpload';

interface ContentBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

const blockTypes: { type: ContentBlockType; label: string; icon: any; category: string }[] = [
  { type: 'paragraph', label: 'Paragraph', icon: Type, category: 'Text' },
  { type: 'heading1', label: 'Heading 1', icon: Heading1, category: 'Text' },
  { type: 'heading2', label: 'Heading 2', icon: Heading2, category: 'Text' },
  { type: 'heading3', label: 'Heading 3', icon: Heading3, category: 'Text' },
  { type: 'unordered_list', label: 'Bullet List', icon: List, category: 'Text' },
  { type: 'ordered_list', label: 'Numbered List', icon: ListOrdered, category: 'Text' },
  { type: 'table', label: 'Table', icon: TableIcon, category: 'Text' },
  { type: 'blockquote', label: 'Quote', icon: Quote, category: 'Text' },
  { type: 'divider', label: 'Divider', icon: Minus, category: 'Text' },
  { type: 'image', label: 'Image', icon: ImageIcon, category: 'Media' },
  { type: 'youtube', label: 'YouTube', icon: Youtube, category: 'Media' },
  { type: 'button', label: 'Button / Link', icon: MousePointer, category: 'Interactive' },
  { type: 'html', label: 'Custom HTML', icon: Code, category: 'Advanced' },
  { type: 'product_card', label: 'Product Card', icon: ShoppingCart, category: 'EV Sections' },
  { type: 'vehicle_comparison', label: 'Vehicle Comparison', icon: Scale, category: 'EV Sections' },
  { type: 'image_gallery', label: 'Image Gallery', icon: LayoutGrid, category: 'EV Sections' },
  { type: 'cta_banner', label: 'CTA Banner', icon: Megaphone, category: 'EV Sections' },
];

function genId() {
  return 'blk_' + Math.random().toString(36).substr(2, 9);
}

function defaultData(type: ContentBlockType): Record<string, any> {
  switch (type) {
    case 'paragraph': return { text: '' };
    case 'heading1': case 'heading2': case 'heading3': case 'heading4': case 'heading5': case 'heading6':
      return { text: '' };
    case 'unordered_list': case 'ordered_list': return { items: [''] };
    case 'table': return { headers: ['Column 1', 'Column 2'], rows: [['', '']] };
    case 'image': return { url: '', caption: '', alt: '' };
    case 'youtube': return { url: '', title: '' };
    case 'blockquote': return { text: '', author: '' };
    case 'button': return { text: 'Click Here', url: '#', style: 'primary' };
    case 'html': return { code: '' };
    case 'divider': return {};
    case 'product_card': return { title: '', price: '', image_url: '', description: '', link_url: '', badge: '' };
    case 'vehicle_comparison': return { vehicle1_name: '', vehicle1_specs: {}, vehicle2_name: '', vehicle2_specs: {}, verdict: '' };
    case 'image_gallery': return { images: [{ url: '', caption: '' }] };
    case 'cta_banner': return { title: '', description: '', button_text: '', button_url: '', background_color: '#145a2c' };
    default: return {};
  }
}

export default function ContentBlockEditor({ blocks, onChange }: ContentBlockEditorProps) {
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const addBlock = (type: ContentBlockType, afterIdx: number) => {
    const newBlocks = [...blocks];
    newBlocks.splice(afterIdx + 1, 0, { id: genId(), type, data: defaultData(type) });
    onChange(newBlocks);
    setShowAddMenu(null);
  };

  const removeBlock = (idx: number) => {
    onChange(blocks.filter((_, i) => i !== idx));
  };

  const moveBlock = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
    onChange(newBlocks);
  };

  const updateBlockData = (idx: number, data: Record<string, any>) => {
    const newBlocks = [...blocks];
    newBlocks[idx] = { ...newBlocks[idx], data };
    onChange(newBlocks);
  };

  const categories = Array.from(new Set(blockTypes.map(b => b.category)));

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">No content blocks yet</p>
          <button
            type="button"
            onClick={() => addBlock('paragraph', -1)}
            className="admin-btn-primary text-sm"
          >
            <Plus size={14} /> Add First Block
          </button>
        </div>
      )}

      {blocks.map((block, idx) => (
        <div key={block.id} className="border border-gray-200 rounded-xl bg-white group relative">
          {/* Block Header */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-t-xl border-b border-gray-100">
            <GripVertical size={14} className="text-gray-300" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-1">
              {blockTypes.find(b => b.type === block.type)?.label || block.type}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => moveBlock(idx, -1)} className="p-1 hover:bg-gray-200 rounded" title="Move up">
                <ChevronUp size={14} className="text-gray-500" />
              </button>
              <button type="button" onClick={() => moveBlock(idx, 1)} className="p-1 hover:bg-gray-200 rounded" title="Move down">
                <ChevronDown size={14} className="text-gray-500" />
              </button>
              <button type="button" onClick={() => setPreviewIdx(previewIdx === idx ? null : idx)} className="p-1 hover:bg-gray-200 rounded" title="Preview">
                <Eye size={14} className="text-gray-500" />
              </button>
              <div className="relative">
                <button type="button" onClick={() => setShowAddMenu(showAddMenu === idx ? null : idx)} className="p-1 hover:bg-green-100 rounded" title="Add block after">
                  <Plus size={14} className="text-green-600" />
                </button>
                {showAddMenu === idx && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2 max-h-80 overflow-y-auto">
                    {categories.map(cat => (
                      <div key={cat} className="mb-2">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">{cat}</div>
                        {blockTypes.filter(b => b.category === cat).map(bt => (
                          <button
                            key={bt.type}
                            type="button"
                            onClick={() => addBlock(bt.type, idx)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <bt.icon size={13} className="text-gray-400" />
                            {bt.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => removeBlock(idx)} className="p-1 hover:bg-red-50 rounded" title="Delete block">
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          </div>

          {/* Block Content */}
          <div className="p-4">
            <BlockEditor block={block} onChange={(data) => updateBlockData(idx, data)} preview={previewIdx === idx} />
          </div>
        </div>
      ))}

      {/* Add Block Button at bottom */}
      {blocks.length > 0 && (
        <div className="flex justify-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddMenu(showAddMenu === blocks.length - 1 ? null : blocks.length - 1)}
              className="flex items-center gap-1.5 text-sm text-[#145a2c] font-medium hover:bg-green-50 px-4 py-2 rounded-lg border border-dashed border-green-200 transition-colors"
            >
              <Plus size={14} /> Add Block
            </button>
            {showAddMenu === blocks.length - 1 && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2 max-h-80 overflow-y-auto">
                {categories.map(cat => (
                  <div key={cat} className="mb-2">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">{cat}</div>
                    {blockTypes.filter(b => b.category === cat).map(bt => (
                      <button
                        key={bt.type}
                        type="button"
                        onClick={() => addBlock(bt.type, blocks.length - 1)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <bt.icon size={13} className="text-gray-400" />
                        {bt.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BlockEditor({ block, onChange, preview }: { block: ContentBlock; onChange: (data: Record<string, any>) => void; preview: boolean }) {
  const d = block.data;

  if (preview) {
    return <BlockPreview block={block} />;
  }

  switch (block.type) {
    case 'paragraph':
      return (
        <textarea
          value={d.text || ''}
          onChange={(e) => onChange({ ...d, text: e.target.value })}
          rows={4}
          className="admin-input resize-none"
          placeholder="Write your paragraph..."
        />
      );

    case 'heading1': case 'heading2': case 'heading3': case 'heading4': case 'heading5': case 'heading6':
      return (
        <input
          type="text"
          value={d.text || ''}
          onChange={(e) => onChange({ ...d, text: e.target.value })}
          className="admin-input"
          placeholder={`${block.type.replace('heading', 'Heading ')} text`}
        />
      );

    case 'unordered_list': case 'ordered_list':
      return (
        <div className="space-y-2">
          {(d.items || ['']).map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-4">{i + 1}.</span>
              <input
                type="text"
                value={item}
                onChange={(e) => { const items = [...d.items]; items[i] = e.target.value; onChange({ ...d, items }); }}
                className="admin-input flex-1"
                placeholder="List item"
              />
              <button type="button" onClick={() => { const items = d.items.filter((_: any, j: number) => j !== i); onChange({ ...d, items }); }} className="text-red-400 hover:text-red-600">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => onChange({ ...d, items: [...d.items, ''] })} className="text-xs text-[#145a2c] font-medium hover:underline">
            + Add item
          </button>
        </div>
      );

    case 'table':
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            {(d.headers || []).map((h: string, i: number) => (
              <input key={i} type="text" value={h} onChange={(e) => { const headers = [...d.headers]; headers[i] = e.target.value; onChange({ ...d, headers }); }} className="admin-input flex-1 font-semibold text-xs" placeholder={`Header ${i + 1}`} />
            ))}
          </div>
          {(d.rows || []).map((row: string[], ri: number) => (
            <div key={ri} className="flex gap-2 items-center">
              {row.map((cell: string, ci: number) => (
                <input key={ci} type="text" value={cell} onChange={(e) => { const rows = [...d.rows]; rows[ri] = [...rows[ri]]; rows[ri][ci] = e.target.value; onChange({ ...d, rows }); }} className="admin-input flex-1 text-xs" placeholder="Cell" />
              ))}
              <button type="button" onClick={() => { const rows = d.rows.filter((_: any, j: number) => j !== ri); onChange({ ...d, rows }); }} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <button type="button" onClick={() => onChange({ ...d, rows: [...d.rows, d.headers.map(() => '')] })} className="text-xs text-[#145a2c] font-medium hover:underline">+ Add row</button>
            <button type="button" onClick={() => onChange({ ...d, headers: [...d.headers, `Column ${d.headers.length + 1}`], rows: d.rows.map((r: string[]) => [...r, '']) })} className="text-xs text-[#145a2c] font-medium hover:underline">+ Add column</button>
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="space-y-3">
          <ImageUpload bucket="news-images" onImageUrl={(url) => onChange({ ...d, url })} currentImageUrl={d.url} label="Block Image" />
          <input type="text" value={d.caption || ''} onChange={(e) => onChange({ ...d, caption: e.target.value })} className="admin-input" placeholder="Image caption (optional)" />
          <input type="text" value={d.alt || ''} onChange={(e) => onChange({ ...d, alt: e.target.value })} className="admin-input" placeholder="Alt text (optional)" />
        </div>
      );

    case 'youtube':
      return (
        <div className="space-y-3">
          <input type="text" value={d.url || ''} onChange={(e) => onChange({ ...d, url: e.target.value })} className="admin-input" placeholder="YouTube URL (e.g. https://youtube.com/watch?v=...)" />
          <input type="text" value={d.title || ''} onChange={(e) => onChange({ ...d, title: e.target.value })} className="admin-input" placeholder="Video title (optional)" />
        </div>
      );

    case 'blockquote':
      return (
        <div className="space-y-3">
          <textarea value={d.text || ''} onChange={(e) => onChange({ ...d, text: e.target.value })} rows={3} className="admin-input resize-none" placeholder="Quote text" />
          <input type="text" value={d.author || ''} onChange={(e) => onChange({ ...d, author: e.target.value })} className="admin-input" placeholder="Attribution (optional)" />
        </div>
      );

    case 'button':
      return (
        <div className="grid grid-cols-2 gap-3">
          <input type="text" value={d.text || ''} onChange={(e) => onChange({ ...d, text: e.target.value })} className="admin-input" placeholder="Button text" />
          <input type="text" value={d.url || ''} onChange={(e) => onChange({ ...d, url: e.target.value })} className="admin-input" placeholder="Button URL" />
          <select value={d.style || 'primary'} onChange={(e) => onChange({ ...d, style: e.target.value })} className="admin-select col-span-2">
            <option value="primary">Primary (Green)</option>
            <option value="secondary">Secondary (Outline)</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      );

    case 'html':
      return (
        <textarea value={d.code || ''} onChange={(e) => onChange({ ...d, code: e.target.value })} rows={6} className="admin-input resize-none font-mono text-xs" placeholder="Custom HTML code" />
      );

    case 'divider':
      return <div className="text-center text-gray-300 text-xs">--- Divider ---</div>;

    case 'product_card':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={d.title || ''} onChange={(e) => onChange({ ...d, title: e.target.value })} className="admin-input" placeholder="Product name" />
            <input type="text" value={d.price || ''} onChange={(e) => onChange({ ...d, price: e.target.value })} className="admin-input" placeholder="Price (e.g. Rs. 1.5 Lakh)" />
            <input type="text" value={d.badge || ''} onChange={(e) => onChange({ ...d, badge: e.target.value })} className="admin-input" placeholder="Badge (e.g. Best Seller)" />
            <input type="text" value={d.link_url || ''} onChange={(e) => onChange({ ...d, link_url: e.target.value })} className="admin-input" placeholder="Link URL" />
          </div>
          <ImageUpload bucket="news-images" onImageUrl={(url) => onChange({ ...d, image_url: url })} currentImageUrl={d.image_url} label="Product Image" />
          <textarea value={d.description || ''} onChange={(e) => onChange({ ...d, description: e.target.value })} rows={2} className="admin-input resize-none" placeholder="Product description" />
        </div>
      );

    case 'vehicle_comparison':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={d.vehicle1_name || ''} onChange={(e) => onChange({ ...d, vehicle1_name: e.target.value })} className="admin-input" placeholder="Vehicle 1 name" />
            <input type="text" value={d.vehicle2_name || ''} onChange={(e) => onChange({ ...d, vehicle2_name: e.target.value })} className="admin-input" placeholder="Vehicle 2 name" />
          </div>
          <textarea value={d.verdict || ''} onChange={(e) => onChange({ ...d, verdict: e.target.value })} rows={2} className="admin-input resize-none" placeholder="Comparison verdict / summary" />
          <p className="text-xs text-gray-400">Specs will be rendered as key-value pairs from the data object</p>
        </div>
      );

    case 'image_gallery':
      return (
        <div className="space-y-3">
          {(d.images || [{ url: '', caption: '' }]).map((img: { url: string; caption: string }, i: number) => (
            <div key={i} className="flex items-start gap-3 border border-gray-100 rounded-lg p-3">
              <div className="flex-1 space-y-2">
                <ImageUpload bucket="news-images" onImageUrl={(url) => { const images = [...d.images]; images[i] = { ...images[i], url }; onChange({ ...d, images }); }} currentImageUrl={img.url} label={`Image ${i + 1}`} />
                <input type="text" value={img.caption || ''} onChange={(e) => { const images = [...d.images]; images[i] = { ...images[i], caption: e.target.value }; onChange({ ...d, images }); }} className="admin-input" placeholder="Caption" />
              </div>
              <button type="button" onClick={() => { const images = d.images.filter((_: any, j: number) => j !== i); onChange({ ...d, images }); }} className="text-red-400 hover:text-red-600 mt-1">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => onChange({ ...d, images: [...d.images, { url: '', caption: '' }] })} className="text-xs text-[#145a2c] font-medium hover:underline">
            + Add image
          </button>
        </div>
      );

    case 'cta_banner':
      return (
        <div className="space-y-3">
          <input type="text" value={d.title || ''} onChange={(e) => onChange({ ...d, title: e.target.value })} className="admin-input" placeholder="Banner title" />
          <textarea value={d.description || ''} onChange={(e) => onChange({ ...d, description: e.target.value })} rows={2} className="admin-input resize-none" placeholder="Banner description" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={d.button_text || ''} onChange={(e) => onChange({ ...d, button_text: e.target.value })} className="admin-input" placeholder="Button text" />
            <input type="text" value={d.button_url || ''} onChange={(e) => onChange({ ...d, button_url: e.target.value })} className="admin-input" placeholder="Button URL" />
          </div>
          <input type="color" value={d.background_color || '#145a2c'} onChange={(e) => onChange({ ...d, background_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
        </div>
      );

    default:
      return <p className="text-xs text-gray-400">Unknown block type: {block.type}</p>;
  }
}

function BlockPreview({ block }: { block: ContentBlock }) {
  const d = block.data;

  switch (block.type) {
    case 'paragraph':
      return <p className="text-sm text-gray-700 leading-relaxed">{d.text || <span className="text-gray-300 italic">Empty paragraph</span>}</p>;
    case 'heading1':
      return <h1 className="text-2xl font-extrabold text-gray-900">{d.text || 'Heading 1'}</h1>;
    case 'heading2':
      return <h2 className="text-xl font-bold text-gray-900">{d.text || 'Heading 2'}</h2>;
    case 'heading3':
      return <h3 className="text-lg font-bold text-gray-900">{d.text || 'Heading 3'}</h3>;
    case 'unordered_list':
      return <ul className="list-disc pl-5 space-y-1">{(d.items || []).map((item: string, i: number) => <li key={i} className="text-sm text-gray-700">{item || '...'}</li>)}</ul>;
    case 'ordered_list':
      return <ol className="list-decimal pl-5 space-y-1">{(d.items || []).map((item: string, i: number) => <li key={i} className="text-sm text-gray-700">{item || '...'}</li>)}</ol>;
    case 'blockquote':
      return <blockquote className="border-l-4 border-green-400 pl-4 italic text-gray-600">{d.text || 'Quote'}{d.author && <footer className="mt-1 text-xs not-italic text-gray-500">- {d.author}</footer>}</blockquote>;
    case 'divider':
      return <hr className="border-gray-200 my-4" />;
    case 'image':
      return d.url ? <div><img src={d.url} alt={d.alt || ''} className="max-h-40 rounded-lg" />{d.caption && <p className="text-xs text-gray-500 mt-1">{d.caption}</p>}</div> : <p className="text-xs text-gray-300 italic">No image</p>;
    case 'youtube':
      return <div className="bg-gray-100 rounded-lg p-3 text-center"><Youtube size={24} className="mx-auto text-red-500 mb-1" /><p className="text-xs text-gray-600">{d.url || 'YouTube URL'}</p></div>;
    case 'button':
      return <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${d.style === 'primary' ? 'bg-[#145a2c] text-white' : d.style === 'dark' ? 'bg-gray-900 text-white' : 'border border-[#145a2c] text-[#145a2c]'}`}>{d.text || 'Button'}</span>;
    case 'product_card':
      return (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex gap-4">
          {d.image_url && <img src={d.image_url} alt="" className="w-20 h-20 object-cover rounded-lg" />}
          <div><div className="font-semibold text-gray-900 text-sm">{d.title || 'Product'}</div><div className="text-xs text-[#145a2c] font-bold">{d.price}</div><div className="text-xs text-gray-500 mt-1">{d.description}</div></div>
        </div>
      );
    case 'vehicle_comparison':
      return (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="grid grid-cols-2 gap-3 text-sm font-semibold text-gray-900">
            <div>{d.vehicle1_name || 'Vehicle 1'}</div>
            <div>{d.vehicle2_name || 'Vehicle 2'}</div>
          </div>
          {d.verdict && <p className="text-xs text-gray-600 mt-2 italic">{d.verdict}</p>}
        </div>
      );
    case 'image_gallery':
      return <div className="flex gap-2 overflow-x-auto">{(d.images || []).map((img: any, i: number) => img.url && <img key={i} src={img.url} alt={img.caption || ''} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />)}</div>;
    case 'cta_banner':
      return (
        <div className="rounded-xl p-5 text-white" style={{ backgroundColor: d.background_color || '#145a2c' }}>
          <div className="font-bold text-sm">{d.title || 'CTA Title'}</div>
          <div className="text-xs mt-1 opacity-80">{d.description}</div>
          <span className="inline-block mt-3 bg-white/20 px-4 py-1.5 rounded-lg text-xs font-medium">{d.button_text || 'Click'}</span>
        </div>
      );
    case 'table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-gray-200 rounded">
            <thead><tr className="bg-gray-50">{(d.headers || []).map((h: string, i: number) => <th key={i} className="px-3 py-2 font-semibold text-gray-700 border-b">{h}</th>)}</tr></thead>
            <tbody>{(d.rows || []).map((row: string[], ri: number) => <tr key={ri}>{row.map((cell: string, ci: number) => <td key={ci} className="px-3 py-2 border-b border-gray-50">{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case 'html':
      return <div className="bg-gray-900 rounded-lg p-3 text-xs text-green-400 font-mono max-h-32 overflow-y-auto">{d.code || '<!-- empty -->'}</div>;
    default:
      return <p className="text-xs text-gray-400">Preview not available</p>;
  }
}
