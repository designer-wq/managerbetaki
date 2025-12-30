import { useState, useCallback } from 'react';

interface UseBulkSelectionOptions<T> {
    items: T[];
    getItemId: (item: T) => string;
}

interface UseBulkSelectionReturn {
    selectedIds: Set<string>;
    isSelected: (id: string) => boolean;
    toggleSelection: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    toggleSelectAll: () => void;
    isAllSelected: boolean;
    selectedCount: number;
    getSelectedItems: <T>(items: T[], getId: (item: T) => string) => T[];
}

export function useBulkSelection<T>({ items, getItemId }: UseBulkSelectionOptions<T>): UseBulkSelectionReturn {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        const allIds = items.map(getItemId);
        setSelectedIds(new Set(allIds));
    }, [items, getItemId]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const toggleSelectAll = useCallback(() => {
        const allIds = items.map(getItemId);
        const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));

        if (allSelected) {
            clearSelection();
        } else {
            selectAll();
        }
    }, [items, getItemId, selectedIds, selectAll, clearSelection]);

    const isAllSelected = items.length > 0 && items.every(item => selectedIds.has(getItemId(item)));
    const selectedCount = selectedIds.size;

    const getSelectedItems = useCallback(<I,>(allItems: I[], getId: (item: I) => string): I[] => {
        return allItems.filter(item => selectedIds.has(getId(item)));
    }, [selectedIds]);

    return {
        selectedIds,
        isSelected,
        toggleSelection,
        selectAll,
        clearSelection,
        toggleSelectAll,
        isAllSelected,
        selectedCount,
        getSelectedItems
    };
}

export default useBulkSelection;
