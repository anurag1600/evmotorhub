'use client';

import { useState, useEffect } from 'react';
import { Car, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SiteConfig } from '@/lib/types';

export default function VehicleSettingsPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [defaultSort, setDefaultSort] = useState('price_asc');
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [showPriceRange, setShowPriceRange] = useState(true);
  const [compareMaxVehicles, setCompareMaxVehicles] = useState(2);

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase.from('site_config').select('*').limit(1);
      if (data && data[0]) {
        const c = data[0] as SiteConfig;
        setConfig(c);
        const vs = c.vehicle_settings || {};
        setDefaultSort(vs.default_sort || 'price_asc');
        setShowUpcoming(vs.show_upcoming !== false);
        setShowPriceRange(vs.show_price_range !== false);
        setCompareMaxVehicles(vs.compare_max_vehicles || 2);
      }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('site_config')
        .update({
          vehicle_settings: {
            default_sort: defaultSort,
            show_upcoming: showUpcoming,
            show_price_range: showPriceRange,
            compare_max_vehicles: compareMaxVehicles,
          },
        })
        .eq('id', config.id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Vehicle settings saved!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-page"><div className="admin-container flex items-center justify-center py-20"><Loader2 size={28} className="text-[#145a2c] animate-spin" /></div></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Car size={28} className="text-[#145a2c]" />
              Vehicle Settings
            </h1>
            <p className="admin-subtitle">Configure how vehicles are displayed and compared</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="admin-btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="admin-card p-6">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Display Settings</h3>
          <div className="space-y-5">
            <div>
              <label className="admin-label">Default Sort Order</label>
              <select value={defaultSort} onChange={(e) => setDefaultSort(e.target.value)} className="admin-select">
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="range_desc">Range: Highest First</option>
                <option value="speed_desc">Top Speed: Highest First</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
            <div>
              <label className="admin-label">Max Vehicles in Comparison</label>
              <select value={compareMaxVehicles} onChange={(e) => setCompareMaxVehicles(Number(e.target.value))} className="admin-select">
                <option value={2}>2 vehicles</option>
                <option value={3}>3 vehicles</option>
                <option value={4}>4 vehicles</option>
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showUpcoming} onChange={(e) => setShowUpcoming(e.target.checked)} className="w-4 h-4 rounded accent-[#145a2c]" />
              <span className="text-sm font-medium text-gray-700">Show upcoming vehicles in listings</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showPriceRange} onChange={(e) => setShowPriceRange(e.target.checked)} className="w-4 h-4 rounded accent-[#145a2c]" />
              <span className="text-sm font-medium text-gray-700">Show price range (min-max) instead of starting price only</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
