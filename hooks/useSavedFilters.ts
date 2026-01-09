import { useState, useEffect, useCallback } from 'react';

export interface SavedFilter {
    id: string;
    name: string;
    filters: {
        searchTerm?: string;
        selectedDesigner?: string;
        dateFilter?: {
            type: 'all' | 'this_week' | 'next_week' | 'custom';
            startDate: string | null;
            endDate: string | null;
        };
        activeTab?: string;
    };
    createdAt: string;
}

const STORAGE_KEY = 'manager-betaki-saved-filters';

export function useSavedFilters() {
    const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setSavedFilters(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading saved filters:', error);
        }
    }, []);

    // Persist to localStorage
    const persistFilters = useCallback((filters: SavedFilter[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
            setSavedFilters(filters);
        } catch (error) {
            console.error('Error saving filters:', error);
        }
    }, []);

    const saveFilter = useCallback((name: string, filters: SavedFilter['filters']) => {
        const newFilter: SavedFilter = {
            id: crypto.randomUUID(),
            name,
            filters,
            createdAt: new Date().toISOString()
        };
        persistFilters([...savedFilters, newFilter]);
        return newFilter;
    }, [savedFilters, persistFilters]);

    const deleteFilter = useCallback((id: string) => {
        persistFilters(savedFilters.filter(f => f.id !== id));
    }, [savedFilters, persistFilters]);

    const updateFilter = useCallback((id: string, updates: Partial<SavedFilter>) => {
        persistFilters(savedFilters.map(f =>
            f.id === id ? { ...f, ...updates } : f
        ));
    }, [savedFilters, persistFilters]);

    return {
        savedFilters,
        saveFilter,
        deleteFilter,
        updateFilter
    };
}

export default useSavedFilters;
