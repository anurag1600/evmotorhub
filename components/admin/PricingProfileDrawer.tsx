'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader as Loader2, Percent, IndianRupee, Gift, Calendar, Tag, Filter, Layers, Plus, Trash2, ChevronUp, ChevronDown, CircleAlert as AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PricingProfile, PricingCity, PricingProfileSlab, VehiclePricingCategory, VehicleType, Manufacturer, Vehicle, VehicleVariant } from '@/lib/types';

interface PricingProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProfileFormData) => Promise<void>;
  profile?: PricingProfile | null;
  cities: PricingCity[];
  mode: 'create' | 'edit' | 'duplicate';
}

export interface ProfileFormData {
  name: string;
  description: string | null;
  city_id: string | null;
  vehicle_category: VehiclePricingCategory;
  status: 'draft' | 'published' | 'archived';
  rto_percentage: number;
  insurance_percentage: number;
  registration_fee: number;
  hsrp_fee: number;
  fastag_fee: number;
  handling_charges: number;
  dealer_charges: number;
  delivery_charges: number;
  accessories_charges: number;
  other_charges: number;
  misc_charges: number;
  show_rto: boolean;
  show_insurance: boolean;
  show_registration: boolean;
  show_hsrp: boolean;
  show_fastag: boolean;
  show_handling: boolean;
  show_dealer: boolean;
  show_delivery: boolean;
  show_accessories: boolean;
  show_other: boolean;
  show_misc: boolean;
  calculation_order: string[];
  brand_id: string | null;
  vehicle_id: string | null;
  variant_id: string | null;
  vehicle_type: VehicleType | null;
  battery_min_kwh: number | null;
  battery_max_kwh: number | null;
  price_range_min: number | null;
  price_range_max: number | null;
  priority: number;
  effective_date: string | null;
  has_subsidy: boolean;
  subsidy_type: 'fixed' | 'percentage';
  subsidy_value: number;
  subsidy_title: string | null;
  subsidy_badge_text: string | null;
  subsidy_description: string | null;
  subsidy_start_date: string | null;
  subsidy_end_date: string | null;
  slabs: Omit<PricingProfileSlab, 'id' | 'profile_id' | 'created_at' | 'updated_at'>[];
}

const CHARGE_COMPONENTS = [
  { key: 'rto', label: 'Road Tax (RTO)', isPercentage: true },
  { key: 'insurance', label: 'Insurance', isPercentage: true },
  { key: 'registration', label: 'Registration Fee', isPercentage: false },
  { key: 'hsrp', label: 'HSRP Fee', isPercentage: false },
  { key: 'fastag', label: 'FASTag', isPercentage: false },
  { key: 'handling', label: 'Handling Charges', isPercentage: false },
  { key: 'dealer', label: 'Dealer Charges', isPercentage: false },
  { key: 'delivery', label: 'Delivery Charges', isPercentage: false },
  { key: 'accessories', label: 'Accessories', isPercentage: false },
  { key: 'other', label: 'Other Charges', isPercentage: false },
  { key: 'misc', label: 'Miscellaneous', isPercentage: false },
];

const VEHICLE_CATEGORIES: { value: VehiclePricingCategory; label: string }[] = [
  { value: 'electric_car', label: 'Electric Car' },
  { value: 'electric_scooter', label: 'Electric Scooter' },
  { value: 'electric_bike', label: 'Electric Bike' },
];

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'scooter', label: 'Scooter' },
  { value: 'bike', label: 'Bike' },
  { value: 'car', label: 'Car' },
];

const defaultFormState: ProfileFormData = {
  name: '',
  description: null,
  city_id: null,
  vehicle_category: 'electric_scooter',
  status: 'draft',
  rto_percentage: 0,
  insurance_percentage: 0,
  registration_fee: 0,
  hsrp_fee: 0,
  fastag_fee: 0,
  handling_charges: 0,
  dealer_charges: 0,
  delivery_charges: 0,
  accessories_charges: 0,
  other_charges: 0,
  misc_charges: 0,
  show_rto: true,
  show_insurance: true,
  show_registration: true,
  show_hsrp: true,
  show_fastag: true,
  show_handling: false,
  show_dealer: false,
  show_delivery: false,
  show_accessories: false,
  show_other: true,
  show_misc: false,
  calculation_order: ['rto', 'insurance', 'registration', 'hsrp', 'fastag', 'handling', 'dealer', 'delivery', 'accessories', 'other', 'misc'],
  brand_id: null,
  vehicle_id: null,
  variant_id: null,
  vehicle_type: null,
  battery_min_kwh: null,
  battery_max_kwh: null,
  price_range_min: null,
  price_range_max: null,
  priority: 0,
  effective_date: null,
  has_subsidy: false,
  subsidy_type: 'fixed',
  subsidy_value: 0,
  subsidy_title: null,
  subsidy_badge_text: null,
  subsidy_description: null,
  subsidy_start_date: null,
  subsidy_end_date: null,
  slabs: [],
};

export default function PricingProfileDrawer({ isOpen, onClose, onSave, profile, cities, mode }: PricingProfileDrawerProps) {
  const [form, setForm] = useState<ProfileFormData>(defaultFormState);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'charges' | 'conditions' | 'subsidy' | 'slabs'>('basic');

  useEffect(() => {
    if (profile && (mode === 'edit' || mode === 'duplicate')) {
      setForm({
        name: mode === 'duplicate' ? `${profile.name} (Copy)` : profile.name,
        description: profile.description,
        city_id: profile.city_id,
        vehicle_category: profile.vehicle_category,
        status: mode === 'duplicate' ? 'draft' : profile.status,
        rto_percentage: profile.rto_percentage,
        insurance_percentage: profile.insurance_percentage,
        registration_fee: profile.registration_fee,
        hsrp_fee: profile.hsrp_fee,
        fastag_fee: profile.fastag_fee,
        handling_charges: profile.handling_charges,
        dealer_charges: profile.dealer_charges,
        delivery_charges: profile.delivery_charges,
        accessories_charges: profile.accessories_charges,
        other_charges: profile.other_charges,
        misc_charges: profile.misc_charges,
        show_rto: profile.show_rto,
        show_insurance: profile.show_insurance,
        show_registration: profile.show_registration,
        show_hsrp: profile.show_hsrp,
        show_fastag: profile.show_fastag,
        show_handling: profile.show_handling,
        show_dealer: profile.show_dealer,
        show_delivery: profile.show_delivery,
        show_accessories: profile.show_accessories,
        show_other: profile.show_other,
        show_misc: profile.show_misc,
        calculation_order: profile.calculation_order || defaultFormState.calculation_order,
        brand_id: profile.brand_id,
        vehicle_id: profile.vehicle_id,
        variant_id: profile.variant_id,
        vehicle_type: profile.vehicle_type,
        battery_min_kwh: profile.battery_min_kwh,
        battery_max_kwh: profile.battery_max_kwh,
        price_range_min: profile.price_range_min,
        price_range_max: profile.price_range_max,
        priority: profile.priority,
        effective_date: profile.effective_date,
        has_subsidy: profile.has_subsidy,
        subsidy_type: profile.subsidy_type,
        subsidy_value: profile.subsidy_value,
        subsidy_title: profile.subsidy_title,
        subsidy_badge_text: profile.subsidy_badge_text,
        subsidy_description: profile.subsidy_description,
        subsidy_start_date: profile.subsidy_start_date,
        subsidy_end_date: profile.subsidy_end_date,
        slabs: (profile.slabs || []).map(s => ({
          min_price: s.min_price,
          max_price: s.max_price,
          tax_percentage: s.tax_percentage,
          sort_order: s.sort_order,
          is_active: s.is_active,
        })),
      });
    } else {
      setForm(defaultFormState);
    }
  }, [profile, mode, isOpen]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Profile name is required');
      return;
    }
    if (!form.city_id) {
      toast.error('City is required');
      return;
    }

    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addSlab = () => {
    setForm(prev => ({
      ...prev,
      slabs: [...prev.slabs, {
        min_price: 0,
        max_price: null,
        tax_percentage: 0,
        sort_order: prev.slabs.length,
        is_active: true,
      }],
    }));
  };

  const updateSlab = (index: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      slabs: prev.slabs.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const removeSlab = (index: number) => {
    setForm(prev => ({
      ...prev,
      slabs: prev.slabs.filter((_, i) => i !== index).map((s, i) => ({ ...s, sort_order: i })),
    }));
  };

  const moveCalculationOrder = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= form.calculation_order.length) return;

    const newOrder = [...form.calculation_order];
    [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];
    setForm(prev => ({ ...prev, calculation_order: newOrder }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'create' ? 'Create Pricing Profile' : mode === 'duplicate' ? 'Duplicate Pricing Profile' : 'Edit Pricing Profile'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 px-6 pt-4 border-b border-gray-100">
          {[
            { key: 'basic', label: 'Basic Info' },
            { key: 'charges', label: 'Charges' },
            { key: 'conditions', label: 'Conditions' },
            { key: 'subsidy', label: 'Subsidy' },
            { key: 'slabs', label: 'Tax Slabs' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                activeTab === tab.key
                  ? 'bg-[#145a2c] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Delhi Electric Scooter Pricing"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Category *</label>
                  <select
                    value={form.vehicle_category}
                    onChange={(e) => updateField('vehicle_category', e.target.value as VehiclePricingCategory)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                  >
                    {VEHICLE_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <select
                    value={form.city_id || ''}
                    onChange={(e) => updateField('city_id', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                  >
                    <option value="">Select City</option>
                    {cities.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}, {c.state?.name || 'Unknown State'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateField('status', e.target.value as 'draft' | 'published' | 'archived')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => updateField('description', e.target.value || null)}
                  placeholder="Optional description for this pricing profile"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => updateField('priority', parseInt(e.target.value) || 0)}
                    placeholder="Higher priority profiles take precedence"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher number = higher priority</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={form.effective_date || ''}
                    onChange={(e) => updateField('effective_date', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Charges Tab */}
          {activeTab === 'charges' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Charge Components:</strong> Enable charges you want to show in the price breakdown. Set percentage or fixed values. The calculation order determines how they appear.
                </div>
              </div>

              <div className="space-y-3">
                {CHARGE_COMPONENTS.map((component) => {
                  const showKey = `show_${component.key}` as keyof ProfileFormData;
                  const valueKey = component.isPercentage
                    ? `${component.key}_percentage` as keyof ProfileFormData
                    : `${component.key}_fee` as keyof ProfileFormData;

                  return (
                    <div key={component.key} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <label className="flex items-center gap-2 min-w-[200px]">
                        <input
                          type="checkbox"
                          checked={form[showKey] as boolean}
                          onChange={(e) => updateField(showKey, e.target.checked)}
                          className="w-4 h-4 rounded accent-[#145a2c]"
                        />
                        <span className="text-sm font-medium text-gray-700">{component.label}</span>
                      </label>
                      <div className="flex-1 flex items-center gap-2">
                        {component.isPercentage ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={form[valueKey] as number}
                              onChange={(e) => updateField(valueKey, parseFloat(e.target.value) || 0)}
                              className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-right"
                            />
                            <Percent size={14} className="text-gray-500" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <IndianRupee size={14} className="text-gray-500" />
                            <input
                              type="number"
                              value={form[valueKey] as number}
                              onChange={(e) => updateField(valueKey, parseInt(e.target.value) || 0)}
                              className="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-right"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calculation Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Calculation Order</label>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  {form.calculation_order.map((key, index) => {
                    const component = CHARGE_COMPONENTS.find(c => c.key === key);
                    if (!component) return null;
                    return (
                      <div key={key} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                        <span className="text-xs text-gray-400 w-6">{index + 1}.</span>
                        <span className="flex-1 text-sm">{component.label}</span>
                        <button
                          onClick={() => moveCalculationOrder(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => moveCalculationOrder(index, 'down')}
                          disabled={index === form.calculation_order.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Conditions Tab */}
          {activeTab === 'conditions' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
                <Filter size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Rule Conditions:</strong> These conditions determine when this pricing profile applies. Leave blank to apply to all. More specific conditions take precedence.
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    value={form.vehicle_type || ''}
                    onChange={(e) => updateField('vehicle_type', e.target.value as VehicleType || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    {VEHICLE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Battery Capacity (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.battery_min_kwh || ''}
                    onChange={(e) => updateField('battery_min_kwh', parseFloat(e.target.value) || null)}
                    placeholder="e.g., 2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Battery Capacity (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.battery_max_kwh || ''}
                    onChange={(e) => updateField('battery_max_kwh', parseFloat(e.target.value) || null)}
                    placeholder="e.g., 5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Price Range</label>
                  <div className="flex items-center gap-1">
                    <IndianRupee size={14} className="text-gray-500" />
                    <input
                      type="number"
                      value={form.price_range_min || ''}
                      onChange={(e) => updateField('price_range_min', parseInt(e.target.value) || null)}
                      placeholder="e.g., 50000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Price Range</label>
                  <div className="flex items-center gap-1">
                    <IndianRupee size={14} className="text-gray-500" />
                    <input
                      type="number"
                      value={form.price_range_max || ''}
                      onChange={(e) => updateField('price_range_max', parseInt(e.target.value) || null)}
                      placeholder="e.g., 150000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subsidy Tab */}
          {activeTab === 'subsidy' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.has_subsidy}
                  onChange={(e) => updateField('has_subsidy', e.target.checked)}
                  className="w-5 h-5 rounded accent-[#145a2c]"
                />
                <span className="font-medium text-gray-700">Enable Subsidy</span>
              </label>

              {form.has_subsidy && (
                <div className="space-y-4 pl-7 border-l-2 border-[#145a2c]">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subsidy Type</label>
                      <select
                        value={form.subsidy_type}
                        onChange={(e) => updateField('subsidy_type', e.target.value as 'fixed' | 'percentage')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                      >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                      <div className="flex items-center gap-1">
                        {form.subsidy_type === 'fixed' ? (
                          <IndianRupee size={14} className="text-gray-500" />
                        ) : (
                          <Percent size={14} className="text-gray-500" />
                        )}
                        <input
                          type="number"
                          step={form.subsidy_type === 'percentage' ? '0.01' : '1'}
                          value={form.subsidy_value}
                          onChange={(e) => updateField('subsidy_value', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={form.subsidy_title || ''}
                        onChange={(e) => updateField('subsidy_title', e.target.value || null)}
                        placeholder="e.g., FAME-II Subsidy"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={form.subsidy_badge_text || ''}
                        onChange={(e) => updateField('subsidy_badge_text', e.target.value || null)}
                        placeholder="e.g., Save Rs. 10,000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={form.subsidy_description || ''}
                      onChange={(e) => updateField('subsidy_description', e.target.value || null)}
                      placeholder="Detailed subsidy information..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={form.subsidy_start_date || ''}
                        onChange={(e) => updateField('subsidy_start_date', e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={form.subsidy_end_date || ''}
                        onChange={(e) => updateField('subsidy_end_date', e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145a2c] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Subsidy auto-expires after this date</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tax Slabs Tab */}
          {activeTab === 'slabs' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800 flex items-start gap-2">
                <Layers size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Tax Slabs:</strong> Configure progressive tax rates based on price ranges. These override the default RTO percentage for vehicles in each price range.
                </div>
              </div>

              <button
                type="button"
                onClick={addSlab}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700"
              >
                <Plus size={14} />
                Add Tax Slab
              </button>

              {form.slabs.length > 0 && (
                <div className="space-y-2">
                  {form.slabs.map((slab, index) => (
                    <div key={index} className="grid sm:grid-cols-6 gap-2 p-3 bg-gray-50 rounded-lg items-center">
                      <div className="sm:col-span-2">
                        <label className="text-xs text-gray-500">Min Price</label>
                        <div className="flex items-center gap-1">
                          <IndianRupee size={12} className="text-gray-400" />
                          <input
                            type="number"
                            value={slab.min_price}
                            onChange={(e) => updateSlab(index, 'min_price', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-gray-500">Max Price (blank = unlimited)</label>
                        <div className="flex items-center gap-1">
                          <IndianRupee size={12} className="text-gray-400" />
                          <input
                            type="number"
                            value={slab.max_price || ''}
                            onChange={(e) => updateSlab(index, 'max_price', parseInt(e.target.value) || null)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Tax %</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={slab.tax_percentage}
                            onChange={(e) => updateSlab(index, 'tax_percentage', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                          <Percent size={12} className="text-gray-400" />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeSlab(index)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#145a2c] text-white rounded-lg hover:bg-[#0d4221] disabled:opacity-50 text-sm font-medium"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {mode === 'create' ? 'Create Profile' : mode === 'duplicate' ? 'Create Copy' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
