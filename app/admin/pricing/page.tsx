'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PricingState, PricingCity } from '@/lib/types';
import { MapPin, Plus, Pencil, Trash2, Save, Loader as Loader2, ChevronDown, Building, X, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CityWithState extends PricingCity {
  state?: PricingState;
}

export default function PricingManagementPage() {
  const [states, setStates] = useState<PricingState[]>([]);
  const [cities, setCities] = useState<CityWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'states' | 'cities'>('states');

  // Form states
  const [editingState, setEditingState] = useState<PricingState | null>(null);
  const [editingCity, setEditingCity] = useState<CityWithState | null>(null);
  const [showStateForm, setShowStateForm] = useState(false);
  const [showCityForm, setShowCityForm] = useState(false);

  const [stateForm, setStateForm] = useState({
    name: '',
    code: '',
    rto_percentage: '8',
    road_tax_percentage: '0',
    other_charges: '1000',
  });

  const [cityForm, setCityForm] = useState({
    state_id: '',
    name: '',
    pincode: '',
    rto_charge: '50000',
    insurance_charge: '15000',
    other_charges: '2000',
    is_popular: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statesRes, citiesRes] = await Promise.all([
        supabase.from('pricing_states').select('*').order('name'),
        supabase.from('pricing_cities').select('*, state:pricing_states(*)').order('name'),
      ]);
      setStates((statesRes.data || []) as PricingState[]);
      setCities((citiesRes.data || []) as CityWithState[]);
    } catch (err) {
      toast.error('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveState = async () => {
    if (!stateForm.name || !stateForm.code) {
      toast.error('State name and code are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: stateForm.name,
        code: stateForm.code.toUpperCase(),
        rto_percentage: parseFloat(stateForm.rto_percentage) || 0,
        road_tax_percentage: parseFloat(stateForm.road_tax_percentage) || 0,
        other_charges: parseInt(stateForm.other_charges) || 0,
      };

      if (editingState) {
        const { error } = await supabase
          .from('pricing_states')
          .update(payload)
          .eq('id', editingState.id);
        if (error) throw error;
        toast.success('State updated');
      } else {
        const { error } = await supabase.from('pricing_states').insert([payload]);
        if (error) throw error;
        toast.success('State added');
      }

      setShowStateForm(false);
      setEditingState(null);
      setStateForm({ name: '', code: '', rto_percentage: '8', road_tax_percentage: '0', other_charges: '1000' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save state');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCity = async () => {
    if (!cityForm.state_id || !cityForm.name) {
      toast.error('State and city name are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        state_id: cityForm.state_id,
        name: cityForm.name,
        pincode: cityForm.pincode || null,
        rto_charge: parseInt(cityForm.rto_charge) || 0,
        insurance_charge: parseInt(cityForm.insurance_charge) || 0,
        other_charges: parseInt(cityForm.other_charges) || 0,
        is_popular: cityForm.is_popular,
      };

      if (editingCity) {
        const { error } = await supabase
          .from('pricing_cities')
          .update(payload)
          .eq('id', editingCity.id);
        if (error) throw error;
        toast.success('City updated');
      } else {
        const { error } = await supabase.from('pricing_cities').insert([payload]);
        if (error) throw error;
        toast.success('City added');
      }

      setShowCityForm(false);
      setEditingCity(null);
      setCityForm({ state_id: '', name: '', pincode: '', rto_charge: '50000', insurance_charge: '15000', other_charges: '2000', is_popular: false });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save city');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteState = async (id: string) => {
    if (!confirm('Delete this state? All cities in this state will also be deleted.')) return;
    try {
      await supabase.from('pricing_states').delete().eq('id', id);
      toast.success('State deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete state');
    }
  };

  const handleDeleteCity = async (id: string) => {
    if (!confirm('Delete this city?')) return;
    try {
      await supabase.from('pricing_cities').delete().eq('id', id);
      toast.success('City deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete city');
    }
  };

  const startEditState = (state: PricingState) => {
    setEditingState(state);
    setStateForm({
      name: state.name,
      code: state.code,
      rto_percentage: state.rto_percentage.toString(),
      road_tax_percentage: state.road_tax_percentage.toString(),
      other_charges: state.other_charges.toString(),
    });
    setShowStateForm(true);
  };

  const startEditCity = (city: CityWithState) => {
    setEditingCity(city);
    setCityForm({
      state_id: city.state_id,
      name: city.name,
      pincode: city.pincode || '',
      rto_charge: city.rto_charge.toString(),
      insurance_charge: city.insurance_charge.toString(),
      other_charges: city.other_charges.toString(),
      is_popular: city.is_popular || false,
    });
    setShowCityForm(true);
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <MapPin size={28} className="text-[#145a2c]" />
              Pricing Management
            </h1>
            <p className="admin-subtitle">Manage state-wise and city-wise pricing for on-road price calculation</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('states')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'states'
                ? 'bg-[#145a2c] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            States ({states.length})
          </button>
          <button
            onClick={() => setActiveTab('cities')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'cities'
                ? 'bg-[#145a2c] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            Cities ({cities.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* States Tab */}
            {activeTab === 'states' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowStateForm(true);
                      setEditingState(null);
                      setStateForm({ name: '', code: '', rto_percentage: '8', road_tax_percentage: '0', other_charges: '1000' });
                    }}
                    className="admin-btn-primary flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Add State
                  </button>
                </div>

                {showStateForm && (
                  <div className="admin-card p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">{editingState ? 'Edit State' : 'Add New State'}</h3>
                      <button onClick={() => setShowStateForm(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <input
                        type="text"
                        value={stateForm.name}
                        onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                        placeholder="State name"
                        className="admin-input"
                      />
                      <input
                        type="text"
                        value={stateForm.code}
                        onChange={(e) => setStateForm({ ...stateForm, code: e.target.value.toUpperCase() })}
                        placeholder="Code (e.g., DL)"
                        maxLength={2}
                        className="admin-input"
                      />
                      <input
                        type="number"
                        value={stateForm.rto_percentage}
                        onChange={(e) => setStateForm({ ...stateForm, rto_percentage: e.target.value })}
                        placeholder="RTO %"
                        className="admin-input"
                      />
                      <input
                        type="number"
                        value={stateForm.road_tax_percentage}
                        onChange={(e) => setStateForm({ ...stateForm, road_tax_percentage: e.target.value })}
                        placeholder="Road Tax %"
                        className="admin-input"
                      />
                      <input
                        type="number"
                        value={stateForm.other_charges}
                        onChange={(e) => setStateForm({ ...stateForm, other_charges: e.target.value })}
                        placeholder="Other Charges (₹)"
                        className="admin-input"
                      />
                    </div>
                    <div className="flex justify-end mt-4">
                      <button onClick={handleSaveState} disabled={saving} className="admin-btn-primary">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {editingState ? 'Update' : 'Add State'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="admin-card overflow-hidden">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>State</th>
                        <th>Code</th>
                        <th>RTO %</th>
                        <th>Road Tax %</th>
                        <th>Other</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {states.map((state) => (
                        <tr key={state.id}>
                          <td className="font-medium">{state.name}</td>
                          <td>
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{state.code}</span>
                          </td>
                          <td>{state.rto_percentage}%</td>
                          <td>{state.road_tax_percentage}%</td>
                          <td>{formatCurrency(state.other_charges)}</td>
                          <td>
                            <div className="flex gap-1">
                              <button onClick={() => startEditState(state)} className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => handleDeleteState(state.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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

            {/* Cities Tab */}
            {activeTab === 'cities' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowCityForm(true);
                      setEditingCity(null);
                      setCityForm({ state_id: states[0]?.id || '', name: '', pincode: '', rto_charge: '50000', insurance_charge: '15000', other_charges: '2000', is_popular: false });
                    }}
                    className="admin-btn-primary flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Add City
                  </button>
                </div>

                {showCityForm && (
                  <div className="admin-card p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">{editingCity ? 'Edit City' : 'Add New City'}</h3>
                      <button onClick={() => setShowCityForm(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <select
                        value={cityForm.state_id}
                        onChange={(e) => setCityForm({ ...cityForm, state_id: e.target.value })}
                        className="admin-select"
                      >
                        <option value="">Select State</option>
                        {states.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={cityForm.name}
                        onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                        placeholder="City name"
                        className="admin-input"
                      />
                      <input
                        type="text"
                        value={cityForm.pincode}
                        onChange={(e) => setCityForm({ ...cityForm, pincode: e.target.value })}
                        placeholder="Pincode (e.g., 110001)"
                        className="admin-input"
                      />
                      <input
                        type="number"
                        value={cityForm.rto_charge}
                        onChange={(e) => setCityForm({ ...cityForm, rto_charge: e.target.value })}
                        placeholder="RTO Charge (₹)"
                        className="admin-input"
                      />
                      <input
                        type="number"
                        value={cityForm.insurance_charge}
                        onChange={(e) => setCityForm({ ...cityForm, insurance_charge: e.target.value })}
                        placeholder="Insurance (₹)"
                        className="admin-input"
                      />
                      <input
                        type="number"
                        value={cityForm.other_charges}
                        onChange={(e) => setCityForm({ ...cityForm, other_charges: e.target.value })}
                        placeholder="Other Charges (₹)"
                        className="admin-input"
                      />
                      <label className="flex items-center gap-2 col-span-2 sm:col-span-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cityForm.is_popular}
                          onChange={(e) => setCityForm({ ...cityForm, is_popular: e.target.checked })}
                          className="w-4 h-4 rounded accent-[#145a2c]"
                        />
                        <span className="text-sm text-gray-700">Popular City (shown first)</span>
                      </label>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button onClick={handleSaveCity} disabled={saving} className="admin-btn-primary">
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
                        <th>RTO Charge</th>
                        <th>Insurance</th>
                        <th>Other</th>
                        <th>Popular</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cities.map((city) => (
                        <tr key={city.id}>
                          <td className="font-medium">{city.name}</td>
                          <td><span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{city.pincode || '-'}</span></td>
                          <td>{city.state?.name || '-'}</td>
                          <td>{formatCurrency(city.rto_charge)}</td>
                          <td>{formatCurrency(city.insurance_charge)}</td>
                          <td>{formatCurrency(city.other_charges)}</td>
                          <td>
                            {city.is_popular && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                                <Star size={10} />
                                Popular
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="flex gap-1">
                              <button onClick={() => startEditCity(city)} className="p-1.5 text-gray-400 hover:text-[#145a2c] hover:bg-green-50 rounded-lg">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => handleDeleteCity(city.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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
