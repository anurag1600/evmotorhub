'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { PricingState, PricingCity, VehiclePricingCategory } from '@/lib/types';
import { usePricingProfiles } from '@/hooks/usePricingProfiles';
import PricingProfileDrawer from '@/components/admin/PricingProfileDrawer';
import VersionHistoryModal from '@/components/admin/VersionHistoryModal';
import { MapPin, Plus, Pencil, Trash2, Loader as Loader2, X, Star, Eye, EyeOff, Percent, IndianRupee, Gift, Car, Bike, CircleDot, ChevronDown, ChevronUp, Settings, History, Copy, Archive, CircleCheck as CheckCircle, Clock, Filter, Search, Download, Upload, MoveVertical as MoreVertical, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CityWithState extends PricingCity {
  state?: PricingState;
}

const VEHICLE_CATEGORIES: { value: VehiclePricingCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'electric_car', label: 'Electric Car', icon: <Car size={14} /> },
  { value: 'electric_scooter', label: 'Electric Scooter', icon: <CircleDot size={14} /> },
  { value: 'electric_bike', label: 'Electric Bike', icon: <Bike size={14} /> },
];

const CATEGORY_LABELS: Record<VehiclePricingCategory, string> = {
  electric_car: 'Electric Car',
  electric_scooter: 'Electric Scooter',
  electric_bike: 'Electric Bike',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  published: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle size={12} /> },
  draft: { bg: 'bg-amber-50', text: 'text-amber-700', icon: <Clock size={12} /> },
  archived: { bg: 'bg-slate-100', text: 'text-slate-600', icon: <Archive size={12} /> },
};

export default function PricingManagementPage() {
  const [states, setStates] = useState<PricingState[]>([]);
  const [cities, setCities] = useState<CityWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'cities' | 'profiles'>('cities');

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [profileSearchQuery, setProfileSearchQuery] = useState('');

  // City form states
  const [editingCity, setEditingCity] = useState<CityWithState | null>(null);
  const [showCityForm, setShowCityForm] = useState(false);
  const [cityForm, setCityForm] = useState({
    state_name: '',
    state_code: '',
    name: '',
    pincode: '',
    is_popular: false,
    is_active: true,
  });

  // Pricing profiles
  const {
    profiles,
    loading: profilesLoading,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    duplicateProfile,
    publishProfile,
    archiveProfile,
    restoreVersion,
  } = usePricingProfiles();

  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [profileMode, setProfileMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  // Version history
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionProfileId, setVersionProfileId] = useState<string | null>(null);
  const [versionProfileName, setVersionProfileName] = useState('');

  // Filters
  const [profileFilter, setProfileFilter] = useState<{
    status?: 'draft' | 'published' | 'archived';
    city_id?: string;
    vehicle_category?: VehiclePricingCategory;
  }>({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchProfiles(profileFilter);
  }, [profileFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statesRes, citiesRes] = await Promise.all([
        supabase.from('pricing_states').select('*').order('name'),
        supabase.from('pricing_cities').select('*, state:pricing_states(*)').order('is_popular', { ascending: false }).order('name'),
      ]);
      setStates((statesRes.data || []) as PricingState[]);
      setCities((citiesRes.data || []) as CityWithState[]);
    } catch (err) {
      toast.error('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  // Filtered cities based on search
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cities;
    const query = searchQuery.toLowerCase();
    return cities.filter(city =>
      city.name.toLowerCase().includes(query) ||
      city.state?.name.toLowerCase().includes(query) ||
      city.pincode?.toLowerCase().includes(query)
    );
  }, [cities, searchQuery]);

  // Filtered profiles based on search
  const filteredProfiles = useMemo(() => {
    if (!profileSearchQuery.trim()) return profiles;
    const query = profileSearchQuery.toLowerCase();
    return profiles.filter(profile =>
      profile.name.toLowerCase().includes(query) ||
      profile.city?.name.toLowerCase().includes(query)
    );
  }, [profiles, profileSearchQuery]);

  // City CRUD with inline state creation
  const handleSaveCity = async () => {
    if (!cityForm.state_name.trim() || !cityForm.name.trim()) {
      toast.error('State and city name are required');
      return;
    }

    setSaving(true);
    try {
      let stateId = editingCity?.state_id;

      // Find or create state
      const existingState = states.find(s => s.name.toLowerCase() === cityForm.state_name.trim().toLowerCase());
      if (existingState) {
        stateId = existingState.id;
      } else {
        // Create new state
        const stateCode = cityForm.state_code.trim().toUpperCase() || cityForm.state_name.trim().substring(0, 2).toUpperCase();
        const { data: newState, error: stateError } = await supabase
          .from('pricing_states')
          .insert([{
            name: cityForm.state_name.trim(),
            code: stateCode,
            rto_percentage: 8,
            road_tax_percentage: 8,
            other_charges: 0,
            subsidy_amount: 0,
            is_active: true,
          }])
          .select()
          .single();

        if (stateError) throw stateError;
        stateId = newState.id;
        setStates(prev => [...prev, newState as PricingState]);
      }

      const payload = {
        state_id: stateId,
        name: cityForm.name.trim(),
        pincode: cityForm.pincode.trim() || null,
        is_popular: cityForm.is_popular,
        is_active: cityForm.is_active,
        rto_charge: 0,
        insurance_charge: 0,
        other_charges: 0,
        state_code: cityForm.state_code.trim().toUpperCase() || null,
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
      setCityForm({ state_name: '', state_code: '', name: '', pincode: '', is_popular: false, is_active: true });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save city');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCity = async (id: string) => {
    if (!confirm('Delete this city? All associated pricing profiles will also be deleted.')) return;
    try {
      await supabase.from('pricing_cities').delete().eq('id', id);
      toast.success('City deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete city');
    }
  };

  // Profile CRUD
  const handleOpenProfileDrawer = (mode: 'create' | 'edit' | 'duplicate', profile?: any) => {
    setProfileMode(mode);
    setEditingProfile(profile || null);
    setShowProfileDrawer(true);
  };

  const handleSaveProfile = async (data: any) => {
    if (profileMode === 'create' || profileMode === 'duplicate') {
      const newProfile = await createProfile(data);
      if (newProfile) {
        for (const slab of data.slabs || []) {
          await supabase.from('pricing_profile_slabs').insert([{
            profile_id: newProfile.id,
            ...slab,
          }]);
        }
        toast.success('Profile created successfully');
      }
    } else if (profileMode === 'edit' && editingProfile) {
      await updateProfile(editingProfile.id, data);
      if (editingProfile.slabs) {
        for (const existingSlab of editingProfile.slabs) {
          await supabase.from('pricing_profile_slabs').delete().eq('id', existingSlab.id);
        }
      }
      for (const slab of data.slabs || []) {
        await supabase.from('pricing_profile_slabs').insert([{
          profile_id: editingProfile.id,
          ...slab,
        }]);
      }
      toast.success('Profile updated successfully');
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Delete this pricing profile?')) return;
    try {
      await deleteProfile(id);
      toast.success('Profile deleted');
    } catch (err) {
      toast.error('Failed to delete profile');
    }
  };

  const handleDuplicateProfile = async (profile: any) => {
    try {
      const newProfile = await duplicateProfile(profile);
      if (newProfile) toast.success('Profile duplicated');
    } catch (err) {
      toast.error('Failed to duplicate profile');
    }
  };

  const handlePublishProfile = async (id: string) => {
    try {
      await publishProfile(id);
      toast.success('Profile published');
    } catch (err) {
      toast.error('Failed to publish profile');
    }
  };

  const handleArchiveProfile = async (id: string) => {
    try {
      await archiveProfile(id);
      toast.success('Profile archived');
    } catch (err) {
      toast.error('Failed to archive profile');
    }
  };

  const handleOpenVersionHistory = (profileId: string, profileName: string) => {
    setVersionProfileId(profileId);
    setVersionProfileName(profileName);
    setShowVersionModal(true);
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!versionProfileId) return;
    await restoreVersion(versionProfileId, versionNumber);
  };

  const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

  const isSubsidyActive = (profile: any): boolean => {
    if (!profile.has_subsidy) return false;
    const today = new Date().toISOString().split('T')[0];
    if (profile.subsidy_start_date && today < profile.subsidy_start_date) return false;
    if (profile.subsidy_end_date && today > profile.subsidy_end_date) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Pricing Engine</h1>
              <p className="text-sm text-slate-500">Configure dynamic pricing profiles for on-road price calculation</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'cities', label: 'Cities', count: cities.length, icon: <MapPin size={16} /> },
            { key: 'profiles', label: 'Pricing Profiles', count: profiles.length, icon: <Percent size={16} /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
              )}
            >
              {tab.icon}
              {tab.label}
              <span className={cn(
                'px-2 py-0.5 rounded-lg text-xs font-semibold',
                activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="relative">
              <Loader2 size={40} className="animate-spin text-emerald-600" />
              <div className="absolute inset-0 animate-ping">
                <Loader2 size={40} className="text-emerald-200" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Cities Tab */}
            {activeTab === 'cities' && (
              <div className="space-y-6">
                {/* Search & Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search cities, states, pincodes..."
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowCityForm(true);
                      setEditingCity(null);
                      setCityForm({ state_name: '', state_code: '', name: '', pincode: '', is_popular: false, is_active: true });
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all text-sm"
                  >
                    <Plus size={16} />
                    Add City
                  </button>
                </div>

                {/* City Form */}
                {showCityForm && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-900">{editingCity ? 'Edit City' : 'Add New City'}</h3>
                      <button onClick={() => setShowCityForm(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={18} className="text-slate-400" />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">State *</label>
                        <input
                          type="text"
                          value={cityForm.state_name}
                          onChange={(e) => {
                            const name = e.target.value;
                            setCityForm(prev => ({
                              ...prev,
                              state_name: name,
                              state_code: name.substring(0, 2).toUpperCase()
                            }));
                          }}
                          placeholder="e.g., Maharashtra"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                          list="states-list"
                        />
                        <datalist id="states-list">
                          {states.map(s => <option key={s.id} value={s.name} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">State Code</label>
                        <input
                          type="text"
                          value={cityForm.state_code}
                          onChange={(e) => setCityForm(prev => ({ ...prev, state_code: e.target.value }))}
                          placeholder="e.g., MH"
                          maxLength={2}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">City Name *</label>
                        <input
                          type="text"
                          value={cityForm.name}
                          onChange={(e) => setCityForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Mumbai"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pincode <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input
                          type="text"
                          value={cityForm.pincode}
                          onChange={(e) => setCityForm(prev => ({ ...prev, pincode: e.target.value }))}
                          placeholder="e.g., 400001"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                        />
                      </div>
                      <div className="flex items-end gap-3 pb-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cityForm.is_popular}
                            onChange={(e) => setCityForm(prev => ({ ...prev, is_popular: e.target.checked }))}
                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-slate-700">Popular</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cityForm.is_active}
                            onChange={(e) => setCityForm(prev => ({ ...prev, is_active: e.target.checked }))}
                            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-slate-700">Active</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                      <button
                        onClick={handleSaveCity}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl disabled:opacity-50 transition-all text-sm"
                      >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        {editingCity ? 'Update City' : 'Add City'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Cities Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">City</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">State</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pincode</th>
                          <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCities.map((city, idx) => (
                          <tr key={city.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <MapPin size={16} className="text-emerald-600" />
                                </div>
                                <span className="font-medium text-slate-900">{city.name}</span>
                                {city.is_popular && (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                    <Star size={10} className="fill-amber-500" />
                                    Popular
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{city.state?.name || '-'}</td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg text-slate-600">
                                {city.pincode || '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={cn(
                                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
                                city.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              )}>
                                {city.is_active ? <CheckCircle size={12} /> : <X size={12} />}
                                {city.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingCity(city);
                                    setCityForm({
                                      state_name: city.state?.name || '',
                                      state_code: city.state?.code || '',
                                      name: city.name,
                                      pincode: city.pincode || '',
                                      is_popular: city.is_popular || false,
                                      is_active: city.is_active !== false,
                                    });
                                    setShowCityForm(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCity(city.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  {filteredCities.length === 0 && (
                    <div className="text-center py-16">
                      <MapPin size={48} className="mx-auto mb-4 text-slate-200" />
                      <p className="text-slate-500 font-medium">No cities found</p>
                      <p className="text-sm text-slate-400 mt-1">Add your first city to get started</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pricing Profiles Tab */}
            {activeTab === 'profiles' && (
              <div className="space-y-6">
                {/* Filters & Actions */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={profileSearchQuery}
                        onChange={(e) => setProfileSearchQuery(e.target.value)}
                        placeholder="Search profiles..."
                        className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm w-64"
                      />
                    </div>
                    <select
                      value={profileFilter.status || ''}
                      onChange={(e) => setProfileFilter(prev => ({ ...prev, status: e.target.value as any || undefined }))}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-slate-600"
                    >
                      <option value="">All Status</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                    <select
                      value={profileFilter.city_id || ''}
                      onChange={(e) => setProfileFilter(prev => ({ ...prev, city_id: e.target.value || undefined }))}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-slate-600"
                    >
                      <option value="">All Cities</option>
                      {cities.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <select
                      value={profileFilter.vehicle_category || ''}
                      onChange={(e) => setProfileFilter(prev => ({ ...prev, vehicle_category: e.target.value as any || undefined }))}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm text-slate-600"
                    >
                      <option value="">All Categories</option>
                      {VEHICLE_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleOpenProfileDrawer('create')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all text-sm"
                  >
                    <Plus size={16} />
                    Create Profile
                  </button>
                </div>

                {/* Profiles List */}
                {profilesLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 size={40} className="animate-spin text-emerald-600" />
                  </div>
                ) : filteredProfiles.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <Percent size={28} className="text-emerald-600" />
                    </div>
                    <p className="text-slate-700 font-medium">No pricing profiles found</p>
                    <p className="text-sm text-slate-400 mt-1 mb-6">Create your first pricing profile to get started</p>
                    <button
                      onClick={() => handleOpenProfileDrawer('create')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all"
                    >
                      <Plus size={16} />
                      Create Profile
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredProfiles.map((profile) => {
                      const isExpanded = expandedProfileId === profile.id;
                      const statusStyle = STATUS_STYLES[profile.status] || STATUS_STYLES.draft;
                      const subsidyActive = isSubsidyActive(profile);

                      return (
                        <div
                          key={profile.id}
                          className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-200 overflow-hidden group"
                        >
                          {/* Profile Header */}
                          <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                'w-12 h-12 rounded-xl flex items-center justify-center',
                                profile.vehicle_category === 'electric_car' ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600' :
                                profile.vehicle_category === 'electric_scooter' ? 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600' :
                                'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600'
                              )}>
                                {profile.vehicle_category === 'electric_car' ? <Car size={20} /> :
                                 profile.vehicle_category === 'electric_scooter' ? <CircleDot size={20} /> :
                                 <Bike size={20} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2.5 mb-1">
                                  <h3 className="font-semibold text-slate-900">{profile.name}</h3>
                                  <span className={cn(
                                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                                    statusStyle.bg, statusStyle.text
                                  )}>
                                    {statusStyle.icon}
                                    {profile.status}
                                  </span>
                                  {subsidyActive && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                      <Gift size={10} />
                                      Subsidy Active
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                  <span className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-slate-400" />
                                    {profile.city?.name}, {profile.city?.state?.name || 'Unknown'}
                                  </span>
                                  <span className="text-slate-300">|</span>
                                  <span>{CATEGORY_LABELS[profile.vehicle_category]}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-slate-900">RTO: {profile.rto_percentage}%</p>
                                <p className="text-xs text-slate-500">Insurance: {profile.insurance_percentage}%</p>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setExpandedProfileId(isExpanded ? null : profile.id)}
                                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  title={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                                <button
                                  onClick={() => handleOpenVersionHistory(profile.id, profile.name)}
                                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Version history"
                                >
                                  <History size={16} />
                                </button>
                                <button
                                  onClick={() => handleDuplicateProfile(profile)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Duplicate"
                                >
                                  <Copy size={16} />
                                </button>
                                <button
                                  onClick={() => handleOpenProfileDrawer('edit', profile)}
                                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Pencil size={16} />
                                </button>
                                {profile.status === 'draft' && (
                                  <button
                                    onClick={() => handlePublishProfile(profile.id)}
                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Publish"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                )}
                                {profile.status === 'published' && (
                                  <button
                                    onClick={() => handleArchiveProfile(profile.id)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Archive"
                                  >
                                    <Archive size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteProfile(profile.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/50 p-5 animate-in slide-in-from-top-2 duration-200">
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Charges */}
                                <div>
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Charges</h4>
                                  <div className="space-y-2">
                                    {profile.show_rto && (
                                      <div className="flex justify-between text-sm bg-white p-2.5 rounded-lg">
                                        <span className="text-slate-600">Road Tax</span>
                                        <span className="font-semibold text-slate-900">{profile.rto_percentage}%</span>
                                      </div>
                                    )}
                                    {profile.show_insurance && (
                                      <div className="flex justify-between text-sm bg-white p-2.5 rounded-lg">
                                        <span className="text-slate-600">Insurance</span>
                                        <span className="font-semibold text-slate-900">{profile.insurance_percentage}%</span>
                                      </div>
                                    )}
                                    {profile.show_registration && (
                                      <div className="flex justify-between text-sm bg-white p-2.5 rounded-lg">
                                        <span className="text-slate-600">Registration</span>
                                        <span className="font-semibold text-slate-900">{formatCurrency(profile.registration_fee)}</span>
                                      </div>
                                    )}
                                    {profile.show_hsrp && (
                                      <div className="flex justify-between text-sm bg-white p-2.5 rounded-lg">
                                        <span className="text-slate-600">HSRP</span>
                                        <span className="font-semibold text-slate-900">{formatCurrency(profile.hsrp_fee)}</span>
                                      </div>
                                    )}
                                    {profile.show_fastag && (
                                      <div className="flex justify-between text-sm bg-white p-2.5 rounded-lg">
                                        <span className="text-slate-600">FASTag</span>
                                        <span className="font-semibold text-slate-900">{formatCurrency(profile.fastag_fee)}</span>
                                      </div>
                                    )}
                                    {profile.show_handling && (
                                      <div className="flex justify-between text-sm bg-white p-2.5 rounded-lg">
                                        <span className="text-slate-600">Handling</span>
                                        <span className="font-semibold text-slate-900">{formatCurrency(profile.handling_charges)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Subsidy */}
                                <div>
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Subsidy</h4>
                                  {profile.has_subsidy ? (
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                                      {profile.subsidy_title && (
                                        <p className="font-medium text-slate-900 mb-2">{profile.subsidy_title}</p>
                                      )}
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className={cn(
                                          'text-lg font-bold',
                                          subsidyActive ? 'text-emerald-600' : 'text-slate-400'
                                        )}>
                                          {profile.subsidy_type === 'percentage'
                                            ? `${profile.subsidy_value}% off`
                                            : `${formatCurrency(profile.subsidy_value)} off`}
                                        </span>
                                        {!subsidyActive && (
                                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">(Expired)</span>
                                        )}
                                      </div>
                                      {profile.subsidy_badge_text && subsidyActive && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-full font-medium animate-pulse">
                                          <Gift size={10} />
                                          {profile.subsidy_badge_text}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-slate-400 italic bg-white p-4 rounded-xl text-center">
                                      No subsidy configured
                                    </div>
                                  )}
                                </div>

                                {/* Tax Slabs */}
                                <div>
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tax Slabs ({profile.slabs?.length || 0})</h4>
                                  {profile.slabs && profile.slabs.length > 0 ? (
                                    <div className="space-y-2">
                                      {profile.slabs.map((slab, i) => (
                                        <div key={i} className="flex justify-between bg-white p-2.5 rounded-lg text-sm">
                                          <span className="text-slate-600">
                                            Rs. {(slab.min_price / 100000).toFixed(1)}L{slab.max_price ? ` - Rs. ${(slab.max_price / 100000).toFixed(1)}L` : '+'}
                                          </span>
                                          <span className="font-semibold text-slate-900">{slab.tax_percentage}%</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-slate-400 italic bg-white p-4 rounded-xl text-center">
                                      No tax slabs. Base RTO % used.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Profile Drawer */}
        <PricingProfileDrawer
          isOpen={showProfileDrawer}
          onClose={() => {
            setShowProfileDrawer(false);
            setEditingProfile(null);
          }}
          onSave={handleSaveProfile}
          profile={editingProfile}
          cities={cities}
          mode={profileMode}
        />

        {/* Version History Modal */}
        <VersionHistoryModal
          isOpen={showVersionModal}
          onClose={() => {
            setShowVersionModal(false);
            setVersionProfileId(null);
          }}
          profileId={versionProfileId}
          profileName={versionProfileName}
          onRestore={handleRestoreVersion}
        />
      </div>
    </div>
  );
}
