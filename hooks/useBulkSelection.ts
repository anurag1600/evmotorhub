'use client';

import { useState, useCallback, useMemo } from 'react';

export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === items.length && items.length > 0) {
        return new Set();
      }
      return new Set(items.map(i => i.id));
    });
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const isAllSelected = useMemo(() =>
    items.length > 0 && selectedIds.size === items.length,
    [items.length, selectedIds]
  );

  const isPartialSelected = useMemo(() =>
    selectedIds.size > 0 && selectedIds.size < items.length,
    [items.length, selectedIds]
  );

  const selectedItems = useMemo(() =>
    items.filter(i => selectedIds.has(i.id)),
    [items, selectedIds]
  );

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartialSelected,
    selectedItems,
  };
}
