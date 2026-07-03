'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PricingState, PricingCity, VehiclePricingCategory } from '@/lib/types';
import { usePricingProfiles } from '@/hooks/usePricingProfiles';
import { ProfileFormData } from '@/components/admin/PricingProfileDrawer';
import PricingProfileDrawer from '@/components/admin/PricingProfileDrawer';
import VersionHistoryModal from '@/components/admin/VersionHistoryModal';
import { MapPin, Plus, Pencil, Trash2, Save, Loader as Loader2, X, Star, Eye, EyeOff, Percent, IndianRupee, Gift, Car, Bike, CircleDot as Circle, ChevronDown, ChevronUp, Settings, History, Copy, Archive, FileText, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CityWithState extends PricingCity {
  state?: PricingState;
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

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  published: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={12} /> },
  draft: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock size={12} /> },
  archived: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <Archive size={12} /> },
};

export default function PricingManagementPage() {
  const [states, setStates] = useState<PricingState[]>([]);
  const [cities, setCities] = useState<CityWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'cities' | 'profiles'>('cities');

  // City form states
  const [editingCity, setEditingCity] = useState<CityWithState | null>(null);
  const [showCityForm, setShowCityForm] = useState(false);
  const [cityForm, setCityForm] = useState({
    state_id: '',
    name: '',
    pincode: '',
    is_popular: false,
    is_active: true,
  });

  // Pricing profiles
  const {
    profiles,
    loading: profilesLoading,
    error: profilesError,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    duplicateProfile,
    publishProfile,
    archiveProfile,
    getVersions,
    restoreVersion,
    copyToCities,
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

  // City CRUD
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

  const handleSaveProfile = async (data: ProfileFormData) => {
    if (profileMode === 'create' || profileMode === 'duplicate') {
      const newProfile = await createProfile(data);
      if (newProfile) {
        // Create slabs
        for (const slab of data.slabs) {
          await supabase.from('pricing_profile_slabs').insert([{
            profile_id: newProfile.id,
            ...slab,
          }]);
        }
        toast.success('Profile created successfully');
      }
    } else if (profileMode === 'edit' && editingProfile) {
      await updateProfile(editingProfile.id, data);

      // Update slabs
      if (editingProfile.slabs) {
        for (const existingSlab of editingProfile.slabs) {
          await supabase.from('pricing_profile_slabs').delete().eq('id', existingSlab.id);
        }
      }
      for (const slab of data.slabs) {
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
      if (newProfile) {
        toast.success('Profile duplicated');
      }
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
  const formatPriceRange = (min: number, max: number | null) => {
    const format = (n: number) => {
      if (n >= 10000000) return `Rs. ${(n / 10000000).toFixed(1)}Cr`;
      if (n >= 100000) return `Rs. ${(n / 100000).toFixed(1)}L`;
      return `Rs. ${n.toLocaleString('en-IN')}`;
    };
    return max ? `${format(min)} - ${format(max)}` : `${format(min)}+`;
  };

  const isSubsidyActive = (profile: any): boolean => {
    if (!profile.has_subsidy) return false;
    const today = new Date().toISOString().split('T')[0];
    if (profile.subsidy_start_date && today < profile.subsidy_start_date) return false;
    if (profile.subsidy_end_date && today > profile.subsidy_end_date) return false;
    return true;
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Settings size={28} className="text-[#145a2c]" />
              Pricing Engine
            </h1>
            <p className="admin-subtitle">Configure dynamic pricing profiles for on-road price calculation</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'cities', label: 'Cities', count: cities.length, icon: <MapPin size={14} /> },
            { key: 'profiles', label: 'Pricing Profiles', count: profiles.length, icon: <Percent size={14} /> },
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
            {/* Cities Tab */}
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

            {/* Pricing Profiles Tab */}
            {activeTab === 'profiles' && (
              <div className="space-y-4">
                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Filter size={14} className="text-gray-400" />
                    <select
                      value={profileFilter.status || ''}
                      onChange={(e) => setProfileFilter(prev => ({ ...prev, status: e.target.value as any || undefined }))}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Status</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                    <select
                      value={profileFilter.city_id || ''}
                      onChange={(e) => setProfileFilter(prev => ({ ...prev, city_id: e.target.value || undefined }))}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Cities</option>
                      {cities.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <select
                      value={profileFilter.vehicle_category || ''}
                      onChange={(e) => setProfileFilter(prev => ({ ...prev, vehicle_category: e.target.value as any || undefined }))}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Categories</option>
                      {VEHICLE_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleOpenProfileDrawer('create')}
                    className="admin-btn-primary flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Create Profile
                  </button>
                </div>

                {profilesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-gray-400" />
                  </div>
                ) : profiles.length === 0 ? (
                  <div className="admin-card p-12 text-center">
                    <Percent size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-2">No pricing profiles found</p>
                    <p className="text-sm text-gray-400 mb-4">Create your first pricing profile to get started</p>
                    <button
                      onClick={() => handleOpenProfileDrawer('create')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#145a2c] text-white rounded-lg hover:bg-[#0d4221]"
                    >
                      <Plus size={14} />
                      Create Profile
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profiles.map((profile) => {
                      const isExpanded = expandedProfileId === profile.id;
                      const statusStyle = STATUS_STYLES[profile.status] || STATUS_STYLES.draft;
                      const subsidyActive = isSubsidyActive(profile);

                      return (
                        <div key={profile.id} className="admin-card">
                          {/* Profile Header */}
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
                                profile.vehicle_category === 'electric_car' ? 'bg-blue-100 text-blue-600' :
                                profile.vehicle_category === 'electric_scooter' ? 'bg-purple-100 text-purple-600' :
                                'bg-orange-100 text-orange-600'
                              )}>
                                {profile.vehicle_category === 'electric_car' ? <Car size={18} /> :
                                 profile.vehicle_category === 'electric_scooter' ? <Circle size={18} /> :
                                 <Bike size={18} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">{profile.name}</p>
                                  <span className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full', statusStyle.bg, statusStyle.text)}>
                                    {statusStyle.icon}
                                    {profile.status}
                                  </span>
                                  {subsidyActive && (
                                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                      <Gift size={10} />
                                      Subsidy
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {profile.city?.name}, {profile.city?.state?.name || 'Unknown'} &middot; {CATEGORY_LABELS[profile.vehicle_category]}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">RTO: {profile.rto_percentage}%</p>
                                <p className="text-xs text-gray-500">Insurance: {profile.insurance_percentage}%</p>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setExpandedProfileId(isExpanded ? null : profile.id)}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                  title="Toggle details"
                                >
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                <button
                                  onClick={() => handleOpenVersionHistory(profile.id, profile.name)}
                                  className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg"
                                  title="Version history"
                                >
                                  <History size={14} />
                                </button>
                                <button
                                  onClick={() => handleDuplicateProfile(profile)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Duplicate"
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  onClick={() => handleOpenProfileDrawer('edit', profile)}
                                  className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg"
                                  title="Edit"
                                >
                                  <Pencil size={14} />
                                </button>
                                {profile.status === 'draft' && (
                                  <button
                                    onClick={() => handlePublishProfile(profile.id)}
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                    title="Publish"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                                {profile.status === 'published' && (
                                  <button
                                    onClick={() => handleArchiveProfile(profile.id)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                    title="Archive"
                                  >
                                    <Archive size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteProfile(profile.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="border-t border-gray-100 p-4 bg-gray-50">
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Charges */}
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Charges</h4>
                                  <div className="space-y-1.5">
                                    {profile.show_rto && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Road Tax</span>
                                        <span className="font-medium">{profile.rto_percentage}%</span>
                                      </div>
                                    )}
                                    {profile.show_insurance && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Insurance</span>
                                        <span className="font-medium">{profile.insurance_percentage}%</span>
                                      </div>
                                    )}
                                    {profile.show_registration && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Registration</span>
                                        <span className="font-medium">{formatCurrency(profile.registration_fee)}</span>
                                      </div>
                                    )}
                                    {profile.show_hsrp && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">HSRP</span>
                                        <span className="font-medium">{formatCurrency(profile.hsrp_fee)}</span>
                                      </div>
                                    )}
                                    {profile.show_fastag && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">FASTag</span>
                                        <span className="font-medium">{formatCurrency(profile.fastag_fee)}</span>
                                      </div>
                                    )}
                                    {profile.show_handling && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Handling</span>
                                        <span className="font-medium">{formatCurrency(profile.handling_charges)}</span>
                                      </div>
                                    )}
                                    {profile.show_dealer && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Dealer</span>
                                        <span className="font-medium">{formatCurrency(profile.dealer_charges)}</span>
                                      </div>
                                    )}
                                    {profile.show_delivery && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Delivery</span>
                                        <span className="font-medium">{formatCurrency(profile.delivery_charges)}</span>
                                      </div>
                                    )}
                                    {profile.show_other && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Other</span>
                                        <span className="font-medium">{formatCurrency(profile.other_charges)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Subsidy */}
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Subsidy</h4>
                                  {profile.has_subsidy ? (
                                    <div className="space-y-1.5">
                                      {profile.subsidy_title && (
                                        <p className="text-sm font-medium text-gray-900">{profile.subsidy_title}</p>
                                      )}
                                      <div className="flex items-center gap-2">
                                        <span className={cn('text-sm font-semibold', subsidyActive ? 'text-green-600' : 'text-gray-400')}>
                                          {profile.subsidy_type === 'percentage'
                                            ? `${profile.subsidy_value}% off`
                                            : `${formatCurrency(profile.subsidy_value)} off`}
                                        </span>
                                        {!subsidyActive && (
                                          <span className="text-xs text-gray-400">(Expired)</span>
                                        )}
                                      </div>
                                      {profile.subsidy_badge_text && (
                                        <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                          {profile.subsidy_badge_text}
                                        </span>
                                      )}
                                      {profile.subsidy_end_date && (
                                        <p className="text-xs text-gray-500">Valid until: {profile.subsidy_end_date}</p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-400 italic">No subsidy configured</p>
                                  )}
                                </div>

                                {/* Tax Slabs */}
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Tax Slabs ({profile.slabs?.length || 0})</h4>
                                  {profile.slabs && profile.slabs.length > 0 ? (
                                    <div className="space-y-1.5">
                                      {profile.slabs.map((slab, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                          <span className="text-gray-600">{formatPriceRange(slab.min_price, slab.max_price)}</span>
                                          <span className="font-medium">{slab.tax_percentage}%</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-400 italic">No tax slabs. Base RTO % used.</p>
                                  )}
                                </div>
                              </div>

                              {/* Conditions Summary */}
                              {(profile.vehicle_type || profile.battery_min_kwh || profile.price_range_min || profile.priority > 0) && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Conditions</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {profile.vehicle_type && (
                                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                        Vehicle Type: {profile.vehicle_type}
                                      </span>
                                    )}
                                    {profile.battery_min_kwh && (
                                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                        Battery: {profile.battery_min_kwh}{profile.battery_max_kwh ? `-${profile.battery_max_kwh}` : '+'} kWh
                                      </span>
                                    )}
                                    {profile.price_range_min && (
                                      <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">
                                        Price: {formatCurrency(profile.price_range_min)}{profile.price_range_max ? ` - ${formatCurrency(profile.price_range_max)}` : '+'}
                                      </span>
                                    )}
                                    {profile.priority > 0 && (
                                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                        Priority: {profile.priority}
                                      </span>
                                    )}
                                    {profile.effective_date && (
                                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                        Effective: {profile.effective_date}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
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
