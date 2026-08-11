'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Upload, Check, X, Clock, Loader as Loader2, Eye,
  FileSpreadsheet, AlertCircle, Car, Zap, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { timeAgo, slugify } from '@/lib/format';

interface VehicleSubmission {
  id: string;
  manufacturer_submission_id: string | null;
  company_name: string;
  vehicles: any[];
  validation_errors: any[];
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

type TabFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function VehicleSubmissionsPage() {
  const [submissions, setSubmissions] = useState<VehicleSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VehicleSubmission | null>(null);
  const [actionMode, setActionMode] = useState<'approve' | 'reject' | 'view' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<TabFilter>('all');
  const [manufacturerMap, setManufacturerMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicle_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSubmissions(data as VehicleSubmission[]);

      const companyNames = Array.from(new Set(data.map(d => d.company_name)));
      if (companyNames.length > 0) {
        const { data: mfgs } = await supabase
          .from('manufacturers')
          .select('id, name')
          .in('name', companyNames);
        if (mfgs) {
          const map: Record<string, string> = {};
          mfgs.forEach(m => { map[m.name] = m.id; });
          setManufacturerMap(map);
        }
      }
    }
    setLoading(false);
  };

  const openAction = (submission: VehicleSubmission, mode: 'approve' | 'reject' | 'view') => {
    setSelected(submission);
    setActionMode(mode);
    setRejectionReason(submission.rejection_reason || '');
    setAdminNotes(submission.admin_notes || '');
  };

  const closeModal = () => {
    setSelected(null);
    setActionMode(null);
    setRejectionReason('');
    setAdminNotes('');
    setProcessing(false);
  };

  const confirmApprove = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const manufacturerId = manufacturerMap[selected.company_name] || null;

      if (!manufacturerId) {
        toast.error(`Manufacturer "${selected.company_name}" not found. Approve the manufacturer submission first.`);
        setProcessing(false);
        return;
      }

      const vehicleRows = selected.vehicles.map((v: any) => ({
        name: v.name,
        slug: v.slug || slugify(v.name),
        manufacturer_id: manufacturerId,
        type: v.type,
        segment: v.segment || 'mid',
        price_min: v.price_min || 0,
        price_max: v.price_max || 0,
        range_km: v.range_km || 0,
        top_speed_kmh: v.top_speed_kmh || 0,
        charging_time_hrs: v.charging_time_hrs || 0,
        battery_capacity_kwh: v.battery_capacity_kwh || 0,
        motor_power_kw: v.motor_power_kw || 0,
        image_url: v.image_url || '',
        description: v.description || '',
        is_upcoming: v.is_upcoming || false,
        is_featured: v.is_featured || false,
        colors: v.colors || [],
        features: v.features || [],
        pros: v.pros || [],
        cons: v.cons || [],
        launch_date: v.launch_date || null,
        status: 'published',
      }));

      const { error: vError } = await supabase
        .from('vehicles')
        .insert(vehicleRows);

      if (vError) throw vError;

      const { error: updateError } = await supabase
        .from('vehicle_submissions')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selected.id);

      if (updateError) throw updateError;

      toast.success(`${vehicleRows.length} vehicle(s) approved and published`);
      await fetchSubmissions();
      closeModal();
    } catch (err: any) {
      console.error('Approve error:', err);
      toast.error(err.message || 'Failed to approve');
      setProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!selected) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('vehicle_submissions')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selected.id);

      if (error) throw error;

      toast.success('Vehicle submission rejected');
      await fetchSubmissions();
      closeModal();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
      setProcessing(false);
    }
  };

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter);
  const counts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Upload size={28} className="text-[#145a2c]" />
              Vehicle Submissions
            </h1>
            <p className="admin-subtitle">Review and approve manufacturer-submitted vehicles</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'pending', 'approved', 'rejected'] as TabFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                filter === f ? 'bg-[#145a2c] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-card text-center py-12">
            <Upload size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">No {filter !== 'all' ? filter : ''} vehicle submissions</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((submission) => (
              <div key={submission.id} className="admin-card p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#145a2c]/10 flex items-center justify-center">
                          <Building2 size={20} className="text-[#145a2c]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{submission.company_name}</h3>
                          <p className="text-xs text-gray-500">
                            {submission.vehicles.length} vehicle(s) submitted
                          </p>
                        </div>
                      </div>
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap', statusColors[submission.status])}>
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </span>
                    </div>

                    {/* Vehicle summary chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {submission.vehicles.slice(0, 5).map((v: any, i: number) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg flex items-center gap-1">
                          <Car size={10} />
                          {v.name}
                        </span>
                      ))}
                      {submission.vehicles.length > 5 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{submission.vehicles.length - 5} more
                        </span>
                      )}
                    </div>

                    {submission.validation_errors && submission.validation_errors.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-2">
                        <AlertCircle size={12} />
                        {submission.validation_errors.length} validation warning(s)
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> Submitted {timeAgo(submission.created_at)}
                      </span>
                      {!manufacturerMap[submission.company_name] && submission.status === 'pending' && (
                        <span className="text-amber-600 font-medium">
                          Manufacturer not yet approved
                        </span>
                      )}
                    </div>

                    {submission.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg text-xs text-red-700">
                        <strong>Rejection Reason:</strong> {submission.rejection_reason}
                      </div>
                    )}
                    {submission.admin_notes && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                        <strong>Admin Notes:</strong> {submission.admin_notes}
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-2 sm:items-end">
                    <button
                      onClick={() => openAction(submission, 'view')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                    >
                      <Eye size={14} /> View
                    </button>
                    {submission.status === 'pending' && (
                      <>
                        <button
                          onClick={() => openAction(submission, 'approve')}
                          disabled={!manufacturerMap[submission.company_name]}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={!manufacturerMap[submission.company_name] ? 'Approve the manufacturer first' : ''}
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => openAction(submission, 'reject')}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                        >
                          <X size={14} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && actionMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg text-gray-900">
                {actionMode === 'approve' ? 'Approve Vehicles' : actionMode === 'reject' ? 'Reject Submission' : 'Vehicle Submission Details'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-lg bg-[#145a2c]/10 flex items-center justify-center">
                  <Building2 size={20} className="text-[#145a2c]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{selected.company_name}</h4>
                  <p className="text-sm text-gray-500">{selected.vehicles.length} vehicles</p>
                </div>
              </div>

              {/* Vehicle list */}
              <div className="space-y-3">
                {selected.vehicles.map((v: any, i: number) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Car size={16} className="text-gray-400" />
                        <span className="font-semibold text-gray-900">{v.name}</span>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">{v.type}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                      {v.price_min > 0 && <div><span className="text-gray-400">Price:</span> ₹{Number(v.price_min).toLocaleString()}</div>}
                      {v.range_km > 0 && <div><span className="text-gray-400">Range:</span> {v.range_km} km</div>}
                      {v.top_speed_kmh > 0 && <div><span className="text-gray-400">Speed:</span> {v.top_speed_kmh} km/h</div>}
                      {v.battery_capacity_kwh > 0 && <div><span className="text-gray-400">Battery:</span> {v.battery_capacity_kwh} kWh</div>}
                      {v.charging_time_hrs > 0 && <div><span className="text-gray-400">Charge:</span> {v.charging_time_hrs} hrs</div>}
                      {v.motor_power_kw > 0 && <div><span className="text-gray-400">Motor:</span> {v.motor_power_kw} kW</div>}
                    </div>
                    {v.colors && v.colors.length > 0 && (
                      <div className="mt-2 flex gap-1.5 flex-wrap">
                        {v.colors.map((c: string, ci: number) => (
                          <span key={ci} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selected.validation_errors && selected.validation_errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 mb-2">
                    <AlertCircle size={16} /> Validation Warnings
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selected.validation_errors.map((e: any, i: number) => (
                      <div key={i} className="text-xs text-amber-600">
                        Row {e._rowNumber}: {e._errors.join('; ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {actionMode !== 'view' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Notes (optional)</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal notes..."
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                    />
                  </div>

                  {actionMode === 'reject' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rejection Reason <span className="text-red-500">*</span></label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why these vehicles are being rejected..."
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                      />
                    </div>
                  )}

                  {actionMode === 'approve' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                      <AlertCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-700">
                        <p className="font-semibold mb-1">This will publish {selected.vehicles.length} vehicle(s) to the public listing.</p>
                        <p className="text-xs">Vehicles will be linked to manufacturer "{selected.company_name}" and visible on the frontend.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {actionMode !== 'view' && (
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                <button onClick={closeModal} className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
                {actionMode === 'approve' ? (
                  <button
                    onClick={confirmApprove}
                    disabled={processing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    {processing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {processing ? 'Approving...' : 'Approve & Publish'}
                  </button>
                ) : (
                  <button
                    onClick={confirmReject}
                    disabled={processing}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {processing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                    {processing ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
