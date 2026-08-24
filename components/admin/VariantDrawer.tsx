'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader as Loader2, Star, Image as ImageIcon, Plus, Trash2, ChevronDown, ChevronUp, CircleHelp as HelpCircle } from 'lucide-react';
import { VehicleVariant } from '@/lib/types';
import { VariantInput } from '@/hooks/useVariants';
import { cn } from '@/lib/utils';
import ImageUpload from '@/components/ImageUpload';
import { supabase } from '@/lib/supabase';

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

// Dynamic specification templates by vehicle type
const specTemplates: Record<string, { key: string; label: string; placeholder: string }[]> = {
  scooter: [
    { key: 'Kerb Weight', label: 'Kerb Weight', placeholder: 'e.g. 118 kg' },
    { key: 'Tyre Type', label: 'Tyre Type', placeholder: 'e.g. Tubeless' },
    { key: 'Tyre Size (Front)', label: 'Tyre Size (Front)', placeholder: 'e.g. 12 inch' },
    { key: 'Tyre Size (Rear)', label: 'Tyre Size (Rear)', placeholder: 'e.g. 12 inch' },
    { key: 'Boot Space', label: 'Boot Space', placeholder: 'e.g. 34 L' },
    { key: 'Ground Clearance', label: 'Ground Clearance', placeholder: 'e.g. 155 mm' },
    { key: 'Wheelbase', label: 'Wheelbase', placeholder: 'e.g. 1280 mm' },
    { key: 'Charging Port', label: 'Charging Port', placeholder: 'e.g. Type-2' },
    { key: 'Max Payload', label: 'Max Payload', placeholder: 'e.g. 150 kg' },
  ],
  bike: [
    { key: 'Kerb Weight', label: 'Kerb Weight', placeholder: 'e.g. 135 kg' },
    { key: 'Tyre Type', label: 'Tyre Type', placeholder: 'e.g. Tubeless' },
    { key: 'Tyre Size (Front)', label: 'Tyre Size (Front)', placeholder: 'e.g. 18 inch' },
    { key: 'Tyre Size (Rear)', label: 'Tyre Size (Rear)', placeholder: 'e.g. 18 inch' },
    { key: 'Ground Clearance', label: 'Ground Clearance', placeholder: 'e.g. 165 mm' },
    { key: 'Wheelbase', label: 'Wheelbase', placeholder: 'e.g. 1350 mm' },
    { key: 'Seat Height', label: 'Seat Height', placeholder: 'e.g. 780 mm' },
    { key: 'Charging Port', label: 'Charging Port', placeholder: 'e.g. CCS2' },
    { key: 'Max Payload', label: 'Max Payload', placeholder: 'e.g. 180 kg' },
  ],
  car: [
    { key: 'Kerb Weight', label: 'Kerb Weight', placeholder: 'e.g. 1350 kg' },
    { key: 'Seating Capacity', label: 'Seating Capacity', placeholder: 'e.g. 5 seater' },
    { key: 'Boot Space', label: 'Boot Space', placeholder: 'e.g. 350 L' },
    { key: 'Ground Clearance', label: 'Ground Clearance', placeholder: 'e.g. 160 mm' },
    { key: 'Wheelbase', label: 'Wheelbase', placeholder: 'e.g. 2600 mm' },
    { key: 'Tyre Size', label: 'Tyre Size', placeholder: 'e.g. 195/55 R16' },
    { key: 'Charging Port', label: 'Charging Port', placeholder: 'e.g. CCS2 / Type-2' },
    { key: 'Drive Type', label: 'Drive Type', placeholder: 'e.g. FWD' },
    { key: 'Airbags', label: 'Airbags', placeholder: 'e.g. 6' },
  ],
};

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
  pros: [],
  cons: [],
  specifications: {},
  status: 'active',
  is_available: true,
  is_featured: false,
  sort_order: 0,
};

// Common features by vehicle type
const commonFeatures: Record<string, string[]> = {
  scooter: [
    'Regenerative Braking', 'Reverse Mode', 'USB Charging Port', 'Keyless Entry',
    'App Connectivity', 'GPS Navigation', 'OTA Updates', 'LED Headlight',
    'Digital Instrument Cluster', 'Side Stand Motor Cut-off', 'Anti-theft Alarm',
    'Parking Assist', 'Cruise Control', 'Riding Modes', 'Quick Charging Support',
  ],
  bike: [
    'Regenerative Braking', 'Quick Shifter', 'App Connectivity', 'GPS Navigation',
    'OTA Updates', 'LED Headlight', 'Digital Instrument Cluster', 'Side Stand Motor Cut-off',
    'Anti-theft Alarm', 'Cruise Control', 'Riding Modes', 'Fast Charging Support',
    'Traction Control', 'ABS', 'Adjustable Suspension',
  ],
  car: [
    'Regenerative Braking', 'Keyless Entry', 'Push Button Start', 'Climate Control',
    'Touchscreen Infotainment', 'Apple CarPlay', 'Android Auto', 'App Connectivity',
    'OTA Updates', 'GPS Navigation', 'Rear Parking Camera', 'Parking Sensors',
    'Riding Modes', 'Fast Charging Support', 'Sunroof', 'Wireless Charging Pad',
    'Voice Commands', 'Connected Car Features', 'Heated Seats', 'Ventilated Seats',
  ],
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
  const [vehicleType, setVehicleType] = useState<string>('scooter');

  // Form input states for arrays
  const [colorInput, setColorInput] = useState('');
  const [colorHexInput, setColorHexInput] = useState('#9ca3af');
  const [featureInput, setFeatureInput] = useState('');
  const [proInput, setProInput] = useState('');
  const [conInput, setConInput] = useState('');
  const [galleryInput, setGalleryInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'specs' | 'media' | 'colors'>('basic');

  // Fetch vehicle type when vehicleId changes
  useEffect(() => {
    if (vehicleId) {
      supabase
        .from('vehicles')
        .select('type')
        .eq('id', vehicleId)
        .single()
        .then(({ data }) => {
          if (data?.type) setVehicleType(data.type);
        });
    }
  }, [vehicleId]);

  // Reset form when drawer opens/close or variant changes
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
          pros: variant.pros || [],
          cons: variant.cons || [],
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
        color_hexes: [...(formData.color_hexes || []), colorHexInput || '#9ca3af'],
      });
      setColorInput('');
      setColorHexInput('#9ca3af');
    }
  };

  const removeColor = (index: number) => {
    setFormData({
      ...formData,
      colors: (formData.colors || []).filter((_, i) => i !== index),
      color_hexes: (formData.color_hexes || []).filter((_, i) => i !== index),
    });
  };

  const addFeature = (feature?: string) => {
    const value = feature || featureInput.trim();
    if (value && !(formData.features || []).includes(value)) {
      setFormData({ ...formData, features: [...(formData.features || []), value] });
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({ ...formData, features: (formData.features || []).filter((_, i) => i !== index) });
  };

  const addPro = () => {
    const value = proInput.trim();
    if (value && !(formData.pros || []).includes(value)) {
      setFormData({ ...formData, pros: [...(formData.pros || []), value] });
      setProInput('');
    }
  };

  const removePro = (index: number) => {
    setFormData({ ...formData, pros: (formData.pros || []).filter((_, i) => i !== index) });
  };

  const addCon = () => {
    const value = conInput.trim();
    if (value && !(formData.cons || []).includes(value)) {
      setFormData({ ...formData, cons: [...(formData.cons || []), value] });
      setConInput('');
    }
  };

  const removeCon = (index: number) => {
    setFormData({ ...formData, cons: (formData.cons || []).filter((_, i) => i !== index) });
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

  const addSpecification = (key?: string, value?: string) => {
    const k = key || specKey.trim();
    const v = value || specValue.trim();
    if (k) {
      setFormData({
        ...formData,
        specifications: { ...(formData.specifications || {}), [k]: v },
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

  const applyTemplateSpecs = () => {
    const template = specTemplates[vehicleType] || [];
    const currentSpecs = { ...(formData.specifications || {}) };
    template.forEach(spec => {
      if (!currentSpecs[spec.key]) {
        currentSpecs[spec.key] = '';
      }
    });
    setFormData({ ...formData, specifications: currentSpecs });
  };

  const formatPrice = (price: number) => {
    if (price >= 100000) return `${(price / 100000).toFixed(2)}L`;
    return price.toLocaleString('en-IN');
  };

  if (!open) return null;

  const currentSpecTemplate = specTemplates[vehicleType] || [];
  const currentFeatures = commonFeatures[vehicleType] || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {variant ? 'Edit Variant' : 'Create New Variant'}
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              {variant ? `Editing ${variant.name}` : 'Add a new variant'}
              <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded capitalize ml-1">{vehicleType}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
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
                    placeholder={vehicleType === 'car' ? 'e.g. S, Pro, LXi' : 'e.g. STD, Pro, Max'}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]',
                      errors.name ? 'border-red-300' : 'border-gray-200'
                    )}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Short Name */}
                <div className="grid grid-cols-2 gap-4">
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

                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Price (Rs.) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rs.</span>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      placeholder="Ex-showroom price"
                      className={cn(
                        'w-full pl-12 pr-16 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]',
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

                {/* Status */}
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Availability</label>
                    <select
                      value={formData.is_available ? 'yes' : 'no'}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.value === 'yes' })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    >
                      <option value="yes">Available</option>
                      <option value="no">Out of Stock</option>
                    </select>
                  </div>
                </div>

                {/* Default Variant Checkbox */}
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured ?? false}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-4 h-4 rounded accent-[#145a2c]"
                    />
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      <Star size={14} className={formData.is_featured ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                      Set as Default Variant
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Specs Tab */}
            {activeTab === 'specs' && (
              <div className="space-y-5">
                {/* Core Specs */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Core Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Range (km)</label>
                      <input
                        type="number"
                        value={formData.range_km || ''}
                        onChange={(e) => setFormData({ ...formData, range_km: parseInt(e.target.value) || null })}
                        placeholder="e.g. 120"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Battery (kWh)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.battery_capacity_kwh || ''}
                        onChange={(e) => setFormData({ ...formData, battery_capacity_kwh: parseFloat(e.target.value) || null })}
                        placeholder="e.g. 3.7"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Top Speed (km/h)</label>
                      <input
                        type="number"
                        value={formData.top_speed_kmh || ''}
                        onChange={(e) => setFormData({ ...formData, top_speed_kmh: parseInt(e.target.value) || null })}
                        placeholder={`e.g. ${vehicleType === 'car' ? 120 : 80}`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Motor Power (kW)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.motor_power_kw || ''}
                        onChange={(e) => setFormData({ ...formData, motor_power_kw: parseFloat(e.target.value) || null })}
                        placeholder={`e.g. ${vehicleType === 'car' ? 50 : 2.5}`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Charging Time (hrs)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.charging_time_hrs || ''}
                        onChange={(e) => setFormData({ ...formData, charging_time_hrs: parseFloat(e.target.value) || null })}
                        placeholder="e.g. 4.5"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kerb Weight (kg)</label>
                      <input
                        type="number"
                        value={formData.kerb_weight || ''}
                        onChange={(e) => setFormData({ ...formData, kerb_weight: parseInt(e.target.value) || null })}
                        placeholder={`e.g. ${vehicleType === 'car' ? 1350 : 118}`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Specifications with Template */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Additional Specifications</h3>
                    <button
                      type="button"
                      onClick={applyTemplateSpecs}
                      className="text-xs text-[#145a2c] hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Apply {vehicleType} template
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Key-value specs like Kerb Weight, Tyre Type, etc.</p>

                  <div className="space-y-2 mb-3">
                    {Object.entries(formData.specifications || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 group">
                        <div className="flex items-center gap-0.5">
                          <button type="button" className="p-0.5 hover:bg-gray-200 rounded">
                            <ChevronUp size={12} className="text-gray-400" />
                          </button>
                          <button type="button" className="p-0.5 hover:bg-gray-200 rounded">
                            <ChevronDown size={12} className="text-gray-400" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => {
                            const entries = Object.entries(formData.specifications || {});
                            const idx = entries.findIndex(([k]) => k === key);
                            entries[idx] = [e.target.value, value];
                            setFormData({ ...formData, specifications: Object.fromEntries(entries) });
                          }}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                        />
                        <input
                          type="text"
                          value={value || ''}
                          onChange={(e) => {
                            const specs = { ...(formData.specifications || {}) };
                            specs[key] = e.target.value;
                            setFormData({ ...formData, specifications: specs });
                          }}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                          placeholder="Value"
                        />
                        <button
                          type="button"
                          onClick={() => removeSpecification(key)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <X size={14} />
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
                    <button type="button" onClick={() => addSpecification()} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Features</h3>
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Quick add common features:</p>
                    <div className="flex flex-wrap gap-1">
                      {currentFeatures.filter(f => !(formData.features || []).includes(f)).slice(0, 8).map(feature => (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => addFeature(feature)}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-green-50 hover:text-[#145a2c] rounded-full transition-colors"
                        >
                          + {feature}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      placeholder="Add custom feature..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                    <button type="button" onClick={() => addFeature()} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(formData.features || []).map((feature, i) => (
                      <span key={i} className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        {feature}
                        <button type="button" onClick={() => removeFeature(i)} className="hover:text-red-600">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pros */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Pros / Advantages</h3>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={proInput}
                      onChange={(e) => setProInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPro())}
                      placeholder="Add pro..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                    <button type="button" onClick={() => addPro()} className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.pros || []).map((pro, i) => (
                      <span key={i} className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        {pro}
                        <button type="button" onClick={() => removePro(i)} className="hover:text-red-600">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cons */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Cons / Disadvantages</h3>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={conInput}
                      onChange={(e) => setConInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCon())}
                      placeholder="Add con..."
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                    <button type="button" onClick={() => addCon()} className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.cons || []).map((con, i) => (
                      <span key={i} className="bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        {con}
                        <button type="button" onClick={() => removeCon(i)} className="hover:text-red-600">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="space-y-5">
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
                    <button type="button" onClick={addGalleryUrl} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(formData.gallery_urls || []).map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="w-full aspect-square object-cover rounded-lg border border-gray-200" onError={(e) => { e.currentTarget.src = '/images/placeholders/image.png'; }} />
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
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Available Colors</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      placeholder="Color name (e.g. Midnight Blue)"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                    />
                    <input
                      type="color"
                      value={colorHexInput || '#9ca3af'}
                      onChange={(e) => setColorHexInput(e.target.value)}
                      className="w-10 h-10 border border-gray-200 rounded-lg cursor-pointer"
                      title="Pick color"
                    />
                    <button type="button" onClick={addColor} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(formData.colors || []).map((color, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                        <input
                          type="color"
                          value={formData.color_hexes?.[i] || '#9ca3af'}
                          onChange={(e) => {
                            const hexes = [...(formData.color_hexes || [])];
                            hexes[i] = e.target.value;
                            setFormData({ ...formData, color_hexes: hexes });
                          }}
                          className="w-8 h-8 border border-gray-200 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => {
                            const colors = [...(formData.colors || [])];
                            colors[i] = e.target.value;
                            setFormData({ ...formData, colors });
                          }}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
                        />
                        <button type="button" onClick={() => removeColor(i)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {(formData.colors || []).length === 0 && (
                      <div className="text-sm text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                        No colors added yet
                      </div>
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
