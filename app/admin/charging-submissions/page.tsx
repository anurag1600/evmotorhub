'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Zap, Check, X, Clock, Loader as Loader2, ExternalLink, Phone, Eye, Trash2, TriangleAlert as AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/format';

interface ChargingSubmission {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  operator: string;
  connector_types: string[];
  phone: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  admin_notes: string | null;
  submitted_by: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

type TabFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function ChargingSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ChargingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ChargingSubmission | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState<TabFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('charging_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSubmissions(data as ChargingSubmission[]);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return submissions;
    return submissions.filter(s => s.status === filter);
  }, [submissions, filter]);

  const counts = useMemo(() => ({
    all: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  }), [submissions]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingIds = filtered.map(s => s.id);
    const allSelected = pendingIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        pendingIds.forEach(id => next.delete(id));
      } else {
        pendingIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleApprove = async (submission: ChargingSubmission) => {
    setProcessing(submission.id);
    setActionMode('approve');
    setNotes('');
  };

  const handleReject = async (submission: ChargingSubmission) => {
    setProcessing(submission.id);
    setActionMode('reject');
    setRejectionReason('');
  };

  const confirmApprove = async () => {
    if (!selectedSubmission) return;

    try {
      const stationData = {
        name: selectedSubmission.name,
        address: selectedSubmission.address,
        city: selectedSubmission.city,
        state: selectedSubmission.state,
        lat: selectedSubmission.lat,
        lng: selectedSubmission.lng,
        operator: selectedSubmission.operator,
        connector_types: selectedSubmission.connector_types,
        phone_support: selectedSubmission.phone,
        total_chargers: 1,
        available_chargers: 1,
        status: 'active',
        power_kw: 50,
        amenities: [],
        operating_hours: '24/7',
      };

      const { error: stationError } = await supabase
        .from('charging_stations')
        .insert([stationData]);

      if (stationError) throw stationError;

      const { error: updateError } = await supabase
        .from('charging_submissions')
        .update({ status: 'approved', admin_notes: notes || null })
        .eq('id', selectedSubmission.id);

      if (updateError) throw updateError;

      toast.success('Station approved and published');
      await fetchSubmissions();
      setSelectedSubmission(null);
      setProcessing(null);
      setActionMode(null);
    } catch (err: any) {
      console.error('Approve error:', err);
      toast.error(err.message || 'Failed to approve');
    }
  };

  const confirmReject = async () => {
    if (!selectedSubmission || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const { error } = await supabase
        .from('charging_submissions')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          admin_notes: notes || null
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      toast.success('Submission rejected');
      await fetchSubmissions();
      setSelectedSubmission(null);
      setProcessing(null);
      setActionMode(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    }
  };

  const closeModal = () => {
    setSelectedSubmission(null);
    setProcessing(null);
    setActionMode(null);
    setNotes('');
    setRejectionReason('');
  };

  // Bulk actions
  const bulkApprove = async () => {
    setBulkProcessing(true);
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      const sub = submissions.find(s => s.id === id);
      if (!sub || sub.status !== 'pending') { failCount++; continue; }
      try {
        const stationData = {
          name: sub.name, address: sub.address, city: sub.city, state: sub.state,
          lat: sub.lat, lng: sub.lng, operator: sub.operator,
          connector_types: sub.connector_types, phone_support: sub.phone,
          total_chargers: 1, available_chargers: 1, status: 'active',
          power_kw: 50, amenities: [], operating_hours: '24/7',
        };
        const { error: stErr } = await supabase.from('charging_stations').insert([stationData]);
        if (stErr) throw stErr;
        const { error: upErr } = await supabase.from('charging_submissions').update({ status: 'approved' }).eq('id', id);
        if (upErr) throw upErr;
        successCount++;
      } catch { failCount++; }
    }

    toast.success(`${successCount} submission(s) approved${failCount > 0 ? `, ${failCount} failed` : ''}`);
    setSelectedIds(new Set());
    setBulkMode(null);
    setBulkProcessing(false);
    await fetchSubmissions();
  };

  const bulkReject = async () => {
    setBulkProcessing(true);
    const ids = Array.from(selectedIds).filter(id => {
      const sub = submissions.find(s => s.id === id);
      return sub && sub.status === 'pending';
    });

    if (ids.length === 0) {
      toast.error('No pending submissions selected');
      setBulkProcessing(false);
      setBulkMode(null);
      return;
    }

    const { error } = await supabase
      .from('charging_submissions')
      .update({ status: 'rejected', rejection_reason: 'Bulk rejected by admin' })
      .in('id', ids);

    if (error) {
      toast.error('Failed to reject submissions');
    } else {
      toast.success(`${ids.length} submission(s) rejected`);
      setSelectedIds(new Set());
    }
    setBulkMode(null);
    setBulkProcessing(false);
    await fetchSubmissions();
  };

  const bulkDelete = async () => {
    setBulkProcessing(true);
    const ids = Array.from(selectedIds);

    const { error } = await supabase
      .from('charging_submissions')
      .delete()
      .in('id', ids);

    if (error) {
      toast.error('Failed to delete submissions');
    } else {
      toast.success(`${ids.length} submission(s) deleted`);
      setSelectedIds(new Set());
    }
    setBulkMode(null);
    setBulkProcessing(false);
    await fetchSubmissions();
  };

  const deleteSingle = async (id: string) => {
    const { error } = await supabase.from('charging_submissions').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Submission deleted');
      await fetchSubmissions();
    }
  };

  const pendingIds = filtered.map(s => s.id);
  const allSelected = pendingIds.length > 0 && pendingIds.every(id => selectedIds.has(id));

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <Zap size={28} className="text-[#145a2c]" />
              Charging Station Submissions
            </h1>
            <p className="admin-subtitle">Review and approve user-submitted charging stations</p>
          </div>
        </div>

        {/* Status Tabs */}
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
              {f === 'all' ? 'All' : f} ({counts[f]})
            </button>
          ))}
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="admin-card p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-[#145a2c]/30 bg-green-50/50">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Check size={16} className="text-[#145a2c]" />
              {selectedIds.size} selected
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setBulkMode('approve')}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
              >
                <Check size={14} /> Approve Selected
              </button>
              <button
                onClick={() => setBulkMode('reject')}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-colors"
              >
                <X size={14} /> Reject Selected
              </button>
              <button
                onClick={() => setBulkMode('delete')}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
              >
                <Trash2 size={14} /> Delete Selected
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-card text-center py-12">
            <Zap size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">No {filter !== 'all' ? filter : ''} submissions</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {/* Select All Row */}
            <div className="flex items-center gap-3 px-1">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#145a2c] focus:ring-[#145a2c]/30 cursor-pointer"
                />
                Select All ({filtered.length})
              </label>
            </div>

            {filtered.map((submission) => (
              <div
                key={submission.id}
                className={cn(
                  'admin-card p-5 hover:shadow-md transition-shadow',
                  selectedIds.has(submission.id) && 'ring-2 ring-[#145a2c]/40 border-[#145a2c]/30'
                )}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Checkbox + Content */}
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(submission.id)}
                      onChange={() => toggleSelect(submission.id)}
                      className="w-4 h-4 mt-1 rounded border-gray-300 text-[#145a2c] focus:ring-[#145a2c]/30 cursor-pointer flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-gray-900">{submission.name}</h3>
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap', statusColors[submission.status])}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                        <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{submission.address}, {submission.city}, {submission.state}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium">
                          {submission.operator}
                        </span>
                        {submission.connector_types.map((c) => (
                          <span key={c} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg">
                            {c}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Submitted {timeAgo(submission.created_at)}
                        </span>
                        {submission.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} />
                            {submission.phone}
                          </span>
                        )}
                        {submission.lat && submission.lng && (
                          <span className="text-xs text-gray-400">
                            GPS: {submission.lat.toFixed(4)}, {submission.lng.toFixed(4)}
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
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 sm:items-end flex-shrink-0">
                    {submission.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            handleApprove(submission);
                          }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                        >
                          <Check size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            handleReject(submission);
                          }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${submission.name}"? This cannot be undone.`)) {
                          deleteSingle(submission.id);
                        }
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Modal */}
        {selectedSubmission && actionMode && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900">
                  {actionMode === 'approve' ? 'Approve Submission' : 'Reject Submission'}
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-900 text-sm">{selectedSubmission.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {selectedSubmission.address}, {selectedSubmission.city}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedSubmission.operator} • {selectedSubmission.connector_types.join(', ')}
                </div>
              </div>

              {actionMode === 'approve' ? (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Admin Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any notes about this station..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                  />
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rejection Reason *</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please explain why this submission is being rejected..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Admin Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Internal notes..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {actionMode === 'approve' ? (
                  <button
                    onClick={confirmApprove}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                  >
                    <Check size={14} />
                    Approve & Publish
                  </button>
                ) : (
                  <button
                    onClick={confirmReject}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    <X size={14} />
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {selectedSubmission && !actionMode && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900">Submission Details</h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Station Name</div>
                  <div className="font-semibold text-gray-900">{selectedSubmission.name}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">City</div>
                    <div className="text-sm font-medium text-gray-900">{selectedSubmission.city}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">State</div>
                    <div className="text-sm font-medium text-gray-900">{selectedSubmission.state}</div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Address</div>
                  <div className="text-sm text-gray-900">{selectedSubmission.address}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Operator</div>
                    <div className="text-sm font-medium text-gray-900">{selectedSubmission.operator}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Phone</div>
                    <div className="text-sm text-gray-900">{selectedSubmission.phone || '—'}</div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-2">Connector Types</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubmission.connector_types.map((c) => (
                      <span key={c} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedSubmission.lat && selectedSubmission.lng && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Coordinates</div>
                    <div className="text-sm text-gray-700 font-mono">
                      {selectedSubmission.lat.toFixed(6)}, {selectedSubmission.lng.toFixed(6)}
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedSubmission.lat},${selectedSubmission.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                    >
                      <ExternalLink size={12} />
                      View on Google Maps
                    </a>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {selectedSubmission.status === 'pending' && (
                  <>
                    <button
                      onClick={() => setActionMode('approve')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                      <Check size={14} />
                      Approve
                    </button>
                    <button
                      onClick={() => setActionMode('reject')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                    >
                      <X size={14} />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bulk Confirmation Modal */}
        {bulkMode && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  {bulkMode === 'delete' && <AlertTriangle size={20} className="text-red-500" />}
                  {bulkMode === 'approve' ? 'Approve Selected' : bulkMode === 'reject' ? 'Reject Selected' : 'Delete Selected'}
                </h3>
                <button onClick={() => setBulkMode(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-2">
                You are about to {bulkMode} <strong>{selectedIds.size}</strong> submission(s).
              </p>
              {bulkMode === 'approve' && (
                <p className="text-xs text-gray-500 mb-4">Pending submissions will be published as charging stations. Already approved/rejected submissions will be skipped.</p>
              )}
              {bulkMode === 'reject' && (
                <p className="text-xs text-gray-500 mb-4">Only pending submissions will be rejected with reason &quot;Bulk rejected by admin&quot;.</p>
              )}
              {bulkMode === 'delete' && (
                <p className="text-xs text-red-600 mb-4">This will permanently delete all selected submissions. This action cannot be undone.</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setBulkMode(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={bulkMode === 'approve' ? bulkApprove : bulkMode === 'reject' ? bulkReject : bulkDelete}
                  disabled={bulkProcessing}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60',
                    bulkMode === 'approve' ? 'bg-green-600 hover:bg-green-700' : bulkMode === 'reject' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'
                  )}
                >
                  {bulkProcessing ? <Loader2 size={14} className="animate-spin" /> : bulkMode === 'approve' ? <Check size={14} /> : bulkMode === 'delete' ? <Trash2 size={14} /> : <X size={14} />}
                  {bulkProcessing ? 'Processing...' : `Confirm ${bulkMode === 'delete' ? 'Delete' : bulkMode === 'approve' ? 'Approve' : 'Reject'}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
