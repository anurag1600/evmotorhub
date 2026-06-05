'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChargingStation } from '@/lib/types';
import { Save, Loader2, AlertCircle } from 'lucide-react';

interface ChargingStationFormProps {
  id?: string;
}

export default function ChargingStationForm({ id }: ChargingStationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    lat: 0,
    lng: 0,
    operator: '',
    connector_types: ['CCS'] as string[],
    total_chargers: 2,
    available_chargers: 2,
    status: 'active' as 'active' | 'inactive' | 'coming_soon',
    power_kw: 50,
    amenities: [] as string[],
    operating_hours: '',
  });

  useEffect(() => {
    if (id) {
      fetchStation();
    }
  }, [id]);

  const fetchStation = async () => {
    try {
      const { data, error: err } = await supabase
        .from('charging_stations')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (err) throw err;
      if (data) setForm(data as any);
    } catch (err: any) {
      setError('Failed to load station: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Station name is required');
      return;
    }
    if (!form.city.trim()) {
      setError('City is required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (id) {
        const { error: err } = await supabase
          .from('charging_stations')
          .update(form)
          .eq('id', id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('charging_stations').insert([form]);
        if (err) throw err;
      }
      router.push('/admin/charging');
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-container flex items-center justify-center h-64">
          <Loader2 size={32} className="animate-spin text-[#145a2c]" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container max-w-2xl">
        <h1 className="admin-title mb-6">{id ? 'Edit Charging Station' : 'Add Charging Station'}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="admin-card p-4 bg-red-50 border border-red-200 flex gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="admin-card p-6 space-y-4">
            <h2 className="font-bold text-lg">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Station Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="admin-input"
                placeholder="Station name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="admin-input"
                placeholder="Full address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="admin-input"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="admin-input"
                  placeholder="State"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
              <input
                type="text"
                value={form.operator}
                onChange={(e) => setForm({ ...form, operator: e.target.value })}
                className="admin-input"
                placeholder="Operator name"
              />
            </div>
          </div>

          <div className="admin-card p-6 space-y-4">
            <h2 className="font-bold text-lg">Location</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) || 0 })}
                  className="admin-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) || 0 })}
                  className="admin-input"
                />
              </div>
            </div>
          </div>

          <div className="admin-card p-6 space-y-4">
            <h2 className="font-bold text-lg">Charger Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Chargers</label>
                <input
                  type="number"
                  value={form.total_chargers}
                  onChange={(e) => setForm({ ...form, total_chargers: parseInt(e.target.value) || 0 })}
                  className="admin-input"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available</label>
                <input
                  type="number"
                  value={form.available_chargers}
                  onChange={(e) => setForm({ ...form, available_chargers: parseInt(e.target.value) || 0 })}
                  className="admin-input"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Power (kW)</label>
              <input
                type="number"
                value={form.power_kw}
                onChange={(e) => setForm({ ...form, power_kw: parseInt(e.target.value) || 0 })}
                className="admin-input"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Connector Types</label>
              <div className="space-y-2">
                {['CCS', 'CHAdeMO', 'Type2', 'AC'].map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.connector_types.includes(type)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          connector_types: e.target.checked
                            ? [...form.connector_types, type]
                            : form.connector_types.filter((t) => t !== type),
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-card p-6 space-y-4">
            <h2 className="font-bold text-lg">Status</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="admin-input"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="coming_soon">Coming Soon</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
              <input
                type="text"
                value={form.operating_hours}
                onChange={(e) => setForm({ ...form, operating_hours: e.target.value })}
                className="admin-input"
                placeholder="24/7 or 8 AM - 8 PM"
              />
            </div>
          </div>

          <div className="admin-card p-6 flex gap-3">
            <button type="submit" disabled={saving} className="admin-btn-primary flex items-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Station'}
            </button>
            <button type="button" onClick={() => router.back()} className="admin-btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
