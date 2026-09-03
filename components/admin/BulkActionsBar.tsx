'use client';

import { Loader as Loader2, Trash2, Power, Eye, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUnpublish?: () => void;
  onSetStatus?: (status: string) => void;
  deleting?: boolean;
  customActions?: { label: string; onClick: () => void; icon?: React.ReactNode; variant?: 'default' | 'danger' }[];
}

export default function BulkActionsBar({
  selectedCount,
  onClear,
  onDelete,
  onPublish,
  onArchive,
  onUnpublish,
  onSetStatus,
  deleting,
  customActions,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#145a2c]/5 border border-[#145a2c]/20 rounded-lg">
      <span className="text-sm font-medium text-[#145a2c]">
        {selectedCount} selected
      </span>

      <div className="h-4 w-px bg-gray-300" />

      <div className="flex items-center gap-2">
        {onPublish && (
          <button
            onClick={onPublish}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <Power size={13} /> Publish
          </button>
        )}
        {onUnpublish && (
          <button
            onClick={onUnpublish}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <Power size={13} /> Unpublish
          </button>
        )}
        {onArchive && (
          <button
            onClick={onArchive}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Eye size={13} /> Archive
          </button>
        )}
        {onSetStatus && (
          <select
            onChange={(e) => { if (e.target.value) { onSetStatus(e.target.value); e.target.value = ''; } }}
            defaultValue=""
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#145a2c]"
          >
            <option value="">Set status…</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Delete
          </button>
        )}
        {customActions?.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              action.variant === 'danger'
                ? 'text-red-700 bg-red-50 hover:bg-red-100'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      <button
        onClick={onClear}
        className="ml-auto p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
        title="Clear selection"
      >
        <X size={16} />
      </button>
    </div>
  );
}
