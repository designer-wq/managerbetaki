import { useState, useCallback } from 'react';

interface UseBulkSelectionOptions<T> {
    items: T[];
    getItemId: (item: T) => string;
    visibleItems?: T[]; // Items currently visible on the page (for pagination)
}

interface UseBulkSelectionReturn {
    selectedIds: Set<string>;
    isSelected: (id: string) => boolean;
    toggleSelection: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    toggleSelectAll: () => void;
    isAllSelected: boolean;
    isAllVisibleSelected: boolean;
    selectedCount: number;
    getSelectedItems: <I>(items: I[], getId: (item: I) => string) => I[];
    setVisibleItems: (items: any[]) => void;
}

export function useBulkSelection<T>({ items, getItemId, visibleItems: initialVisibleItems }: UseBulkSelectionOptions<T>): UseBulkSelectionReturn {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [visibleItems, setVisibleItemsState] = useState<T[]>(initialVisibleItems || []);

    const setVisibleItems = useCallback((items: T[]) => {
        setVisibleItemsState(items);
    }, []);

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
        // Select only visible items when paginated
        const itemsToSelect = visibleItems.length > 0 ? visibleItems : items;
        const allIds = itemsToSelect.map(getItemId);
        setSelectedIds(prev => {
            const next = new Set(prev);
            allIds.forEach(id => next.add(id));
            return next;
        });
    }, [items, visibleItems, getItemId]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const toggleSelectAll = useCallback(() => {
        // Use visible items for toggle logic
        const itemsToCheck = visibleItems.length > 0 ? visibleItems : items;
        const allVisibleIds = itemsToCheck.map(getItemId);
        const allVisibleSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.has(id));

        if (allVisibleSelected) {
            // Deselect only visible items
            setSelectedIds(prev => {
                const next = new Set(prev);
                allVisibleIds.forEach(id => next.delete(id));
                return next;
            });
        } else {
            selectAll();
        }
    }, [items, visibleItems, getItemId, selectedIds, selectAll]);

    // Check if all items are selected
    const isAllSelected = items.length > 0 && items.every(item => selectedIds.has(getItemId(item)));

    // Check if all visible items are selected
    const itemsToCheck = visibleItems.length > 0 ? visibleItems : items;
    const isAllVisibleSelected = itemsToCheck.length > 0 && itemsToCheck.every(item => selectedIds.has(getItemId(item)));

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
        isAllVisibleSelected,
        selectedCount,
        getSelectedItems,
        setVisibleItems
    };
}

export default useBulkSelection;

