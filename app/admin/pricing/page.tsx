'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PricingState, PricingCity } from '@/lib/types';
import { MapPin, Plus, Pencil, Trash2, Save, Loader as Loader2, X, Star, Download, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { arrayToCSV, downloadCSV, parseCSV, generateTemplate } from '@/lib/import-export';

interface CityWithState extends PricingCity {
  state?: PricingState;
}

const STATE_EXPORT_COLS = ['id', 'name', 'code', 'rto_percentage', 'road_tax_percentage', 'other_charges', 'subsidy_amount', 'is_active'];
const STATE_IMPORT_COLS = ['name', 'code', 'rto_percentage', 'road_tax_percentage', 'other_charges', 'subsidy_amount', 'is_active'];

const CITY_EXPORT_COLS = ['id', 'name', 'pincode', 'state_code', 'rto_charge', 'insurance_charge', 'other_charges', 'is_popular', 'is_active'];
const CITY_IMPORT_COLS = ['name', 'pincode', 'state_code', 'rto_charge', 'insurance_charge', 'other_charges', 'is_popular', 'is_active'];

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

  // Bulk upload state
  const [showImportExport, setShowImportExport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<{ success: number; errors: string[] } | null>(null);

  const [stateForm, setStateForm] = useState({
    name: '',
    code: '',
    rto_percentage: '8',
    road_tax_percentage: '0',
    other_charges: '1000',
    subsidy_amount: '0',
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
        subsidy_amount: parseInt(stateForm.subsidy_amount) || 0,
      };

      if (editingState) {
        const { error } = await supabase.from('pricing_states').update(payload).eq('id', editingState.id);
        if (error) throw error;
        toast.success('State updated');
      } else {
        const { error } = await supabase.from('pricing_states').insert([payload]);
        if (error) throw error;
        toast.success('State added');
      }

      setShowStateForm(false);
      setEditingState(null);
      setStateForm({ name: '', code: '', rto_percentage: '8', road_tax_percentage: '0', other_charges: '1000', subsidy_amount: '0' });
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
      subsidy_amount: (state.subsidy_amount || 0).toString(),
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

  // Export handlers
  const handleExportStates = () => {
    const exportData = states.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code,
      rto_percentage: s.rto_percentage,
      road_tax_percentage: s.road_tax_percentage,
      other_charges: s.other_charges,
      subsidy_amount: s.subsidy_amount || 0,
      is_active: s.is_active ? 'true' : 'false',
    }));
    const csv = arrayToCSV(exportData, STATE_EXPORT_COLS);
    downloadCSV(csv, `pricing_states_${Date.now()}.csv`);
  };

  const handleExportCities = () => {
    const exportData = cities.map(c => ({
      id: c.id,
      name: c.name,
      pincode: c.pincode || '',
      state_code: c.state?.code || '',
      rto_charge: c.rto_charge,
      insurance_charge: c.insurance_charge,
      other_charges: c.other_charges,
      is_popular: c.is_popular ? 'true' : 'false',
      is_active: c.is_active ? 'true' : 'false',
    }));
    const csv = arrayToCSV(exportData, CITY_EXPORT_COLS);
    downloadCSV(csv, `pricing_cities_${Date.now()}.csv`);
  };

  const handleDownloadTemplate = () => {
    const cols = activeTab === 'states' ? STATE_IMPORT_COLS : CITY_IMPORT_COLS;
    const template = generateTemplate(cols);
    downloadCSV(template, `${activeTab}_template.csv`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportReport(null);

    try {
      const text = await file.text();
      const { rows } = parseCSV(text);

      if (rows.length === 0) {
        setImportReport({ success: 0, errors: ['File is empty or has no data rows.'] });
        return;
      }

      const errors: string[] = [];
      let success = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        try {
          if (activeTab === 'states') {
            if (!row.name || !row.code) {
              errors.push(`Row ${i + 1}: name and code are required`);
              continue;
            }

            const payload = {
              name: row.name.trim(),
              code: row.code.toUpperCase().trim().slice(0, 2),
              rto_percentage: parseFloat(row.rto_percentage) || 8,
              road_tax_percentage: parseFloat(row.road_tax_percentage) || 0,
              other_charges: parseInt(row.other_charges) || 1000,
              subsidy_amount: parseInt(row.subsidy_amount) || 0,
              is_active: row.is_active !== 'false',
            };

            const { error } = await supabase.from('pricing_states').insert([payload]);
            if (error) throw error;
            success++;
          } else {
            // Cities import
            if (!row.name || !row.state_code) {
              errors.push(`Row ${i + 1}: name and state_code are required`);
              continue;
            }

            // Find state by code
            const state = states.find(s => s.code.toLowerCase() === row.state_code.toLowerCase().trim());
            if (!state) {
              errors.push(`Row ${i + 1}: State code "${row.state_code}" not found`);
              continue;
            }

            const payload = {
              name: row.name.trim(),
              state_id: state.id,
              pincode: row.pincode?.trim() || null,
              rto_charge: parseInt(row.rto_charge) || 50000,
              insurance_charge: parseInt(row.insurance_charge) || 15000,
              other_charges: parseInt(row.other_charges) || 2000,
              is_popular: row.is_popular === 'true',
              is_active: row.is_active !== 'false',
            };

            const { error } = await supabase.from('pricing_cities').insert([payload]);
            if (error) throw error;
            success++;
          }
        } catch (err: any) {
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
      }

      if (success > 0) fetchData();
      setImportReport({ success, errors });
    } catch (err: any) {
      setImportReport({ success: 0, errors: [err.message || 'Failed to parse file'] });
    } finally {
      setImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportExport(!showImportExport)}
              className="admin-btn-secondary flex items-center gap-2"
            >
              <Download size={14} />
              Import / Export
            </button>
          </div>
        </div>

        {/* Import/Export Modal */}
        {showImportExport && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowImportExport(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Import / Export {activeTab === 'states' ? 'States' : 'Cities'}</h3>
                <button onClick={() => setShowImportExport(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {/* Export */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Export</p>
                <button
                  onClick={activeTab === 'states' ? handleExportStates : handleExportCities}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <FileText size={16} />
                  Export {activeTab === 'states' ? 'States' : 'Cities'} to CSV
                </button>
              </div>

              {/* Import */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Import</p>
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 rounded-lg text-sm font-medium transition-colors mb-2"
                >
                  <Download size={16} />
                  Download Sample Template
                </button>
                <label className="w-full flex items-center justify-center gap-2 bg-[#145a2c] hover:bg-[#0f4020] text-white py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                  {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {importing ? 'Importing...' : 'Import CSV / Excel'}
                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx,.tsv"
                    onChange={handleImport}
                    disabled={importing}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Import Report */}
              {importReport && (
                <div className={cn(
                  'mt-4 rounded-lg p-3 text-sm',
                  importReport.errors.length === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                )}>
                  {importReport.success > 0 && (
                    <div className="flex items-center gap-2 text-green-700 font-medium">
                      <CheckCircle size={16} />
                      {importReport.success} records imported
                    </div>
                  )}
                  {importReport.errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-amber-700 font-medium">
                        <AlertCircle size={16} />
                        {importReport.errors.length} error{importReport.errors.length !== 1 ? 's' : ''}
                      </div>
                      <ul className="list-disc list-inside text-amber-700 space-y-0.5 max-h-32 overflow-y-auto text-xs">
                        {importReport.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                        {importReport.errors.length > 5 && <li>...and {importReport.errors.length - 5} more</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Template Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                <p className="font-semibold mb-1">{activeTab === 'states' ? 'States' : 'Cities'} Template Fields:</p>
                <p className="text-gray-500">
                  {activeTab === 'states'
                    ? 'name, code (2 letters), rto_percentage, road_tax_percentage, other_charges, subsidy_amount, is_active'
                    : 'name, pincode, state_code (e.g., DL, MH), rto_charge, insurance_charge, other_charges, is_popular, is_active'}
                </p>
              </div>
            </div>
          </>
        )}

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
                      setStateForm({ name: '', code: '', rto_percentage: '8', road_tax_percentage: '0', other_charges: '1000', subsidy_amount: '0' });
                    }}
                    className="admin-btn-primary flex items-center gap-2"
                  >
                    <Plus size={14} />
                    Add State
                  </button>
                </div>

                {showStateForm && (
                  <div className="admin-card p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-900">{editingState ? 'Edit State' : 'Add New State'}</h3>
                      <button onClick={() => setShowStateForm(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">State Name *</label>
                        <input
                          type="text"
                          value={stateForm.name}
                          onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                          placeholder="e.g., Maharashtra"
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">State Code *</label>
                        <input
                          type="text"
                          value={stateForm.code}
                          onChange={(e) => setStateForm({ ...stateForm, code: e.target.value.toUpperCase() })}
                          placeholder="e.g., MH"
                          maxLength={2}
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">RTO Percentage (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={stateForm.rto_percentage}
                          onChange={(e) => setStateForm({ ...stateForm, rto_percentage: e.target.value })}
                          placeholder="8"
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Road Tax (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={stateForm.road_tax_percentage}
                          onChange={(e) => setStateForm({ ...stateForm, road_tax_percentage: e.target.value })}
                          placeholder="0"
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Other Charges (Rs.)</label>
                        <input
                          type="number"
                          value={stateForm.other_charges}
                          onChange={(e) => setStateForm({ ...stateForm, other_charges: e.target.value })}
                          placeholder="1000"
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">EV Subsidy (Rs.)</label>
                        <input
                          type="number"
                          value={stateForm.subsidy_amount}
                          onChange={(e) => setStateForm({ ...stateForm, subsidy_amount: e.target.value })}
                          placeholder="0"
                          className="admin-input"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button onClick={handleSaveState} disabled={saving} className="admin-btn-primary flex items-center gap-2">
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
                        <th>Subsidy</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {states.map((state) => (
                        <tr key={state.id}>
                          <td className="font-medium text-gray-900">{state.name}</td>
                          <td>
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{state.code}</span>
                          </td>
                          <td>{state.rto_percentage}%</td>
                          <td>{state.road_tax_percentage}%</td>
                          <td>{formatCurrency(state.other_charges)}</td>
                          <td>{state.subsidy_amount ? formatCurrency(state.subsidy_amount) : '-'}</td>
                          <td>
                            <div className="flex gap-1 justify-center">
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
                  <div className="admin-card p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-900">{editingCity ? 'Edit City' : 'Add New City'}</h3>
                      <button onClick={() => setShowCityForm(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">RTO Charge (Rs.)</label>
                        <input
                          type="number"
                          value={cityForm.rto_charge}
                          onChange={(e) => setCityForm({ ...cityForm, rto_charge: e.target.value })}
                          placeholder="50000"
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Insurance (Rs.)</label>
                        <input
                          type="number"
                          value={cityForm.insurance_charge}
                          onChange={(e) => setCityForm({ ...cityForm, insurance_charge: e.target.value })}
                          placeholder="15000"
                          className="admin-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Other Charges (Rs.)</label>
                        <input
                          type="number"
                          value={cityForm.other_charges}
                          onChange={(e) => setCityForm({ ...cityForm, other_charges: e.target.value })}
                          placeholder="2000"
                          className="admin-input"
                        />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cityForm.is_popular}
                            onChange={(e) => setCityForm({ ...cityForm, is_popular: e.target.checked })}
                            className="w-4 h-4 rounded accent-[#145a2c]"
                          />
                          <span className="text-sm text-gray-700">Mark as Popular City (shown first in selection)</span>
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
                        <th>RTO</th>
                        <th>Insurance</th>
                        <th>Other</th>
                        <th className="text-center">Popular</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cities.map((city) => (
                        <tr key={city.id}>
                          <td className="font-medium text-gray-900">{city.name}</td>
                          <td><span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{city.pincode || '-'}</span></td>
                          <td>{city.state?.name || '-'}</td>
                          <td>{formatCurrency(city.rto_charge)}</td>
                          <td>{formatCurrency(city.insurance_charge)}</td>
                          <td>{formatCurrency(city.other_charges)}</td>
                          <td className="text-center">
                            {city.is_popular && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                                <Star size={10} />
                                Popular
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="flex gap-1 justify-center">
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
