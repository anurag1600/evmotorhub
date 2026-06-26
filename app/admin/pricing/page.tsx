'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PricingState, PricingCity, PricingRule, PricingSlab, PricingSubsidy, VehiclePricingCategory } from '@/lib/types';
import { MapPin, Plus, Pencil, Trash2, Save, Loader as Loader2, X, Star, Download, Upload, FileText, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Eye, EyeOff, Percent, IndianRupee, Layers, Gift, Car, Bike, CircleDot as Circle, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CityWithState extends PricingCity {
  state?: PricingState;
}

interface RuleWithCity extends PricingRule {
  city?: CityWithState;
}

interface SubsidyWithCity extends PricingSubsidy {
  city?: CityWithState;
}

const VEHICLE_CATEGORIES: { value: VehiclePricingCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'electric_car', label: 'Electric Car', icon: <Car size={14} /> },
  { value: 'electric_scooter', label: 'Electric Scooter', icon: <Circle size={14} /> },
  { value: 'electric_bike', label: 'Electric Bike', icon: <Bike size={14} /> },
];

const CATEGORY_LABELS: Record<VehiclePricingCategory, string> = {
  electric_car: 'Electric Car',
  electric_scooter: 'Electric Scooter',
  electric_bike: 'Electric Bike',
};

export default function PricingManagementPage() {
  const [states, setStates] = useState<PricingState[]>([]);
  const [cities, setCities] = useState<CityWithState[]>([]);
  const [rules, setRules] = useState<RuleWithCity[]>([]);
  const [slabs, setSlabs] = useState<PricingSlab[]>([]);
  const [subsidies, setSubsidies] = useState<SubsidyWithCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'cities' | 'rules' | 'slabs' | 'subsidies'>('cities');

  // Form states
  const [editingCity, setEditingCity] = useState<CityWithState | null>(null);
  const [editingRule, setEditingRule] = useState<RuleWithCity | null>(null);
  const [editingSlab, setEditingSlab] = useState<PricingSlab | null>(null);
  const [editingSubsidy, setEditingSubsidy] = useState<SubsidyWithCity | null>(null);
  const [showCityForm, setShowCityForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showSlabForm, setShowSlabForm] = useState(false);
  const [showSubsidyForm, setShowSubsidyForm] = useState(false);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  const [cityForm, setCityForm] = useState({
    state_id: '',
    name: '',
    pincode: '',
    is_popular: false,
    is_active: true,
  });

  const [ruleForm, setRuleForm] = useState({
    city_id: '',
    vehicle_category: 'electric_car' as VehiclePricingCategory,
    rto_percentage: '8',
    insurance_percentage: '3.5',
    registration_fee: '1000',
    hsrp_fee: '500',
    fastag_fee: '500',
    other_charges: '1000',
    show_rto: true,
    show_insurance: true,
    show_registration: true,
    show_hsrp: true,
    show_fastag: true,
    show_other: true,
  });

  const [slabForm, setSlabForm] = useState({
    rule_id: '',
    min_price: '0',
    max_price: '',
    tax_percentage: '8',
    sort_order: '1',
  });

  const [subsidyForm, setSubsidyForm] = useState({
    city_id: '',
    vehicle_category: 'electric_car' as VehiclePricingCategory,
    subsidy_type: 'fixed' as 'fixed' | 'percentage',
    value: '0',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statesRes, citiesRes, rulesRes, slabsRes, subsidiesRes] = await Promise.all([
        supabase.from('pricing_states').select('*').order('name'),
        supabase.from('pricing_cities').select('*, state:pricing_states(*)').order('is_popular', { ascending: false }).order('name'),
        supabase.from('pricing_rules').select('*, city:pricing_cities(*, state:pricing_states(*))').order('created_at'),
        supabase.from('pricing_slabs').select('*').order('sort_order'),
        supabase.from('pricing_subsidies').select('*, city:pricing_cities(*, state:pricing_states(*))').order('created_at'),
      ]);
      setStates((statesRes.data || []) as PricingState[]);
      setCities((citiesRes.data || []) as CityWithState[]);
      setRules((rulesRes.data || []) as RuleWithCity[]);
      setSlabs((slabsRes.data || []) as PricingSlab[]);
      setSubsidies((subsidiesRes.data || []) as SubsidyWithCity[]);
    } catch (err) {
      toast.error('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  // ==================== CITY CRUD ====================
  const handleSaveCity = async () => {
    if (!cityForm.state_id || !cityForm.name) {
      toast.error('State and city name are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        state_id: cityForm.state_id,
        name: cityForm.name.trim(),
        pincode: cityForm.pincode.trim() || null,
        is_popular: cityForm.is_popular,
        is_active: cityForm.is_active,
        rto_charge: 0,
        insurance_charge: 0,
        other_charges: 0,
      };

      if (editingCity) {
        const { error } = await supabase.from('pricing_cities').update(payload).eq('id', editingCity.id);
        if (error) throw error;
        toast.success('City updated');
      } else {
        const { error } = await supabase.from('pricing_cities').insert([payload]);
        if (error) throw error;
        toast.success('City added');
      }

      setShowCityForm(false);
      setEditingCity(null);
      setCityForm({ state_id: '', name: '', pincode: '', is_popular: false, is_active: true });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save city');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCity = async (id: string) => {
    if (!confirm('Delete this city? All associated rules, slabs, and subsidies will also be deleted.')) return;
    try {
      await supabase.from('pricing_cities').delete().eq('id', id);
      toast.success('City deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete city');
    }
  };

  // ==================== RULE CRUD ====================
  const handleSaveRule = async () => {
    if (!ruleForm.city_id) {
      toast.error('City is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        city_id: ruleForm.city_id,
        vehicle_category: ruleForm.vehicle_category,
        rto_percentage: parseFloat(ruleForm.rto_percentage) || 0,
        insurance_percentage: parseFloat(ruleForm.insurance_percentage) || 0,
        registration_fee: parseInt(ruleForm.registration_fee) || 0,
        hsrp_fee: parseInt(ruleForm.hsrp_fee) || 0,
        fastag_fee: parseInt(ruleForm.fastag_fee) || 0,
        other_charges: parseInt(ruleForm.other_charges) || 0,
        show_rto: ruleForm.show_rto,
        show_insurance: ruleForm.show_insurance,
        show_registration: ruleForm.show_registration,
        show_hsrp: ruleForm.show_hsrp,
        show_fastag: ruleForm.show_fastag,
        show_other: ruleForm.show_other,
      };

      if (editingRule) {
        const { error } = await supabase.from('pricing_rules').update(payload).eq('id', editingRule.id);
        if (error) throw error;
        toast.success('Rule updated');
      } else {
        const { error } = await supabase.from('pricing_rules').insert([payload]);
        if (error) throw error;
        toast.success('Rule added');
      }

      setShowRuleForm(false);
      setEditingRule(null);
      setRuleForm({
        city_id: '', vehicle_category: 'electric_car', rto_percentage: '8', insurance_percentage: '3.5',
        registration_fee: '1000', hsrp_fee: '500', fastag_fee: '500', other_charges: '1000',
        show_rto: true, show_insurance: true, show_registration: true, show_hsrp: true, show_fastag: true, show_other: true,
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Delete this rule? All associated slabs will also be deleted.')) return;
    try {
      await supabase.from('pricing_rules').delete().eq('id', id);
      toast.success('Rule deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete rule');
    }
  };

  // ==================== SLAB CRUD ====================
  const handleSaveSlab = async () => {
    if (!slabForm.rule_id) {
      toast.error('Rule is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        rule_id: slabForm.rule_id,
        min_price: parseInt(slabForm.min_price) || 0,
        max_price: slabForm.max_price ? parseInt(slabForm.max_price) : null,
        tax_percentage: parseFloat(slabForm.tax_percentage) || 0,
        sort_order: parseInt(slabForm.sort_order) || 1,
        is_active: true,
      };

      if (editingSlab) {
        const { error } = await supabase.from('pricing_slabs').update(payload).eq('id', editingSlab.id);
        if (error) throw error;
        toast.success('Slab updated');
      } else {
        const { error } = await supabase.from('pricing_slabs').insert([payload]);
        if (error) throw error;
        toast.success('Slab added');
      }

      setShowSlabForm(false);
      setEditingSlab(null);
      setSlabForm({ rule_id: '', min_price: '0', max_price: '', tax_percentage: '8', sort_order: '1' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save slab');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlab = async (id: string) => {
    if (!confirm('Delete this slab?')) return;
    try {
      await supabase.from('pricing_slabs').delete().eq('id', id);
      toast.success('Slab deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete slab');
    }
  };

  // ==================== SUBSIDY CRUD ====================
  const handleSaveSubsidy = async () => {
    if (!subsidyForm.city_id) {
      toast.error('City is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        city_id: subsidyForm.city_id,
        vehicle_category: subsidyForm.vehicle_category,
        subsidy_type: subsidyForm.subsidy_type,
        value: parseFloat(subsidyForm.value) || 0,
        description: subsidyForm.description.trim() || null,
        is_active: true,
      };

      if (editingSubsidy) {
        const { error } = await supabase.from('pricing_subsidies').update(payload).eq('id', editingSubsidy.id);
        if (error) throw error;
        toast.success('Subsidy updated');
      } else {
        const { error } = await supabase.from('pricing_subsidies').insert([payload]);
        if (error) throw error;
        toast.success('Subsidy added');
      }

      setShowSubsidyForm(false);
      setEditingSubsidy(null);
      setSubsidyForm({ city_id: '', vehicle_category: 'electric_car', subsidy_type: 'fixed', value: '0', description: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save subsidy');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubsidy = async (id: string) => {
    if (!confirm('Delete this subsidy?')) return;
    try {
      await supabase.from('pricing_subsidies').delete().eq('id', id);
      toast.success('Subsidy deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete subsidy');
    }
  };

  const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;
  const formatPriceRange = (min: number, max: number | null) => {
    const format = (n: number) => {
      if (n >= 10000000) return `Rs. ${(n / 10000000).toFixed(1)}Cr`;
      if (n >= 100000) return `Rs. ${(n / 100000).toFixed(1)}L`;
      return `Rs. ${n.toLocaleString('en-IN')}`;
    };
    return max ? `${format(min)} - ${format(max)}` : `${format(min)}+`;
  };

  const getRuleSlabs = (ruleId: string) => slabs.filter(s => s.rule_id === ruleId).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <MapPin size={28} className="text-[#145a2c]" />
              Pricing Management
            </h1>
            <p className="admin-subtitle">Configure dynamic percentage-based pricing for on-road price calculation</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'cities', label: 'Cities', count: cities.length, icon: <MapPin size={14} /> },
            { key: 'rules', label: 'Tax Rules', count: rules.length, icon: <Percent size={14} /> },
            { key: 'slabs', label: 'Tax Slabs', count: slabs.length, icon: <Layers size={14} /> },
            { key: 'subsidies', label: 'Subsidies', count: subsidies.length, icon: <Gift size={14} /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-[#145a2c] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              )}
            >
              {tab.icon}
              {tab.label}
              <span className={cn('px-1.5 py-0.5 rounded text-xs', activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100')}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* ==================== CITIES TAB ==================== */}
            {activeTab === 'cities' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowCityForm(true);
                      setEditingCity(null);
                      setCityForm({ state_id: states[0]?.id || '', name: '', pincode: '', is_popular: false, is_active: true });
                    }}
                    className="admin-btn-primary flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Add City
                  </button>
                </div>

                {showCityForm && (
                  <div className="admin-card p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-900">{editingCity ? 'Edit City' : 'Add New City'}</h3>
                      <button onClick={() => setShowCityForm(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">State *</label>
                        <select
                          value={cityForm.state_id}
                          onChange={(e) => setCityForm({ ...cityForm, state_id: e.target.value })}
                          className="admin-select"
                        >
                          <option value="">Select State</option>
                          {states.map((s) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">City Name *</label>
                        <input
                          type="text"
                          value={cityForm.name}
                          onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                          placeholder="e.g., Mumbai"
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Pincode</label>
                        <input
                          type="text"
                          value={cityForm.pincode}
                          onChange={(e) => setCityForm({ ...cityForm, pincode: e.target.value })}
                          placeholder="e.g., 400001"
                          className="admin-input"
                        />
                      </div>
                      <div className="flex items-end gap-4 pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cityForm.is_popular}
                            onChange={(e) => setCityForm({ ...cityForm, is_popular: e.target.checked })}
                            className="w-4 h-4 rounded accent-[#145a2c]"
                          />
                          <span className="text-sm text-gray-700">Popular</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cityForm.is_active}
                            onChange={(e) => setCityForm({ ...cityForm, is_active: e.target.checked })}
                            className="w-4 h-4 rounded accent-[#145a2c]"
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button onClick={handleSaveCity} disabled={saving} className="admin-btn-primary flex items-center gap-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {editingCity ? 'Update' : 'Add City'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="admin-card overflow-hidden">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>City</th>
                        <th>Pincode</th>
                        <th>State</th>
                        <th className="text-center">Popular</th>
                        <th className="text-center">Active</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cities.map((city) => (
                        <tr key={city.id}>
                          <td className="font-medium text-gray-900">{city.name}</td>
                          <td>
                            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                              {city.pincode || '-'}
                            </span>
                          </td>
                          <td>{city.state?.name || '-'}</td>
                          <td className="text-center">
                            {city.is_popular && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                                <Star size={10} />
                                Popular
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full', city.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                              {city.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => {
                                  setEditingCity(city);
                                  setCityForm({
                                    state_id: city.state_id,
                                    name: city.name,
                                    pincode: city.pincode || '',
                                    is_popular: city.is_popular || false,
                                    is_active: city.is_active !== false,
                                  });
                                  setShowCityForm(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteCity(city.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== TAX RULES TAB ==================== */}
            {activeTab === 'rules' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowRuleForm(true);
                      setEditingRule(null);
                      setRuleForm({
                        city_id: cities[0]?.id || '',
                        vehicle_category: 'electric_car',
                        rto_percentage: '8',
                        insurance_percentage: '3.5',
                        registration_fee: '1000',
                        hsrp_fee: '500',
                        fastag_fee: '500',
                        other_charges: '1000',
                        show_rto: true,
                        show_insurance: true,
                        show_registration: true,
                        show_hsrp: true,
                        show_fastag: true,
                        show_other: true,
                      });
                    }}
                    className="admin-btn-primary flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Add Tax Rule
                  </button>
                </div>

                {showRuleForm && (
                  <div className="admin-card p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-900">{editingRule ? 'Edit Tax Rule' : 'Add New Tax Rule'}</h3>
                      <button onClick={() => setShowRuleForm(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">City *</label>
                        <select
                          value={ruleForm.city_id}
                          onChange={(e) => setRuleForm({ ...ruleForm, city_id: e.target.value })}
                          className="admin-select"
                          disabled={!!editingRule}
                        >
                          <option value="">Select City</option>
                          {cities.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}, {c.state?.code}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Category *</label>
                        <select
                          value={ruleForm.vehicle_category}
                          onChange={(e) => setRuleForm({ ...ruleForm, vehicle_category: e.target.value as VehiclePricingCategory })}
                          className="admin-select"
                          disabled={!!editingRule}
                        >
                          {VEHICLE_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">RTO / Road Tax %</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={ruleForm.rto_percentage}
                            onChange={(e) => setRuleForm({ ...ruleForm, rto_percentage: e.target.value })}
                            className="admin-input pr-8"
                          />
                          <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Insurance %</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={ruleForm.insurance_percentage}
                            onChange={(e) => setRuleForm({ ...ruleForm, insurance_percentage: e.target.value })}
                            className="admin-input pr-8"
                          />
                          <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Fixed Charges (Rs.)</p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Registration Fee</label>
                        <input
                          type="number"
                          value={ruleForm.registration_fee}
                          onChange={(e) => setRuleForm({ ...ruleForm, registration_fee: e.target.value })}
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">HSRP Fee</label>
                        <input
                          type="number"
                          value={ruleForm.hsrp_fee}
                          onChange={(e) => setRuleForm({ ...ruleForm, hsrp_fee: e.target.value })}
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">FASTag Fee</label>
                        <input
                          type="number"
                          value={ruleForm.fastag_fee}
                          onChange={(e) => setRuleForm({ ...ruleForm, fastag_fee: e.target.value })}
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Other Charges</label>
                        <input
                          type="number"
                          value={ruleForm.other_charges}
                          onChange={(e) => setRuleForm({ ...ruleForm, other_charges: e.target.value })}
                          className="admin-input"
                        />
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Visibility Toggles</p>
                    <div className="flex flex-wrap gap-4 mb-4">
                      {[
                        { key: 'show_rto', label: 'RTO' },
                        { key: 'show_insurance', label: 'Insurance' },
                        { key: 'show_registration', label: 'Registration' },
                        { key: 'show_hsrp', label: 'HSRP' },
                        { key: 'show_fastag', label: 'FASTag' },
                        { key: 'show_other', label: 'Other' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ruleForm[key as keyof typeof ruleForm] as boolean}
                            onChange={(e) => setRuleForm({ ...ruleForm, [key]: e.target.checked })}
                            className="w-4 h-4 rounded accent-[#145a2c]"
                          />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button onClick={handleSaveRule} disabled={saving} className="admin-btn-primary flex items-center gap-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {editingRule ? 'Update' : 'Add Rule'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Rules List */}
                <div className="space-y-3">
                  {rules.map((rule) => {
                    const ruleSlabs = getRuleSlabs(rule.id);
                    const isExpanded = expandedRuleId === rule.id;

                    return (
                      <div key={rule.id} className="admin-card">
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                                rule.vehicle_category === 'electric_car' ? 'bg-blue-100 text-blue-600' :
                                rule.vehicle_category === 'electric_scooter' ? 'bg-purple-100 text-purple-600' :
                                'bg-orange-100 text-orange-600'
                              )}>
                                {rule.vehicle_category === 'electric_car' ? <Car size={16} /> :
                                 rule.vehicle_category === 'electric_scooter' ? <Circle size={16} /> :
                                 <Bike size={16} />}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{rule.city?.name}, {rule.city?.state?.code}</p>
                                <p className="text-xs text-gray-500">{CATEGORY_LABELS[rule.vehicle_category]}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">RTO: {rule.rto_percentage}%</p>
                              <p className="text-xs text-gray-500">Insurance: {rule.insurance_percentage}%</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRule(rule);
                                  setRuleForm({
                                    city_id: rule.city_id,
                                    vehicle_category: rule.vehicle_category,
                                    rto_percentage: rule.rto_percentage.toString(),
                                    insurance_percentage: rule.insurance_percentage.toString(),
                                    registration_fee: rule.registration_fee.toString(),
                                    hsrp_fee: rule.hsrp_fee.toString(),
                                    fastag_fee: rule.fastag_fee.toString(),
                                    other_charges: rule.other_charges.toString(),
                                    show_rto: rule.show_rto,
                                    show_insurance: rule.show_insurance,
                                    show_registration: rule.show_registration,
                                    show_hsrp: rule.show_hsrp,
                                    show_fastag: rule.show_fastag,
                                    show_other: rule.show_other,
                                  });
                                  setShowRuleForm(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-100 p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase">Tax Slabs ({ruleSlabs.length})</p>
                              <button
                                onClick={() => {
                                  setEditingSlab(null);
                                  setSlabForm({
                                    rule_id: rule.id,
                                    min_price: '0',
                                    max_price: '',
                                    tax_percentage: rule.rto_percentage.toString(),
                                    sort_order: (ruleSlabs.length + 1).toString(),
                                  });
                                  setShowSlabForm(true);
                                }}
                                className="text-xs flex items-center gap-1 text-[#145a2c] hover:underline"
                              >
                                <Plus size={12} />
                                Add Slab
                              </button>
                            </div>
                            {ruleSlabs.length > 0 ? (
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {ruleSlabs.map((slab) => (
                                  <div key={slab.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {formatPriceRange(slab.min_price, slab.max_price)}
                                      </p>
                                      <p className="text-xs text-gray-500">Tax: {slab.tax_percentage}%</p>
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingSlab(slab);
                                          setSlabForm({
                                            rule_id: slab.rule_id,
                                            min_price: slab.min_price.toString(),
                                            max_price: slab.max_price?.toString() || '',
                                            tax_percentage: slab.tax_percentage.toString(),
                                            sort_order: slab.sort_order.toString(),
                                          });
                                          setShowSlabForm(true);
                                        }}
                                        className="p-1 text-gray-400 hover:text-[#145a2c]"
                                      >
                                        <Pencil size={12} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSlab(slab.id)}
                                        className="p-1 text-gray-400 hover:text-red-600"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 italic">No slabs defined. Base RTO % will be used.</p>
                            )}

                            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
                              {[
                                { key: 'show_rto', label: 'RTO' },
                                { key: 'show_insurance', label: 'Insurance' },
                                { key: 'show_registration', label: 'Registration' },
                                { key: 'show_hsrp', label: 'HSRP' },
                                { key: 'show_fastag', label: 'FASTag' },
                                { key: 'show_other', label: 'Other' },
                              ].map(({ key, label }) => (
                                <div key={key} className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded',
                                  rule[key as keyof PricingRule] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                )}>
                                  {rule[key as keyof PricingRule] ? <Eye size={12} /> : <EyeOff size={12} />}
                                  {label}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ==================== SLABS TAB ==================== */}
            {activeTab === 'slabs' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowSlabForm(true);
                      setEditingSlab(null);
                      setSlabForm({ rule_id: rules[0]?.id || '', min_price: '0', max_price: '', tax_percentage: '8', sort_order: '1' });
                    }}
                    className="admin-btn-primary flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Add Slab
                  </button>
                </div>

                {showSlabForm && (
                  <div className="admin-card p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-900">{editingSlab ? 'Edit Slab' : 'Add New Slab'}</h3>
                      <button onClick={() => setShowSlabForm(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Rule / City</label>
                        <select
                          value={slabForm.rule_id}
                          onChange={(e) => setSlabForm({ ...slabForm, rule_id: e.target.value })}
                          className="admin-select"
                        >
                          <option value="">Select Rule</option>
                          {rules.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.city?.name} - {CATEGORY_LABELS[r.vehicle_category]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Min Price (Rs.)</label>
                        <input
                          type="number"
                          value={slabForm.min_price}
                          onChange={(e) => setSlabForm({ ...slabForm, min_price: e.target.value })}
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Max Price (Rs.)</label>
                        <input
                          type="number"
                          value={slabForm.max_price}
                          onChange={(e) => setSlabForm({ ...slabForm, max_price: e.target.value })}
                          placeholder="Leave empty for no limit"
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tax %</label>
                        <input
                          type="number"
                          step="0.1"
                          value={slabForm.tax_percentage}
                          onChange={(e) => setSlabForm({ ...slabForm, tax_percentage: e.target.value })}
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Sort Order</label>
                        <input
                          type="number"
                          value={slabForm.sort_order}
                          onChange={(e) => setSlabForm({ ...slabForm, sort_order: e.target.value })}
                          className="admin-input"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button onClick={handleSaveSlab} disabled={saving} className="admin-btn-primary flex items-center gap-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {editingSlab ? 'Update' : 'Add Slab'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="admin-card overflow-hidden">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>City / Category</th>
                        <th>Price Range</th>
                        <th>Tax %</th>
                        <th>Order</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slabs.map((slab) => {
                        const rule = rules.find(r => r.id === slab.rule_id);
                        return (
                          <tr key={slab.id}>
                            <td className="font-medium text-gray-900">
                              {rule ? `${rule.city?.name} - ${CATEGORY_LABELS[rule.vehicle_category]}` : '-'}
                            </td>
                            <td>{formatPriceRange(slab.min_price, slab.max_price)}</td>
                            <td>
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm font-medium">
                                {slab.tax_percentage}%
                              </span>
                            </td>
                            <td>{slab.sort_order}</td>
                            <td>
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => {
                                    setEditingSlab(slab);
                                    setSlabForm({
                                      rule_id: slab.rule_id,
                                      min_price: slab.min_price.toString(),
                                      max_price: slab.max_price?.toString() || '',
                                      tax_percentage: slab.tax_percentage.toString(),
                                      sort_order: slab.sort_order.toString(),
                                    });
                                    setShowSlabForm(true);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSlab(slab.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== SUBSIDIES TAB ==================== */}
            {activeTab === 'subsidies' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowSubsidyForm(true);
                      setEditingSubsidy(null);
                      setSubsidyForm({
                        city_id: cities[0]?.id || '',
                        vehicle_category: 'electric_car',
                        subsidy_type: 'fixed',
                        value: '0',
                        description: ''
                      });
                    }}
                    className="admin-btn-primary flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Add Subsidy
                  </button>
                </div>

                {showSubsidyForm && (
                  <div className="admin-card p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-900">{editingSubsidy ? 'Edit Subsidy' : 'Add New Subsidy'}</h3>
                      <button onClick={() => setShowSubsidyForm(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">City *</label>
                        <select
                          value={subsidyForm.city_id}
                          onChange={(e) => setSubsidyForm({ ...subsidyForm, city_id: e.target.value })}
                          className="admin-select"
                          disabled={!!editingSubsidy}
                        >
                          <option value="">Select City</option>
                          {cities.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}, {c.state?.code}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Category *</label>
                        <select
                          value={subsidyForm.vehicle_category}
                          onChange={(e) => setSubsidyForm({ ...subsidyForm, vehicle_category: e.target.value as VehiclePricingCategory })}
                          className="admin-select"
                          disabled={!!editingSubsidy}
                        >
                          {VEHICLE_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                        <select
                          value={subsidyForm.subsidy_type}
                          onChange={(e) => setSubsidyForm({ ...subsidyForm, subsidy_type: e.target.value as 'fixed' | 'percentage' })}
                          className="admin-select"
                        >
                          <option value="fixed">Fixed Amount (Rs.)</option>
                          <option value="percentage">Percentage (%)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          {subsidyForm.subsidy_type === 'fixed' ? 'Amount (Rs.)' : 'Percentage (%)'}
                        </label>
                        <input
                          type="number"
                          step={subsidyForm.subsidy_type === 'percentage' ? '0.1' : '1'}
                          value={subsidyForm.value}
                          onChange={(e) => setSubsidyForm({ ...subsidyForm, value: e.target.value })}
                          className="admin-input"
                        />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                        <input
                          type="text"
                          value={subsidyForm.description}
                          onChange={(e) => setSubsidyForm({ ...subsidyForm, description: e.target.value })}
                          placeholder="e.g., FAME II Subsidy"
                          className="admin-input"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button onClick={handleSaveSubsidy} disabled={saving} className="admin-btn-primary flex items-center gap-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {editingSubsidy ? 'Update' : 'Add Subsidy'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="admin-card overflow-hidden">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>City</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Description</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subsidies.map((sub) => (
                        <tr key={sub.id}>
                          <td className="font-medium text-gray-900">{sub.city?.name || '-'}</td>
                          <td>{CATEGORY_LABELS[sub.vehicle_category]}</td>
                          <td>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full',
                              sub.subsidy_type === 'fixed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            )}>
                              {sub.subsidy_type === 'fixed' ? 'Fixed' : 'Percentage'}
                            </span>
                          </td>
                          <td className="font-semibold">
                            {sub.subsidy_type === 'fixed'
                              ? formatCurrency(sub.value)
                              : `${sub.value}%`}
                          </td>
                          <td className="text-sm text-gray-600">{sub.description || '-'}</td>
                          <td>
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => {
                                  setEditingSubsidy(sub);
                                  setSubsidyForm({
                                    city_id: sub.city_id,
                                    vehicle_category: sub.vehicle_category,
                                    subsidy_type: sub.subsidy_type,
                                    value: sub.value.toString(),
                                    description: sub.description || '',
                                  });
                                  setShowSubsidyForm(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteSubsidy(sub.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
