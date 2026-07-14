'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader as Loader2, Plus, Trash2, Percent, IndianRupee, Gift, Car, Bike, CircleCheck as CheckCircle } from 'lucide-react';
import { PricingProfile, PricingProfileSlab, VehiclePricingCategory, PricingCity } from '@/lib/types';
import { ProfileInput } from '@/hooks/usePricingProfiles';
import { toast } from 'sonner';

interface PricingProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  profile: PricingProfile | null;
  cities: PricingCity[];
  mode: 'create' | 'edit' | 'duplicate';
}

const VEHICLE_CATEGORIES: { value: VehiclePricingCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'electric_car', label: 'Electric Car', icon: <Car size={14} /> },
  { value: 'electric_bike', label: 'Electric Bike', icon: <Bike size={14} /> },
  { value: 'electric_scooter', label: 'Electric Scooter', icon: <Bike size={14} /> },
];

const DEFAULT_FORM: ProfileInput & { slabs: Partial<PricingProfileSlab>[] } = {
  name: '',
  description: '',
  city_id: null,
  vehicle_category: 'electric_car',
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
  const [form, setForm] = useState<ProfileInput & { slabs: Partial<PricingProfileSlab>[] }>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && mode === 'edit') {
      setForm({
        ...profile,
        slabs: profile.slabs || [],
      } as any);
    } else if (profile && mode === 'duplicate') {
      setForm({
        ...DEFAULT_FORM,
        name: `${profile.name} (Copy)`,
        status: 'draft',
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
        calculation_order: profile.calculation_order,
        vehicle_category: profile.vehicle_category,
        city_id: profile.city_id,
        has_subsidy: profile.has_subsidy,
        subsidy_type: profile.subsidy_type,
        subsidy_value: profile.subsidy_value,
        subsidy_title: profile.subsidy_title,
        subsidy_badge_text: profile.subsidy_badge_text,
        subsidy_description: profile.subsidy_description,
        subsidy_start_date: profile.subsidy_start_date,
        subsidy_end_date: profile.subsidy_end_date,
        slabs: (profile.slabs || []).map(s => ({ ...s, id: undefined })),
      } as any);
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [profile, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Profile name is required'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addSlab = () => {
    setForm(f => ({ ...f, slabs: [...f.slabs, { min_price: 0, max_price: null, tax_percentage: 5, sort_order: f.slabs.length, is_active: true }] }));
  };

  const updateSlab = (index: number, field: string, value: any) => {
    setForm(f => {
      const slabs = [...f.slabs];
      slabs[index] = { ...slabs[index], [field]: value };
      return { ...f, slabs };
    });
  };

  const removeSlab = (index: number) => {
    setForm(f => ({ ...f, slabs: f.slabs.filter((_, i) => i !== index) }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'create' && 'Create Pricing Profile'}
            {mode === 'edit' && 'Edit Pricing Profile'}
            {mode === 'duplicate' && 'Duplicate Pricing Profile'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Profile Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
              placeholder="e.g., Delhi - Electric Car Standard"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
              placeholder="Profile description..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
              <select
                value={form.city_id || ''}
                onChange={(e) => setForm(f => ({ ...f, city_id: e.target.value || null }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
              >
                <option value="">All Cities (Default)</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle Category *</label>
              <select
                value={form.vehicle_category}
                onChange={(e) => setForm(f => ({ ...f, vehicle_category: e.target.value as VehiclePricingCategory }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
              >
                {VEHICLE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value as any }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
              <input
                type="number"
                value={form.priority ?? 0}
                onChange={(e) => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                placeholder="0"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Percent size={16} className="text-[#145a2c]" />
              Percentage Charges
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">RTO %</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.rto_percentage ?? 0}
                  onChange={(e) => setForm(f => ({ ...f, rto_percentage: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Insurance %</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.insurance_percentage ?? 0}
                  onChange={(e) => setForm(f => ({ ...f, insurance_percentage: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <IndianRupee size={16} className="text-[#145a2c]" />
              Fixed Charges
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'registration_fee', label: 'Registration' },
                { key: 'hsrp_fee', label: 'HSRP' },
                { key: 'fastag_fee', label: 'FASTag' },
                { key: 'handling_charges', label: 'Handling' },
                { key: 'dealer_charges', label: 'Dealer' },
                { key: 'delivery_charges', label: 'Delivery' },
                { key: 'accessories_charges', label: 'Accessories' },
                { key: 'other_charges', label: 'Other' },
                { key: 'misc_charges', label: 'Misc' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                  <input
                    type="number"
                    value={(form as any)[field.key] ?? 0}
                    onChange={(e) => setForm(f => ({ ...f, [field.key]: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Tax Slabs</h3>
              <button type="button" onClick={addSlab} className="flex items-center gap-1 text-xs font-medium text-[#145a2c] hover:text-[#0f4020]">
                <Plus size={14} /> Add Slab
              </button>
            </div>
            {form.slabs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">No tax slabs. Add one to define GST brackets by price range.</p>
            ) : (
              <div className="space-y-2">
                {form.slabs.map((slab, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                    <input
                      type="number"
                      value={slab.min_price ?? 0}
                      onChange={(e) => updateSlab(i, 'min_price', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                      placeholder="Min ₹"
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input
                      type="number"
                      value={slab.max_price ?? ''}
                      onChange={(e) => updateSlab(i, 'max_price', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                      placeholder="Max ₹"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={slab.tax_percentage ?? 0}
                      onChange={(e) => updateSlab(i, 'tax_percentage', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-xs"
                      placeholder="GST %"
                    />
                    <button type="button" onClick={() => removeSlab(i)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Gift size={16} className="text-[#145a2c]" />
              Subsidy Configuration
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="has_subsidy"
                checked={form.has_subsidy ?? false}
                onChange={(e) => setForm(f => ({ ...f, has_subsidy: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-[#145a2c] focus:ring-[#145a2c]"
              />
              <label htmlFor="has_subsidy" className="text-sm text-gray-700">Enable subsidy for this profile</label>
            </div>
            {form.has_subsidy && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subsidy Type</label>
                  <select
                    value={form.subsidy_type || 'fixed'}
                    onChange={(e) => setForm(f => ({ ...f, subsidy_type: e.target.value as 'fixed' | 'percentage' }))}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subsidy Value</label>
                  <input
                    type="number"
                    value={form.subsidy_value ?? 0}
                    onChange={(e) => setForm(f => ({ ...f, subsidy_value: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Subsidy Title</label>
                  <input
                    type="text"
                    value={form.subsidy_title || ''}
                    onChange={(e) => setForm(f => ({ ...f, subsidy_title: e.target.value }))}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="e.g., Government EV Subsidy"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={form.subsidy_badge_text || ''}
                    onChange={(e) => setForm(f => ({ ...f, subsidy_badge_text: e.target.value }))}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="e.g., Save ₹10,000"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea
                    value={form.subsidy_description || ''}
                    onChange={(e) => setForm(f => ({ ...f, subsidy_description: e.target.value }))}
                    rows={2}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="Subsidy description..."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
            <button type="button" onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#145a2c] text-white rounded-xl text-sm font-semibold hover:bg-[#0f4020] transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
