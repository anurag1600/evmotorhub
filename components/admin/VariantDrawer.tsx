'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Star, Image as ImageIcon, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { VehicleVariant } from '@/lib/types';
import { VariantInput } from '@/hooks/useVariants';
import { cn } from '@/lib/utils';
import ImageUpload from '@/components/ImageUpload';

interface VariantDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: VariantInput, id?: string) => Promise<void>;
  variant: VehicleVariant | null;
  vehicleId: string;
  isDefault: boolean;
  hasOtherVariants: boolean;
}

const statusOptions = ['active', 'discontinued', 'upcoming'] as const;

const defaultFormState: VariantInput = {
  name: '',
  short_name: '',
  short_description: '',
  price: 0,
  range_km: null,
  battery_capacity_kwh: null,
  top_speed_kmh: null,
  motor_power_kw: null,
  charging_time_hrs: null,
  kerb_weight: null,
  image_url: '',
  gallery_urls: [],
  brochure_url: '',
  colors: [],
  color_hexes: [],
  features: [],
  specifications: {},
  status: 'active',
  is_available: true,
  is_featured: false,
  sort_order: 0,
};

export default function VariantDrawer({
  open,
  onClose,
  onSave,
  variant,
  vehicleId,
  isDefault,
  hasOtherVariants,
}: VariantDrawerProps) {
  const [formData, setFormData] = useState<VariantInput>(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form input states for arrays
  const [colorInput, setColorInput] = useState('');
  const [colorHexInput, setColorHexInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [galleryInput, setGalleryInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'specs' | 'media' | 'colors'>('basic');

  // Reset form when drawer opens/closes or variant changes
  useEffect(() => {
    if (open) {
      if (variant) {
        setFormData({
          name: variant.name || '',
          short_name: variant.short_name || '',
          short_description: variant.short_description || '',
          price: variant.price || 0,
          range_km: variant.range_km,
          battery_capacity_kwh: variant.battery_capacity_kwh,
          top_speed_kmh: variant.top_speed_kmh,
          motor_power_kw: variant.motor_power_kw,
          charging_time_hrs: variant.charging_time_hrs,
          kerb_weight: variant.kerb_weight,
          image_url: variant.image_url || '',
          gallery_urls: variant.gallery_urls || [],
          brochure_url: variant.brochure_url || '',
          colors: variant.colors || [],
          color_hexes: variant.color_hexes || [],
          features: variant.features || [],
          specifications: variant.specifications || {},
          status: variant.status || 'active',
          is_available: variant.is_available ?? true,
          is_featured: variant.is_featured ?? false,
          sort_order: variant.sort_order || 0,
        });
      } else {
        setFormData(defaultFormState);
      }
      setErrors({});
      setActiveTab('basic');
    }
  }, [open, variant]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave(formData, variant?.id);
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message || 'Failed to save variant' });
    } finally {
      setSaving(false);
    }
  };

  const addColor = () => {
    if (colorInput.trim()) {
      setFormData({
        ...formData,
        colors: [...(formData.colors || []), colorInput.trim()],
        color_hexes: [...(formData.color_hexes || []), colorHexInput.trim() || '#9ca3af'],
      });
      setColorInput('');
      setColorHexInput('');
    }
  };

  const removeColor = (index: number) => {
    setFormData({
      ...formData,
      colors: (formData.colors || []).filter((_, i) => i !== index),
      color_hexes: (formData.color_hexes || []).filter((_, i) => i !== index),
    });
  };

  const addFeature = () => {
    if (featureInput.trim() && !(formData.features || []).includes(featureInput.trim())) {
      setFormData({ ...formData, features: [...(formData.features || []), featureInput.trim()] });
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({ ...formData, features: (formData.features || []).filter((_, i) => i !== index) });
  };

  const addGalleryUrl = () => {
    if (galleryInput.trim() && !(formData.gallery_urls || []).includes(galleryInput.trim())) {
      setFormData({ ...formData, gallery_urls: [...(formData.gallery_urls || []), galleryInput.trim()] });
      setGalleryInput('');
    }
  };

  const removeGalleryUrl = (index: number) => {
    setFormData({ ...formData, gallery_urls: (formData.gallery_urls || []).filter((_, i) => i !== index) });
  };

  const addSpecification = () => {
    if (specKey.trim()) {
      setFormData({
        ...formData,
        specifications: { ...(formData.specifications || {}), [specKey.trim()]: specValue.trim() },
      });
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (key: string) => {
    const newSpecs = { ...(formData.specifications || {}) };
    delete newSpecs[key];
    setFormData({ ...formData, specifications: newSpecs });
  };

  const formatPrice = (price: number) => {
    if (price >= 100000) return `${(price / 100000).toFixed(2)}L`;
    return price.toLocaleString('en-IN');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {variant ? 'Edit Variant' : 'Create New Variant'}
            </h2>
            <p className="text-sm text-gray-500">
              {variant ? `Editing ${variant.name}` : 'Add a new variant to this vehicle'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          {(['basic', 'specs', 'media', 'colors'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors',
                activeTab === tab
                  ? 'text-[#145a2c] border-b-2 border-[#145a2c]'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {errors.submit}
              </div>
            )}

            {/* Basic Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Variant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Standard, Pro, Max"
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]',
                      errors.name ? 'border-red-300' : 'border-gray-200'
                    )}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Short Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Short Name</label>
                  <input
                    type="text"
                    value={formData.short_name || ''}
                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                    placeholder="e.g. STD, PRO"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Price (Rs.) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      placeholder="Ex-showroom price"
                      className={cn(
                        'w-full pl-7 pr-16 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]',
                        errors.price ? 'border-red-300' : 'border-gray-200'
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      {formData.price > 0 && formatPrice(formData.price)}
                    </span>
                  </div>
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description</label>
                  <textarea
                    value={formData.short_description || ''}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Brief variant description..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c] resize-none"
                  />
                </div>

                {/* Status & Featured */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sort_order || 0}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_available ?? true}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                      className="w-4 h-4 rounded accent-[#145a2c]"
                    />
                    <span className="text-sm text-gray-700">Available</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_featured ?? false}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-4 h-4 rounded accent-[#145a2c]"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      <Star size={14} className={formData.is_featured ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                      Default Variant
                    </span>
                  </label>
                </div>

                {isDefault && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
                    This is the current default variant. Uncheck "Default Variant" to make another variant the default.
                  </div>
                )}
              </div>
            )}

            {/* Specs Tab */}
            {activeTab === 'specs' && (
              <div className="space-y-4">
                {/* Range & Battery */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Range (km)</label>
                    <input
                      type="number"
                      value={formData.range_km || ''}
                      onChange={(e) => setFormData({ ...formData, range_km: parseInt(e.target.value) || null })}
                      placeholder="e.g. 120"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Battery (kWh)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.battery_capacity_kwh || ''}
                      onChange={(e) => setFormData({ ...formData, battery_capacity_kwh: parseFloat(e.target.value) || null })}
                      placeholder="e.g. 3.7"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                  </div>
                </div>

                {/* Speed & Motor */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Top Speed (km/h)</label>
                    <input
                      type="number"
                      value={formData.top_speed_kmh || ''}
                      onChange={(e) => setFormData({ ...formData, top_speed_kmh: parseInt(e.target.value) || null })}
                      placeholder="e.g. 80"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Motor Power (kW)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.motor_power_kw || ''}
                      onChange={(e) => setFormData({ ...formData, motor_power_kw: parseFloat(e.target.value) || null })}
                      placeholder="e.g. 2.5"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                  </div>
                </div>

                {/* Charging & Weight */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Charging Time (hrs)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.charging_time_hrs || ''}
                      onChange={(e) => setFormData({ ...formData, charging_time_hrs: parseFloat(e.target.value) || null })}
                      placeholder="e.g. 4.5"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Kerb Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.kerb_weight || ''}
                      onChange={(e) => setFormData({ ...formData, kerb_weight: parseInt(e.target.value) || null })}
                      placeholder="e.g. 118"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
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
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      placeholder="Add feature..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                    <button type="button" onClick={addFeature} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.features || []).map((feature, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        {feature}
                        <button type="button" onClick={() => removeFeature(i)} className="hover:text-red-600">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Additional Specifications */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Specifications</label>
                  <p className="text-xs text-gray-500 mb-2">Add custom key-value specs like Tyre Type, Boot Space, etc.</p>
                  <div className="space-y-2 mb-3">
                    {Object.entries(formData.specifications || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                        <span className="text-xs font-medium text-gray-600 flex-1">{key}</span>
                        <span className="text-xs text-gray-500 flex-1">{value}</span>
                        <button type="button" onClick={() => removeSpecification(key)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={specKey}
                      onChange={(e) => setSpecKey(e.target.value)}
                      placeholder="Spec name"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                    <input
                      type="text"
                      value={specValue}
                      onChange={(e) => setSpecValue(e.target.value)}
                      placeholder="Value"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecification())}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                    <button type="button" onClick={addSpecification} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="space-y-4">
                {/* Main Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Variant Image</label>
                  <ImageUpload
                    bucket="vehicle-gallery"
                    onImageUrl={(url) => setFormData({ ...formData, image_url: url })}
                    currentImageUrl={formData.image_url || ''}
                    label="Variant Image"
                    recommendedWidth={800}
                    recommendedHeight={600}
                  />
                </div>

                {/* Gallery URLs */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gallery Images</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={galleryInput}
                      onChange={(e) => setGalleryInput(e.target.value)}
                      placeholder="Add image URL..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                    <button type="button" onClick={addGalleryUrl} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(formData.gallery_urls || []).map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="w-full aspect-square object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => removeGalleryUrl(i)}
                          className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brochure */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Brochure URL</label>
                  <input
                    type="url"
                    value={formData.brochure_url || ''}
                    onChange={(e) => setFormData({ ...formData, brochure_url: e.target.value })}
                    placeholder="PDF brochure URL"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                  />
                </div>
              </div>
            )}

            {/* Colors Tab */}
            {activeTab === 'colors' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Available Colors</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      placeholder="Color name"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                    <input
                      type="color"
                      value={colorHexInput || '#9ca3af'}
                      onChange={(e) => setColorHexInput(e.target.value)}
                      className="w-10 h-10 border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <button type="button" onClick={addColor} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(formData.colors || []).map((color, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                        <span
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: formData.color_hexes?.[i] || '#9ca3af' }}
                        />
                        <span className="text-sm text-gray-700 flex-1">{color}</span>
                        <button type="button" onClick={() => removeColor(i)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {(formData.colors || []).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No colors added yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
            disabled={saving}
            className="px-4 py-2 bg-[#145a2c] hover:bg-[#0f4a23] text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : variant ? 'Update Variant' : 'Create Variant'}
          </button>
        </div>
      </div>
    </div>
  );
}
