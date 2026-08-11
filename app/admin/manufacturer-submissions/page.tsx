'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Package, Check, X, Clock, Loader as Loader2, Eye,
  Building2, Globe, Mail, Phone, MapPin, Calendar, User,
  FileSpreadsheet, AlertCircle, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/format';
import { slugify } from '@/lib/format';

interface ManufacturerSubmission {
  id: string;
  company_name: string;
  slug: string;
  logo_url: string;
  hero_image_url: string;
  description: string;
  country: string;
  founded_year: number | null;
  headquarters: string;
  website: string;
  total_models: number | null;
  contact_person: string;
  contact_email: string;
  support_phone: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface VehicleSubmission {
  id: string;
  manufacturer_submission_id: string | null;
  company_name: string;
  vehicles: any[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

type TabFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function ManufacturerSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ManufacturerSubmission[]>([]);
  const [vehicleSubs, setVehicleSubs] = useState<Record<string, VehicleSubmission>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ManufacturerSubmission | null>(null);
  const [actionMode, setActionMode] = useState<'approve' | 'reject' | 'view' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<TabFilter>('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('manufacturer_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSubmissions(data as ManufacturerSubmission[]);

      const { data: vData } = await supabase
        .from('vehicle_submissions')
        .select('*')
        .in('manufacturer_submission_id', data.map(d => d.id));

      if (vData) {
        const map: Record<string, VehicleSubmission> = {};
        vData.forEach(v => {
          if (v.manufacturer_submission_id) map[v.manufacturer_submission_id] = v as VehicleSubmission;
        });
        setVehicleSubs(map);
      }
    }
    setLoading(false);
  };

  const openAction = (submission: ManufacturerSubmission, mode: 'approve' | 'reject' | 'view') => {
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
      let slug = selected.slug || slugify(selected.company_name);

      const { data: existing } = await supabase
        .from('manufacturers')
        .select('id, slug')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      const mfgData = {
        name: selected.company_name,
        slug,
        logo_url: selected.logo_url || '',
        hero_image_url: selected.hero_image_url || '',
        description: selected.description || '',
        country: selected.country || 'India',
        founded_year: selected.founded_year,
        headquarters: selected.headquarters || '',
        website: selected.website || '',
        total_models: selected.total_models || 0,
        contact_email: selected.contact_email || '',
        support_phone: selected.support_phone || '',
        status: 'active',
        show_on_homepage: false,
        is_featured: false,
      };

      const { data: created, error: mfgError } = await supabase
        .from('manufacturers')
        .insert([mfgData])
        .select('id')
        .maybeSingle();

      if (mfgError) throw mfgError;
      if (!created) throw new Error('Failed to create manufacturer');

      const { error: updateError } = await supabase
        .from('manufacturer_submissions')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selected.id);

      if (updateError) throw updateError;

      const vehicleSub = vehicleSubs[selected.id];
      if (vehicleSub && vehicleSub.vehicles.length > 0) {
        const vehicleRows = vehicleSub.vehicles.map((v: any) => ({
          ...v,
          manufacturer_id: created.id,
          slug: v.slug || slugify(v.name),
        }));

        const { error: vError } = await supabase
          .from('vehicles')
          .insert(vehicleRows);

        if (vError) {
          console.error('Vehicle insert error:', vError);
          toast.warning('Manufacturer approved, but some vehicles failed to import');
        } else {
          await supabase
            .from('vehicle_submissions')
            .update({ status: 'approved' })
            .eq('id', vehicleSub.id);
        }
      }

      toast.success('Manufacturer approved and published');
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
        .from('manufacturer_submissions')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selected.id);

      if (error) throw error;

      toast.success('Submission rejected');
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
              <Package size={28} className="text-[#145a2c]" />
              Manufacturer Submissions
            </h1>
            <p className="admin-subtitle">Review and approve company registration requests</p>
          </div>
        </div>

        {/* Filter Tabs */}
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
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600">No {filter !== 'all' ? filter : ''} submissions</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((submission) => {
              const vSub = vehicleSubs[submission.id];
              return (
                <div key={submission.id} className="admin-card p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          {submission.logo_url ? (
                            <img src={submission.logo_url} alt={submission.company_name} className="w-12 h-12 rounded-lg object-cover bg-gray-50" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[#145a2c]/10 flex items-center justify-center">
                              <Building2 size={20} className="text-[#145a2c]" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-gray-900">{submission.company_name}</h3>
                            <p className="text-xs text-gray-500">{submission.country} {submission.headquarters && `\u2022 ${submission.headquarters}`}</p>
                          </div>
                        </div>
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap', statusColors[submission.status])}>
                          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                        </span>
                      </div>

                      {submission.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{submission.description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                        {submission.website && (
                          <span className="flex items-center gap-1.5"><Globe size={12} /> {submission.website.replace(/^https?:\/\//, '')}</span>
                        )}
                        {submission.contact_email && (
                          <span className="flex items-center gap-1.5"><Mail size={12} /> {submission.contact_email}</span>
                        )}
                        {submission.support_phone && (
                          <span className="flex items-center gap-1.5"><Phone size={12} /> {submission.support_phone}</span>
                        )}
                        {submission.founded_year && (
                          <span className="flex items-center gap-1.5"><Calendar size={12} /> Founded {submission.founded_year}</span>
                        )}
                        {vSub && (
                          <span className="flex items-center gap-1.5 text-green-600 font-medium">
                            <FileSpreadsheet size={12} /> {vSub.vehicles.length} vehicle(s)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> Submitted {timeAgo(submission.created_at)}
                        </span>
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
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
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
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && actionMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-lg text-gray-900">
                {actionMode === 'approve' ? 'Approve Manufacturer' : actionMode === 'reject' ? 'Reject Submission' : 'Submission Details'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Company header */}
              <div className="flex items-center gap-4">
                {selected.logo_url ? (
                  <img src={selected.logo_url} alt={selected.company_name} className="w-16 h-16 rounded-xl object-cover bg-gray-50" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[#145a2c]/10 flex items-center justify-center">
                    <Building2 size={28} className="text-[#145a2c]" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{selected.company_name}</h4>
                  <p className="text-sm text-gray-500">{selected.country} {selected.headquarters && `\u2022 ${selected.headquarters}`}</p>
                  <span className={cn('inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full', statusColors[selected.status])}>
                    {selected.status}
                  </span>
                </div>
              </div>

              {selected.hero_image_url && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Hero Banner</p>
                  <img src={selected.hero_image_url} alt="Hero" className="w-full h-32 object-cover rounded-xl" />
                </div>
              )}

              {selected.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-sm text-gray-700">{selected.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <DetailField icon={Globe} label="Website" value={selected.website} />
                <DetailField icon={Calendar} label="Founded" value={selected.founded_year ? String(selected.founded_year) : ''} />
                <DetailField icon={User} label="Contact Person" value={selected.contact_person} />
                <DetailField icon={Mail} label="Email" value={selected.contact_email} />
                <DetailField icon={Phone} label="Phone" value={selected.support_phone} />
                <DetailField icon={MapPin} label="Address" value={selected.address} />
              </div>

              {/* Vehicle submissions */}
              {vehicleSubs[selected.id] && (
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-3">
                    <FileSpreadsheet size={16} />
                    Submitted Vehicles ({vehicleSubs[selected.id].vehicles.length})
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {vehicleSubs[selected.id].vehicles.map((v: any, i: number) => (
                      <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-xs">
                        <span className="font-medium text-gray-900">{v.name}</span>
                        <span className="text-gray-500 capitalize">{v.type} {'\u2022'} {v.range_km} km</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {actionMode === 'view' && selected.rejection_reason && (
                <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  <strong>Rejection Reason:</strong> {selected.rejection_reason}
                </div>
              )}
              {actionMode === 'view' && selected.admin_notes && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <strong>Admin Notes:</strong> {selected.admin_notes}
                </div>
              )}

              {actionMode !== 'view' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Notes (optional)</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal notes about this submission..."
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
                        placeholder="Explain why this submission is being rejected..."
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#145a2c]/20 focus:border-[#145a2c]"
                      />
                    </div>
                  )}

                  {actionMode === 'approve' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                      <AlertCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-700">
                        <p className="font-semibold mb-1">This will create a new manufacturer in the system.</p>
                        <p className="text-xs">The manufacturer will appear in the public listing. Any submitted vehicles will also be published.</p>
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

function DetailField({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 font-medium">{value}</p>
      </div>
    </div>
  );
}
