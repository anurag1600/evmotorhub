'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Vehicle, Manufacturer, VehicleVariant } from '@/lib/types';
import { Save, Loader as Loader2, X, CircleAlert as AlertCircle, Plus, ChevronUp, ChevronDown, Trash2, Power } from 'lucide-react';
import { slugify } from '@/lib/format';
import ImageUpload from '@/components/ImageUpload';
import VariantsInlineEditor from './VariantsInlineEditor';

interface VehicleFormProps {
  vehicleId?: string;
}

const vehicleTypes = ['scooter', 'bike', 'car'] as const;
const segments = ['budget', 'mid', 'premium', 'luxury'] as const;
const statuses = ['draft', 'published', 'archived'] as const;

export default function VehicleForm({ vehicleId }: VehicleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!vehicleId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [variants, setVariants] = useState<VehicleVariant[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    manufacturer_id: '',
    type: 'scooter' as typeof vehicleTypes[number],
    segment: 'budget' as typeof segments[number],
    price_min: 0,
    price_max: 0,
    image_url: '',
    gallery_urls: [] as string[],
    image_gallery: [] as string[],
    video_url: '',
    description: '',
    is_upcoming: false,
    is_featured: false,
    is_latest: false,
    launch_date: '',
    colors: [] as string[],
    specifications: {} as Record<string, string>,
    features: [] as string[],
    pros: [] as string[],
    cons: [] as string[],
    related_news_ids: [] as string[],
    similar_vehicle_ids: [] as string[],
    status: 'draft' as typeof statuses[number],
    seo_title: '',
    seo_description: '',
    seo_keywords: '' as any,
  });

  const [allNews, setAllNews] = useState<{id: string; title: string}[]>([]);
  const [allVehicles, setAllVehicles] = useState<{id: string; name: string; type: string}[]>([]);

  const [colorInput, setColorInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [proInput, setProInput] = useState('');
  const [conInput, setConInput] = useState('');
  const [galleryInput, setGalleryInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  useEffect(() => {
    fetchManufacturers();
    fetchRelatedOptions();
    if (vehicleId) {
      fetchVehicle();
    }
  }, [vehicleId]);

  const fetchManufacturers = async () => {
    const { data } = await supabase.from('manufacturers').select('*').order('name');
    if (data) setManufacturers(data as Manufacturer[]);
  };

  const fetchRelatedOptions = async () => {
    const [newsRes, vehiclesRes] = await Promise.all([
      supabase.from('news').select('id, title').eq('status', 'published').order('published_at', { ascending: false }).limit(50),
      supabase.from('vehicles').select('id, name, type').eq('status', 'published').order('name').limit(100),
    ]);
    if (newsRes.data) setAllNews(newsRes.data);
    if (vehiclesRes.data) setAllVehicles(vehiclesRes.data as any);
  };

  const fetchVehicle = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .maybeSingle();

      if (error || !data) throw new Error('Vehicle not found');
      setFormData({
        ...data,
        seo_keywords: data.seo_keywords?.join(', ') || '',
        related_news_ids: data.related_news_ids || [],
        similar_vehicle_ids: data.similar_vehicle_ids || [],
      } as any);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantsChange = (updatedVariants: VehicleVariant[]) => {
    setVariants(updatedVariants);
  };

  // Auto-calculate price range from variants
  const getPriceRange = () => {
    if (variants.length === 0) return { price_min: 0, price_max: 0 };
    const prices = variants.filter(v => v.status === 'active').map(v => v.price);
    if (prices.length === 0) return { price_min: 0, price_max: 0 };
    return {
      price_min: Math.min(...prices),
      price_max: Math.max(...prices),
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { name, slug, manufacturer_id, type, segment, price_min, price_max, image_url, gallery_urls, image_gallery, video_url, description, is_upcoming, is_featured, is_latest, launch_date, colors, specifications, features, pros, cons, status, seo_title, seo_description, seo_keywords } = formData;

      if (!name || !slug || !manufacturer_id) {
        throw new Error('Name, slug, and manufacturer are required');
      }

      // Use form prices if set, otherwise auto-calculate from variants
      const variantPrices = getPriceRange();
      const finalPriceMin = price_min || variantPrices.price_min || 0;
      const finalPriceMax = price_max || variantPrices.price_max || 0;

      const vehicleData = {
        name,
        slug,
        manufacturer_id,
        type,
        segment,
        price_min: finalPriceMin,
        price_max: finalPriceMax,
        image_url,
        gallery_urls,
        image_gallery,
        video_url: video_url || null,
        description,
        is_upcoming,
        is_featured,
        is_latest,
        launch_date: launch_date || null,
        colors,
        specifications,
        features,
        pros,
        cons,
        related_news_ids: formData.related_news_ids,
        similar_vehicle_ids: formData.similar_vehicle_ids,
        status,
        seo_title,
        seo_description,
        seo_keywords: typeof seo_keywords === 'string' ? seo_keywords.split(',').map(k => k.trim()).filter(Boolean) : seo_keywords,
        updated_at: new Date().toISOString(),
      };

      if (vehicleId) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', vehicleId);

        if (error) throw error;
        setSuccess('Vehicle updated successfully!');
      } else {
        // Insert new vehicle and get the ID
        const { data: newVehicle, error } = await supabase
          .from('vehicles')
          .insert([vehicleData])
          .select('id')
          .single();

        if (error) throw error;

        // Save draft variants if any
        if (newVehicle && variants.length > 0) {
          const variantInserts = variants.map((v, index) => ({
            vehicle_id: newVehicle.id,
            name: v.name,
            slug: v.slug || v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            short_name: v.short_name,
            price: v.price,
            range_km: v.range_km,
            battery_capacity_kwh: v.battery_capacity_kwh,
            motor_power_kw: v.motor_power_kw,
            top_speed_kmh: v.top_speed_kmh,
            charging_time_hrs: v.charging_time_hrs,
            kerb_weight: v.kerb_weight,
            image_url: v.image_url,
            color: v.color,
            color_hex: v.color_hex,
            sort_order: index,
            is_available: v.is_available ?? true,
            is_featured: v.is_featured ?? false,
            status: v.status || 'active',
            specifications: v.specifications || {},
          }));

          const { error: variantError } = await supabase
            .from('vehicle_variants')
            .insert(variantInserts);

          if (variantError) {
            console.error('Failed to save variants:', variantError);
            // Still show success for vehicle, but note the issue
            setSuccess('Vehicle created, but some variants failed to save.');
          } else {
            setSuccess('Vehicle created with ' + variants.length + ' variants!');
          }
        } else {
          setSuccess('Vehicle created successfully!');
        }
      }

      setTimeout(() => router.push('/admin/vehicles'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = () => {
    const slug = slugify(formData.name);
    setFormData({ ...formData, slug });
  };

  const addItem = (field: 'colors' | 'features' | 'pros' | 'cons', value: string, setter: (v: string) => void) => {
    if (value.trim() && !(formData[field] as string[]).includes(value.trim())) {
      setFormData({ ...formData, [field]: [...(formData[field] as string[]), value.trim()] });
      setter('');
    }
  };

  const removeItem = (field: 'colors' | 'features' | 'pros' | 'cons', index: number) => {
    setFormData({ ...formData, [field]: (formData[field] as string[]).filter((_, i) => i !== index) });
  };

  const addGalleryUrl = () => {
    if (galleryInput.trim() && !formData.gallery_urls.includes(galleryInput.trim())) {
      setFormData({ ...formData, gallery_urls: [...formData.gallery_urls, galleryInput.trim()] });
      setGalleryInput('');
    }
  };

  if (loading) {
    return <div className="text-center py-12"><Loader2 className="inline-block animate-spin text-gray-400" size={32} /></div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-red-700">Error</div>
            <div className="text-sm text-red-600">{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-green-700">{success}</div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold">Vehicle Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={generateSlug}
                  placeholder="Vehicle name"
                  className="admin-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="vehicle-slug"
                  className="admin-input"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Manufacturer *</label>
                <select
                  value={formData.manufacturer_id}
                  onChange={(e) => setFormData({ ...formData, manufacturer_id: e.target.value })}
                  className="admin-select"
                >
                  <option value="">Select manufacturer</option>
                  {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="admin-select"
                >
                  {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Segment</label>
                <select
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value as any })}
                  className="admin-select"
                >
                  {segments.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price Min (Rs.)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                  <input
                    type="number"
                    value={formData.price_min || ''}
                    onChange={(e) => setFormData({ ...formData, price_min: parseInt(e.target.value) || 0 })}
                    placeholder="Minimum price"
                    className="admin-input pl-7"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Base price (ex-showroom)</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Price Max (Rs.)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                  <input
                    type="number"
                    value={formData.price_max || ''}
                    onChange={(e) => setFormData({ ...formData, price_max: parseInt(e.target.value) || 0 })}
                    placeholder="Maximum price"
                    className="admin-input pl-7"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Highest variant price</p>
              </div>
            </div>
            {variants.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="text-xs font-semibold text-green-800 mb-1">Variant Price Range (Auto-calculated from variants)</div>
                <div className="text-sm text-green-700">
                  {(() => {
                    const { price_min, price_max } = getPriceRange();
                    if (price_min === 0 && price_max === 0) return 'Add active variants to calculate';
                    if (price_min === price_max) return `₹${price_min.toLocaleString('en-IN')}`;
                    return `₹${price_min.toLocaleString('en-IN')} - ₹${price_max.toLocaleString('en-IN')}`;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold">Description</h2>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="admin-input resize-none"
              placeholder="Write a detailed description of this vehicle..."
            />
          </div>

          {/* Additional Specifications */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold border-b pb-3">Additional Specifications</h2>
            <p className="text-xs text-gray-500">Add custom key-value pairs like Kerb Weight, Tyre Type, Boot Space, etc.</p>
            <div className="space-y-2">
              {Object.entries(formData.specifications).map(([key, value], idx, arr) => (
                <div key={key} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => {
                      const entries = Object.entries(formData.specifications);
                      if (idx > 0) {
                        [entries[idx], entries[idx - 1]] = [entries[idx - 1], entries[idx]];
                        setFormData({ ...formData, specifications: Object.fromEntries(entries) });
                      }
                    }} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30" disabled={idx === 0}>
                      <ChevronUp size={12} className="text-gray-500" />
                    </button>
                    <button type="button" onClick={() => {
                      const entries = Object.entries(formData.specifications);
                      if (idx < entries.length - 1) {
                        [entries[idx], entries[idx + 1]] = [entries[idx + 1], entries[idx]];
                        setFormData({ ...formData, specifications: Object.fromEntries(entries) });
                      }
                    }} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30" disabled={idx === arr.length - 1}>
                      <ChevronDown size={12} className="text-gray-500" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      const entries = Object.entries(formData.specifications);
                      entries[idx] = [e.target.value, value];
                      setFormData({ ...formData, specifications: Object.fromEntries(entries) });
                    }}
                    className="admin-input flex-1 text-sm"
                    placeholder="Spec name"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      const entries = Object.entries(formData.specifications);
                      entries[idx] = [key, e.target.value];
                      setFormData({ ...formData, specifications: Object.fromEntries(entries) });
                    }}
                    className="admin-input flex-1 text-sm"
                    placeholder="Value"
                  />
                  <button type="button" onClick={() => {
                    const newSpecs = { ...formData.specifications };
                    delete newSpecs[key];
                    setFormData({ ...formData, specifications: newSpecs });
                  }} className="p-1.5 text-red-400 hover:text-red-600 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-end pt-2 border-t border-gray-100">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  className="admin-input text-sm"
                  placeholder="e.g. Kerb Weight"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Value</label>
                <input
                  type="text"
                  value={specValue}
                  onChange={(e) => setSpecValue(e.target.value)}
                  className="admin-input text-sm"
                  placeholder="e.g. 118 kg"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (specKey.trim()) {
                        setFormData({
                          ...formData,
                          specifications: { ...formData.specifications, [specKey.trim()]: specValue.trim() }
                        });
                        setSpecKey('');
                        setSpecValue('');
                      }
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (specKey.trim()) {
                    setFormData({
                      ...formData,
                      specifications: { ...formData.specifications, [specKey.trim()]: specValue.trim() }
                    });
                    setSpecKey('');
                    setSpecValue('');
                  }
                }}
                className="admin-btn-secondary flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Features & Details */}
          <div className="admin-card p-6 space-y-4">
            <h2 className="text-lg font-bold">Features & Details</h2>

            {/* Colors */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Colors</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('colors', colorInput, setColorInput))}
                  placeholder="Add color..."
                  className="admin-input"
                />
                <button type="button" onClick={() => addItem('colors', colorInput, setColorInput)} className="admin-btn-secondary">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.colors.map((color, i) => (
                  <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    {color}
                    <button type="button" onClick={() => removeItem('colors', i)} className="hover:text-red-600"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Features</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('features', featureInput, setFeatureInput))}
                  placeholder="Add feature..."
                  className="admin-input"
                />
                <button type="button" onClick={() => addItem('features', featureInput, setFeatureInput)} className="admin-btn-secondary">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature, i) => (
                  <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    {feature}
                    <button type="button" onClick={() => removeItem('features', i)} className="hover:text-red-600"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Pros */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Pros</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={proInput}
                  onChange={(e) => setProInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('pros', proInput, setProInput))}
                  placeholder="Add pro..."
                  className="admin-input"
                />
                <button type="button" onClick={() => addItem('pros', proInput, setProInput)} className="admin-btn-secondary">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.pros.map((pro, i) => (
                  <span key={i} className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    {pro}
                    <button type="button" onClick={() => removeItem('pros', i)} className="hover:text-red-600"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Cons */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cons</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={conInput}
                  onChange={(e) => setConInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('cons', conInput, setConInput))}
                  placeholder="Add con..."
                  className="admin-input"
                />
                <button type="button" onClick={() => addItem('cons', conInput, setConInput)} className="admin-btn-secondary">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.cons.map((con, i) => (
                  <span key={i} className="bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    {con}
                    <button type="button" onClick={() => removeItem('cons', i)} className="hover:text-red-600"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Variants Section */}
          <div className="admin-card p-6">
            <VariantsInlineEditor
              vehicleId={vehicleId}
              onVariantsChange={handleVariantsChange}
              isDraft={!vehicleId}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold mb-4">Publish</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="admin-select"
                >
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#145a2c]"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_upcoming}
                    onChange={(e) => setFormData({ ...formData, is_upcoming: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#145a2c]"
                  />
                  <span className="text-sm font-medium text-gray-700">Upcoming</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_latest}
                    onChange={(e) => setFormData({ ...formData, is_latest: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#145a2c]"
                  />
                  <span className="text-sm font-medium text-gray-700">Latest</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Launch Date</label>
                <input
                  type="date"
                  value={formData.launch_date}
                  onChange={(e) => setFormData({ ...formData, launch_date: e.target.value })}
                  className="admin-input"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold mb-4">Images</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Main Image</label>
                <ImageUpload
                  bucket="vehicle-gallery"
                  onImageUrl={(url) => setFormData({ ...formData, image_url: url })}
                  currentImageUrl={formData.image_url}
                  label="Vehicle Main Image"
                  recommendedWidth={800}
                  recommendedHeight={600}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Image Gallery</label>
                <div className="space-y-2">
                  {formData.image_gallery.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <img src={url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      <span className="text-xs text-gray-500 truncate flex-1">{url.split('/').pop()}</span>
                      <button type="button" onClick={() => setFormData({ ...formData, image_gallery: formData.image_gallery.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                    </div>
                  ))}
                  <ImageUpload
                    bucket="vehicle-gallery"
                    onImageUrl={(url) => setFormData({ ...formData, image_gallery: [...formData.image_gallery, url] })}
                    currentImageUrl=""
                    label="Add Gallery Image"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Legacy Gallery URLs</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={galleryInput}
                    onChange={(e) => setGalleryInput(e.target.value)}
                    placeholder="Add gallery image URL..."
                    className="admin-input"
                  />
                  <button type="button" onClick={addGalleryUrl} className="admin-btn-secondary">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.gallery_urls.map((url, i) => (
                    <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center gap-1 max-w-[200px] truncate">
                      {url.split('/').pop()}
                      <button type="button" onClick={() => setFormData({ ...formData, gallery_urls: formData.gallery_urls.filter((_, j) => j !== i) })} className="hover:text-red-600"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Video URL */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold mb-4">Video</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">YouTube Video URL</label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="admin-input"
              />
              <p className="text-xs text-gray-500 mt-1">Add a YouTube video URL to show a "Watch Video" button on the product page</p>
            </div>
          </div>

          {/* Related Content */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold mb-4">Related Content</h2>
            <div className="space-y-4">
              {/* Related News */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Related News</label>
                <p className="text-xs text-gray-500 mb-2">Select news articles to display on this vehicle page</p>
                <div className="space-y-1 mb-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {formData.related_news_ids.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-2">No news selected</div>
                  )}
                  {formData.related_news_ids.map((newsId, idx) => {
                    const newsItem = allNews.find(n => n.id === newsId);
                    return (
                      <div key={newsId} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5">
                        <span className="text-xs text-gray-400">{idx + 1}.</span>
                        <span className="text-xs text-gray-700 flex-1 truncate">{newsItem?.title || 'Loading...'}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            related_news_ids: formData.related_news_ids.filter(id => id !== newsId)
                          })}
                          className="text-red-400 hover:text-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !formData.related_news_ids.includes(e.target.value)) {
                      setFormData({
                        ...formData,
                        related_news_ids: [...formData.related_news_ids, e.target.value]
                      });
                    }
                  }}
                  className="admin-select text-sm"
                >
                  <option value="">+ Add news article</option>
                  {allNews.filter(n => !formData.related_news_ids.includes(n.id)).map(n => (
                    <option key={n.id} value={n.id}>{n.title}</option>
                  ))}
                </select>
              </div>

              {/* Similar Vehicles */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Similar Vehicles</label>
                <p className="text-xs text-gray-500 mb-2">Select vehicles to show for comparison (filtered by same type)</p>
                <div className="space-y-1 mb-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {formData.similar_vehicle_ids.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-2">No vehicles selected</div>
                  )}
                  {formData.similar_vehicle_ids.map((vehicleId, idx) => {
                    const v = allVehicles.find(v => v.id === vehicleId);
                    return (
                      <div key={vehicleId} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5">
                        <span className="text-xs text-gray-400">{idx + 1}.</span>
                        <span className="text-xs text-gray-700 flex-1 truncate">{v?.name || 'Loading...'}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            similar_vehicle_ids: formData.similar_vehicle_ids.filter(id => id !== vehicleId)
                          })}
                          className="text-red-400 hover:text-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !formData.similar_vehicle_ids.includes(e.target.value)) {
                      setFormData({
                        ...formData,
                        similar_vehicle_ids: [...formData.similar_vehicle_ids, e.target.value]
                      });
                    }
                  }}
                  className="admin-select text-sm"
                >
                  <option value="">+ Add vehicle</option>
                  {allVehicles
                    .filter(v => v.id !== vehicleId && !formData.similar_vehicle_ids.includes(v.id))
                    .map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.type})</option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-bold mb-4">SEO</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={formData.seo_title}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                placeholder="SEO Title"
                className="admin-input text-sm"
              />
              <textarea
                value={formData.seo_description}
                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                placeholder="Meta description"
                rows={2}
                className="admin-textarea text-sm"
              />
              <input
                type="text"
                value={typeof formData.seo_keywords === 'string' ? formData.seo_keywords : formData.seo_keywords?.join(', ')}
                onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                placeholder="keyword1, keyword2"
                className="admin-input text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="admin-btn-primary">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : vehicleId ? 'Update Vehicle' : 'Create Vehicle'}
        </button>
        <button type="button" onClick={() => router.back()} className="admin-btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
