'use client';

import { useState, useRef } from 'react';
import { X, Zap, MapPin, Phone, Send, Loader as Loader2, CircleCheck as CheckCircle, Link as LinkIcon, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { parseFile, downloadExcelTemplate } from '@/lib/import-export';

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

const BULK_COLUMNS = ['name', 'address', 'city', 'state', 'operator', 'connector_types', 'phone', 'map_url'];
const BULK_SAMPLE = [
  { name: 'Tata Power Charging Station', address: 'MG Road, Near Metro Station', city: 'Bengaluru', state: 'Karnataka', operator: 'Tata Power', connector_types: 'CCS2,CHAdeMO', phone: '18002582580', map_url: 'https://www.google.com/maps/embed?pb=...' },
  { name: 'Ather Grid Indiranagar', address: '100 Feet Road, Indiranagar', city: 'Bengaluru', state: 'Karnataka', operator: 'Ather Grid', connector_types: 'Type 2 AC,Ather Proprietary', phone: '', map_url: 'https://maps.app.goo.gl/abc123' },
  { name: 'Statiq Highway Plaza', address: 'NH-48, Near Reliance Petrol Pump', city: 'Gurugram', state: 'Haryana', operator: 'Statiq', connector_types: 'CCS2', phone: '9999999999', map_url: '' },
];

const emptyForm = {
  name: '', address: '', city: '', state: '', map_url: '', operator: '', phone: '', connectors: [] as string[]
};

type Mode = 'single' | 'bulk';

export default function ChargingStationSubmitModal({ isOpen, onClose }: ChargingStationSubmitModalProps) {
  const [mode, setMode] = useState<Mode>('single');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  // Bulk upload state
  const [bulkRows, setBulkRows] = useState<Record<string, string>[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch {
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

  const handleFileUpload = async (file: File) => {
    setBulkErrors([]);
    try {
      const { headers, rows } = await parseFile(file);
      if (headers.length === 0 || rows.length === 0) {
        setBulkErrors(['The file appears to be empty or has no data rows.']);
        setBulkRows([]);
        setBulkFileName('');
        return;
      }

      const missing = BULK_COLUMNS.filter(c => !headers.includes(c));
      if (missing.length > 0) {
        setBulkErrors([`Missing required columns: ${missing.join(', ')}. Please download the sample template for the correct format.`]);
        setBulkRows([]);
        setBulkFileName('');
        return;
      }

      const errors: string[] = [];
      const validConnectors = connectorOptions;

      rows.forEach((row, i) => {
        const rowNum = i + 2;
        if (!row.name?.trim()) errors.push(`Row ${rowNum}: name is required`);
        if (!row.address?.trim()) errors.push(`Row ${rowNum}: address is required`);
        if (!row.city?.trim()) errors.push(`Row ${rowNum}: city is required`);
        if (!row.state?.trim()) errors.push(`Row ${rowNum}: state is required`);
        if (!row.operator?.trim()) errors.push(`Row ${rowNum}: operator is required`);
        if (row.connector_types?.trim()) {
          const connectors = row.connector_types.split(',').map(c => c.trim()).filter(Boolean);
          const invalid = connectors.filter(c => !validConnectors.includes(c));
          if (invalid.length > 0) errors.push(`Row ${rowNum}: unknown connector type(s): ${invalid.join(', ')}. Valid: ${validConnectors.join(', ')}`);
        }
      });

      setBulkErrors(errors);
      setBulkRows(rows);
      setBulkFileName(file.name);
      if (errors.length === 0) {
        toast.success(`${rows.length} stations ready to submit`);
      } else {
        toast.error(`${errors.length} validation error(s) found`);
      }
    } catch {
      setBulkErrors(['Failed to parse the file. Please ensure it is a valid CSV or XLSX file.']);
      setBulkRows([]);
      setBulkFileName('');
    }
  };

  const handleBulkSubmit = async () => {
    if (bulkRows.length === 0) {
      toast.error('No data to submit. Please upload a file first.');
      return;
    }
    if (bulkErrors.length > 0) {
      toast.error('Please fix all validation errors before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const payloads = bulkRows.map(row => ({
        name: row.name.trim(),
        address: row.address.trim(),
        city: row.city.trim(),
        state: row.state.trim(),
        lat: null,
        lng: null,
        map_url: row.map_url?.trim() || null,
        operator: row.operator.trim(),
        connector_types: row.connector_types?.trim()
          ? row.connector_types.split(',').map(c => c.trim()).filter(Boolean)
          : ['CCS2'],
        phone: row.phone?.trim() || null,
        submitted_by: 'Web User',
        status: 'pending',
      }));

      const { error } = await supabase.from('charging_submissions').insert(payloads);
      if (error) throw error;

      setSuccess(true);
      toast.success(`${payloads.length} stations submitted for review`);
      setTimeout(() => {
        setSuccess(false);
        setBulkRows([]);
        setBulkErrors([]);
        setBulkFileName('');
        onClose();
      }, 2000);
    } catch {
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    downloadExcelTemplate(BULK_COLUMNS, BULK_SAMPLE, 'charging-stations-template.xlsx');
  };

  const handleDownloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    downloadTemplate();
  };

  const resetBulk = () => {
    setBulkRows([]);
    setBulkErrors([]);
    setBulkFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
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

            {/* Mode tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setMode('single')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                  mode === 'single' ? 'text-[#145a2c] border-b-2 border-[#145a2c]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MapPin size={16} /> Single Station
              </button>
              <button
                onClick={() => setMode('bulk')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                  mode === 'bulk' ? 'text-[#145a2c] border-b-2 border-[#145a2c]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileSpreadsheet size={16} /> Bulk Upload
              </button>
            </div>

            {mode === 'single' ? (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          formData.connectors.includes(connector)
                            ? 'bg-[#145a2c] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
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
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <p className="text-sm text-green-800 font-medium mb-1">Upload multiple stations at once</p>
                  <p className="text-xs text-green-700">
                    Use a CSV or XLSX file with columns: name, address, city, state, operator, connector_types (comma-separated), phone, map_url.
                  </p>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  <Download size={16} /> Download Sample Template (.xlsx)
                </button>

                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#145a2c] hover:bg-green-50/30 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileUpload(file);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload size={28} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    {bulkFileName ? bulkFileName : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CSV or XLSX file</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </div>

                {bulkErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 max-h-32 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-red-600" />
                      <span className="text-sm font-semibold text-red-800">{bulkErrors.length} Error(s)</span>
                    </div>
                    <ul className="text-xs text-red-700 space-y-1">
                      {bulkErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                {bulkRows.length > 0 && bulkErrors.length === 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="text-sm font-semibold text-green-800">{bulkRows.length} stations ready</span>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {bulkRows.slice(0, 5).map((row, i) => (
                        <div key={i} className="text-xs text-green-700">
                          {i + 1}. {row.name} - {row.city}, {row.state}
                        </div>
                      ))}
                      {bulkRows.length > 5 && (
                        <div className="text-xs text-green-600 font-medium">...and {bulkRows.length - 5} more</div>
                      )}
                    </div>
                  </div>
                )}

                {bulkRows.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={resetBulk}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <X size={16} /> Clear
                    </button>
                    <button
                      onClick={handleBulkSubmit}
                      disabled={submitting || bulkErrors.length > 0}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#145a2c] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#0f4020] transition-colors disabled:opacity-50"
                    >
                      {submitting ? (
                        <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                      ) : (
                        <><Send size={16} /> Submit {bulkRows.length} Stations</>
                      )}
                    </button>
                  </div>
                )}

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
