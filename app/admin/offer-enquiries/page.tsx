'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { OfferEnquiry } from '@/lib/types';
import { ShoppingBag, Loader as Loader2, Search, MapPin, Phone, Mail, Calendar, Clock, Globe, MessageSquare, ChevronDown, X, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Circle as XCircle, Filter, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';

export default function OfferEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<OfferEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<OfferEnquiry | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchEnquiries();
  }, [statusFilter]);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('offer_enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEnquiries((data || []) as OfferEnquiry[]);
    } catch (err: any) {
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: OfferEnquiry['status'], notes?: string) => {
    setUpdating(true);
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (notes !== undefined) updateData.notes = notes;

      const { error } = await supabase
        .from('offer_enquiries')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      toast.success('Status updated');
      fetchEnquiries();
      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status, notes: notes || selectedEnquiry.notes });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const filteredEnquiries = enquiries.filter(e => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      e.vehicle_name.toLowerCase().includes(searchLower) ||
      e.name.toLowerCase().includes(searchLower) ||
      e.email.toLowerCase().includes(searchLower) ||
      e.phone.includes(search) ||
      e.city.toLowerCase().includes(searchLower)
    );
  });

  const getStatusConfig = (status: OfferEnquiry['status']) => {
    const configs = {
      pending: { color: 'bg-amber-100 text-amber-800', icon: Clock, label: 'Pending' },
      contacted: { color: 'bg-blue-100 text-blue-800', icon: MessageSquare, label: 'Contacted' },
      converted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Converted' },
      closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Closed' },
    };
    return configs[status];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title flex items-center gap-3">
              <ShoppingBag size={28} className="text-orange-600" />
              Offer Enquiries
            </h1>
            <p className="admin-subtitle">
              Manage vehicle offer enquiries from customers
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{enquiries.length}</p>
          </div>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
            <p className="text-sm text-amber-600">Pending</p>
            <p className="text-2xl font-bold text-amber-700">
              {enquiries.filter(e => e.status === 'pending').length}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <p className="text-sm text-blue-600">Contacted</p>
            <p className="text-2xl font-bold text-blue-700">
              {enquiries.filter(e => e.status === 'contacted').length}
            </p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-100 p-4">
            <p className="text-sm text-green-600">Converted</p>
            <p className="text-2xl font-bold text-green-700">
              {enquiries.filter(e => e.status === 'converted').length}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="admin-search-toolbar">
          <div className="admin-search-field">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, vehicle, or city..."
              className="admin-input pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Enquiries List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No enquiries found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Desktop Table */}
            <table className="hidden md:table w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Vehicle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">City</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Date</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnquiries.map((enquiry) => {
                  const statusConfig = getStatusConfig(enquiry.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={enquiry.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{enquiry.vehicle_name}</p>
                        {enquiry.variant_name && (
                          <p className="text-xs text-gray-500">{enquiry.variant_name}</p>
                        )}
                        <p className="text-xs text-green-600 font-medium">
                          {enquiry.vehicle_price ? formatPrice(enquiry.vehicle_price) : 'N/A'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{enquiry.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{enquiry.email}</p>
                        <p className="text-sm text-gray-600">{enquiry.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{enquiry.city}</p>
                        {enquiry.ip_city && enquiry.ip_city !== enquiry.city && (
                          <p className="text-xs text-gray-400">IP: {enquiry.ip_city}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', statusConfig.color)}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{formatDate(enquiry.created_at)}</p>
                        {enquiry.ip_address && (
                          <p className="text-xs text-gray-400">IP: {enquiry.ip_address}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedEnquiry(enquiry)}
                          className="text-[#145a2c] text-sm font-medium hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredEnquiries.map((enquiry) => {
                const statusConfig = getStatusConfig(enquiry.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div key={enquiry.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{enquiry.vehicle_name}</p>
                        <p className="text-xs text-gray-500">{formatDate(enquiry.created_at)}</p>
                      </div>
                      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', statusConfig.color)}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Name</p>
                        <p className="text-gray-900">{enquiry.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="text-gray-900">{enquiry.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Email</p>
                        <p className="text-gray-900 truncate">{enquiry.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">City</p>
                        <p className="text-gray-900">{enquiry.city}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEnquiry(enquiry)}
                      className="w-full text-center text-[#145a2c] font-medium text-sm py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedEnquiry(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Enquiry Details</h2>
              <button onClick={() => setSelectedEnquiry(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Vehicle */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                <p className="font-bold text-gray-900 text-lg">{selectedEnquiry.vehicle_name}</p>
                {selectedEnquiry.variant_name && (
                  <p className="text-sm text-gray-600">{selectedEnquiry.variant_name}</p>
                )}
                {selectedEnquiry.vehicle_price && (
                  <p className="text-xl font-bold text-green-600 mt-2">
                    {formatPrice(selectedEnquiry.vehicle_price)}
                  </p>
                )}
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{selectedEnquiry.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{selectedEnquiry.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Mail size={16} className="text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-gray-900 truncate">{selectedEnquiry.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">City</p>
                      <p className="font-medium text-gray-900">{selectedEnquiry.city}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedEnquiry.message && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Message</h3>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{selectedEnquiry.message}</p>
                </div>
              )}

              {/* IP & Location */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Location & Device</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">IP Address</p>
                      <p className="font-medium text-gray-900">{selectedEnquiry.ip_address || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Detected City</p>
                    <p className="font-medium text-gray-900">{selectedEnquiry.ip_city || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Detected State</p>
                    <p className="font-medium text-gray-900">{selectedEnquiry.ip_state || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Country</p>
                    <p className="font-medium text-gray-900">{selectedEnquiry.ip_country || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Update Status</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(['pending', 'contacted', 'converted', 'closed'] as const).map((status) => {
                    const config = getStatusConfig(status);
                    const Icon = config.icon;
                    return (
                      <button
                        key={status}
                        onClick={() => updateStatus(selectedEnquiry.id, status)}
                        disabled={updating}
                        className={cn(
                          'flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border-2 transition-all',
                          selectedEnquiry.status === status
                            ? 'border-current bg-current/10'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                          config.color,
                          updating && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <Icon size={16} />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
                <textarea
                  defaultValue={selectedEnquiry.notes || ''}
                  placeholder="Add notes about this enquiry..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#145a2c]"
                  onBlur={(e) => {
                    if (e.target.value !== (selectedEnquiry.notes || '')) {
                      updateStatus(selectedEnquiry.id, selectedEnquiry.status, e.target.value || undefined);
                    }
                  }}
                />
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
                Enquired on {formatDate(selectedEnquiry.created_at)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
