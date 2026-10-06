'use client';

import { useState, useMemo } from 'react';
import { X, Zap, MapPin, Phone, Send, Loader as Loader2, CircleCheck as CheckCircle, Upload, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChargingStationSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const connectorOptions = ['CCS2', 'CHAdeMO', 'Type 2 AC', 'Bharat DC-001', 'Bharat AC-001', 'Ather Proprietary', 'Ola Proprietary', 'Type 1 AC', 'Tesla'];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Chandigarh', 'Puducherry', 'Other'
];

interface SingleForm {
  name: string;
  address: string;
  city: string;
  state: string;
  map_url: string;
  operator: string;
  phone: string;
  connectors: string[];
}

interface BulkRow {
  name: string;
  address: string;
  city: string;
  state: string;
  operator: string;
  map_url: string;
  connectors: string;
}

const emptyForm: SingleForm = {
  name: '', address: '', city: '', state: '', map_url: '', operator: '', phone: '', connectors: []
};

const emptyBulkRow: BulkRow = {
  name: '', address: '', city: '', state: '', operator: '', map_url: '', connectors: 'CCS2'
};

export default function ChargingStationSubmitModal({ isOpen, onClose }: ChargingStationSubmitModalProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<SingleForm>(emptyForm);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([emptyBulkRow]);

  const availableCities = useMemo(() => {
    if (!formData.state) return [];
    return cityMap[formData.state] || [];
  }, [formData.state]);

  const handleSubmitSingle = async () => {
    if (!formData.name || !formData.address || !formData.city || !formData.state || !formData.operator) {
      toast.error('Please fill all required fields');
      return;
    }
    if (formData.connectors.length === 0) {
      toast.error('Please select at least one connector type');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        lat: null,
        lng: null,
        map_url: formData.map_url.trim() || null,
        operator: formData.operator.trim(),
        connector_types: formData.connectors,
        phone: formData.phone.trim() || null,
        submitted_by: 'Web User',
        status: 'pending',
      };

      const { error } = await supabase.from('charging_submissions').insert([payload]);
      if (error) throw error;

      setSuccess(true);
      toast.success('Station submitted for review');
      setTimeout(() => {
        setSuccess(false);
        setFormData(emptyForm);
        onClose();
      }, 2000);
    } catch (err: any) {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitBulk = async () => {
    const validRows = bulkRows.filter(r => r.name && r.address && r.city && r.state && r.operator);
    if (validRows.length === 0) {
      toast.error('Please fill at least one complete row');
      return;
    }

    setSubmitting(true);
    try {
      const payload = validRows.map(r => ({
        name: r.name.trim(),
        address: r.address.trim(),
        city: r.city.trim(),
        state: r.state.trim(),
        lat: null,
        lng: null,
        map_url: r.map_url.trim() || null,
        operator: r.operator.trim(),
        connector_types: r.connectors.split(',').map(c => c.trim()).filter(Boolean),
        phone: null,
        submitted_by: 'Web User',
        status: 'pending',
      }));

      const { error } = await supabase.from('charging_submissions').insert(payload);
      if (error) throw error;

      setSuccess(true);
      toast.success(`${validRows.length} station(s) submitted for review`);
      setTimeout(() => {
        setSuccess(false);
        setBulkRows([emptyBulkRow]);
        onClose();
      }, 2000);
    } catch (err: any) {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleConnector = (connector: string) => {
    setFormData(prev => ({
      ...prev,
      connectors: prev.connectors.includes(connector)
        ? prev.connectors.filter(c => c !== connector)
        : [...prev.connectors, connector]
    }));
  };

  const addBulkRow = () => setBulkRows([...bulkRows, emptyBulkRow]);
  const removeBulkRow = (idx: number) => setBulkRows(bulkRows.filter((_, i) => i !== idx));
  const updateBulkRow = (idx: number, field: keyof BulkRow, value: string) => {
    setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600 text-sm">Your charging station submission has been received and will be reviewed by our team.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Zap size={20} className="text-[#145a2c]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Submit a Charging Station</h2>
                  <p className="text-xs text-gray-500">Help us expand our directory</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 px-5 pt-4">
              <button
                onClick={() => setMode('single')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  mode === 'single' ? 'bg-[#145a2c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <MapPin size={14} /> Single Station
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  mode === 'bulk' ? 'bg-[#145a2c] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Upload size={14} /> Bulk Upload
              </button>
            </div>

            {mode === 'single' ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSubmitSingle(); }} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Station Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Tata Power Charging Station"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full address of the station"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">State *</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                      required
                    >
                      <option value="">Select state</option>
                      {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g., Bengaluru"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    <span className="flex items-center gap-1"><LinkIcon size={12} /> Google Maps URL (optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.map_url}
                    onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                    placeholder="https://www.google.com/maps/embed?pb=... or https://maps.app.goo.gl/..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Paste the share link or embed URL from Google Maps</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Operator / Network *</label>
                  <input
                    type="text"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    placeholder="e.g., Tata Power, Ather Grid, Statiq"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number (optional)</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Support contact number"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Connector Types * (select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {connectorOptions.map(connector => (
                      <button
                        key={connector}
                        type="button"
                        onClick={() => toggleConnector(connector)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          formData.connectors.includes(connector)
                            ? 'bg-[#145a2c] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {connector}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-[#145a2c] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0f4020] transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                    ) : (
                      <><Send size={16} /> Submit for Review</>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-500 mt-2">
                    Submissions are reviewed before being published.
                  </p>
                </div>
              </form>
            ) : (
              <div className="p-5 space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                  Fill in details for multiple stations. Separate connectors with commas (e.g., CCS2, CHAdeMO). Rows with missing required fields will be skipped.
                </div>

                {bulkRows.map((row, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">Station #{idx + 1}</span>
                      {bulkRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBulkRow(idx)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateBulkRow(idx, 'name', e.target.value)}
                      placeholder="Station name *"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                    />
                    <input
                      type="text"
                      value={row.address}
                      onChange={(e) => updateBulkRow(idx, 'address', e.target.value)}
                      placeholder="Full address *"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={row.state}
                        onChange={(e) => updateBulkRow(idx, 'state', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                      >
                        <option value="">State *</option>
                        {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input
                        type="text"
                        value={row.city}
                        onChange={(e) => updateBulkRow(idx, 'city', e.target.value)}
                        placeholder="City *"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                      />
                    </div>
                    <input
                      type="text"
                      value={row.operator}
                      onChange={(e) => updateBulkRow(idx, 'operator', e.target.value)}
                      placeholder="Operator / network *"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                    />
                    <input
                      type="text"
                      value={row.connectors}
                      onChange={(e) => updateBulkRow(idx, 'connectors', e.target.value)}
                      placeholder="Connectors (comma-separated, e.g. CCS2, CHAdeMO)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                    />
                    <input
                      type="url"
                      value={row.map_url}
                      onChange={(e) => updateBulkRow(idx, 'map_url', e.target.value)}
                      placeholder="Google Maps URL (optional)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addBulkRow}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-[#145a2c] hover:text-[#145a2c] transition-all"
                >
                  <Plus size={16} /> Add Another Station
                </button>

                <button
                  type="button"
                  onClick={handleSubmitBulk}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#145a2c] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0f4020] transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                  ) : (
                    <><Send size={16} /> Submit {bulkRows.filter(r => r.name && r.address && r.city && r.state && r.operator).length} Station(s)</>
                  )}
                </button>
                <p className="text-center text-xs text-gray-500">
                  Submissions are reviewed before being published.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const cityMap: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kurnool'],
  'Delhi': ['New Delhi', 'Delhi', 'Dwarka', 'Rohini', 'Saket', 'Connaught Place'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi', 'Davanagere'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli', 'Vellore'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Gandhinagar'],
  'Uttar Pradesh': ['Lucknow', 'Noida', 'Ghaziabad', 'Kanpur', 'Varanasi', 'Agra', 'Meerut', 'Allahabad'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Raipur'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  'Other': [],
};
