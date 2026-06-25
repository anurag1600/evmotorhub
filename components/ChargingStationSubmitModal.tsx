'use client';

import { useState } from 'react';
import { X, Zap, MapPin, Phone, Send, Loader as Loader2, CircleCheck as CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChargingStationSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const connectorOptions = ['CCS2', 'CHAdeMO', 'Type 2 AC', 'Bharat DC-001', 'Bharat AC-001', 'Ather Proprietary', 'Ola Proprietary', 'Type 1 AC', 'Tesla'];

const indianStates = [
  'Andhra Pradesh', 'Bihar', 'Delhi', 'Gujarat', 'Haryana', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Uttar Pradesh', 'West Bengal', 'Goa', 'Odisha', 'Chhattisgarh', 'Jharkhand', 'Other'
];

export default function ChargingStationSubmitModal({ isOpen, onClose }: ChargingStationSubmitModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    lat: '',
    lng: '',
    operator: '',
    phone: '',
    connectors: [] as string[],
  });

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
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
        operator: formData.operator.trim(),
        connector_types: formData.connectors,
        phone: formData.phone.trim() || null,
        submitted_by: 'Web User',
        status: 'pending',
      };

      const { error } = await supabase
        .from('charging_submissions')
        .insert([payload]);

      if (error) throw error;

      setSuccess(true);
      toast.success('Station submitted for review');

      setTimeout(() => {
        setSuccess(false);
        setFormData({
          name: '', address: '', city: '', state: '',
          lat: '', lng: '', operator: '', phone: '', connectors: []
        });
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Submit error:', err);
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
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">State *</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                    required
                  >
                    <option value="">Select state</option>
                    {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Latitude (optional)</label>
                  <input
                    type="text"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    placeholder="e.g., 12.9716"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Longitude (optional)</label>
                  <input
                    type="text"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    placeholder="e.g., 77.5946"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                  />
                </div>
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
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit for Review
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-500 mt-2">
                  Submissions are reviewed before being published.
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
