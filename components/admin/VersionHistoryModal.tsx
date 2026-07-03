'use client';

import { useState, useEffect } from 'react';
import { X, History, RotateCcw, User, Calendar, ChevronDown, ChevronUp, Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PricingProfileVersion } from '@/lib/types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string | null;
  profileName: string;
  onRestore: (versionNumber: number) => Promise<void>;
}

const CHARGE_LABELS: Record<string, string> = {
  rto: 'Road Tax',
  insurance: 'Insurance',
  registration: 'Registration',
  hsrp: 'HSRP',
  fastag: 'FASTag',
  handling: 'Handling',
  dealer: 'Dealer Charges',
  delivery: 'Delivery',
  accessories: 'Accessories',
  other: 'Other Charges',
  misc: 'Miscellaneous',
};

export default function VersionHistoryModal({
  isOpen,
  onClose,
  profileId,
  profileName,
  onRestore,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<PricingProfileVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && profileId) {
      fetchVersions();
    }
  }, [isOpen, profileId]);

  const fetchVersions = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/pricing/profiles/${profileId}/versions`);
      if (!response.ok) throw new Error('Failed to fetch versions');
      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionNumber: number) => {
    if (!confirm(`Restore to version ${versionNumber}? This will create a new version with the restored data.`)) return;
    setRestoring(true);
    try {
      await onRestore(versionNumber);
      toast.success(`Restored to version ${versionNumber}`);
      await fetchVersions();
    } catch (err) {
      toast.error('Failed to restore version');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <History size={20} className="text-[#145a2c]" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
              <p className="text-sm text-gray-500">{profileName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-gray-400" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <History size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No version history yet</p>
              <p className="text-sm mt-1">Versions are created when you save changes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div key={version.id} className="border border-gray-200 rounded-lg">
                  {/* Version Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedVersion(expandedVersion === version.version_number ? null : version.version_number)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold',
                        version.version_number === versions[0].version_number
                          ? 'bg-[#145a2c] text-white'
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        v{version.version_number}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Version {version.version_number}
                          {version.version_number === versions[0].version_number && (
                            <span className="ml-2 px-2 py-0.5 bg-[#145a2c] text-white text-xs rounded">Current</span>
                          )}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(version.created_at)}
                          </span>
                          {version.changed_by && (
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              {version.changed_by}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {version.version_number !== versions[0].version_number && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(version.version_number);
                          }}
                          disabled={restoring}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#145a2c] hover:bg-[#145a2c]/10 rounded-lg disabled:opacity-50"
                        >
                          <RotateCcw size={14} />
                          Restore
                        </button>
                      )}
                      {expandedVersion === version.version_number ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Version Details */}
                  {expandedVersion === version.version_number && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      {version.change_description && (
                        <div className="py-3 text-sm text-gray-600 italic">
                          "{version.change_description}"
                        </div>
                      )}
                      <div className="grid sm:grid-cols-2 gap-4 mt-3 text-sm">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-700">Basic Info</h4>
                          <div className="space-y-1 text-gray-600">
                            <p><span className="text-gray-400">Name:</span> {version.snapshot.name}</p>
                            <p><span className="text-gray-400">Status:</span> {version.snapshot.status}</p>
                            <p><span className="text-gray-400">Vehicle Category:</span> {version.snapshot.vehicle_category}</p>
                            {version.snapshot.description && (
                              <p><span className="text-gray-400">Description:</span> {version.snapshot.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-700">Charges</h4>
                          <div className="space-y-1 text-gray-600">
                            {version.snapshot.show_rto && (
                              <p><span className="text-gray-400">{CHARGE_LABELS.rto}:</span> {version.snapshot.rto_percentage}%</p>
                            )}
                            {version.snapshot.show_insurance && (
                              <p><span className="text-gray-400">{CHARGE_LABELS.insurance}:</span> {version.snapshot.insurance_percentage}%</p>
                            )}
                            {version.snapshot.show_registration && (
                              <p><span className="text-gray-400">{CHARGE_LABELS.registration}:</span> Rs. {version.snapshot.registration_fee?.toLocaleString()}</p>
                            )}
                            {version.snapshot.show_hsrp && (
                              <p><span className="text-gray-400">{CHARGE_LABELS.hsrp}:</span> Rs. {version.snapshot.hsrp_fee?.toLocaleString()}</p>
                            )}
                            {version.snapshot.show_fastag && (
                              <p><span className="text-gray-400">{CHARGE_LABELS.fastag}:</span> Rs. {version.snapshot.fastag_fee?.toLocaleString()}</p>
                            )}
                          </div>
                        </div>

                        {version.snapshot.has_subsidy && (
                          <div className="space-y-2 sm:col-span-2">
                            <h4 className="font-semibold text-gray-700">Subsidy</h4>
                            <div className="space-y-1 text-gray-600">
                              <p>
                                <span className="text-gray-400">{version.snapshot.subsidy_title || 'Subsidy'}:</span>{' '}
                                {version.snapshot.subsidy_type === 'percentage'
                                  ? `${version.snapshot.subsidy_value}%`
                                  : `Rs. ${version.snapshot.subsidy_value?.toLocaleString()}`}
                              </p>
                              {version.snapshot.subsidy_description && (
                                <p className="italic">{version.snapshot.subsidy_description}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
