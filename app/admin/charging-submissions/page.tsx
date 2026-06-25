'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Zap, Check, X, Clock, Loader as Loader2, ExternalLink, Phone, Eye } from 'lucide-react';
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

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function ChargingSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ChargingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ChargingSubmission | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

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
      // First create the charging station from the submission
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

      // Update submission status
      const { error: updateError } = await supabase
        .from('charging_submissions')
        .update({ status: 'approved', admin_notes: notes || null })
        .eq('id', selectedSubmission.id);

      if (updateError) throw updateError;

      toast.success('Station approved and published');
      setSubmissions(prev => prev.filter(s => s.id !== selectedSubmission.id));
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
      setSubmissions(prev => prev.filter(s => s.id !== selectedSubmission.id));
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

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="admin-card text-center py-12">
            <Zap size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">No pending submissions</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="admin-card p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900">{submission.name}</h3>
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', statusColors[submission.status])}>
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                      <MapPin size={14} className="text-gray-400" />
                      {submission.address}, {submission.city}, {submission.state}
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

                  {submission.status === 'pending' && (
                    <div className="flex sm:flex-col gap-2 sm:items-end">
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
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </div>
                  )}
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
      </div>
    </div>
  );
}
