import { useState, useCallback, useMemo } from 'react';

export interface PaginationState {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export interface UsePaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
    totalItems?: number;
}

export interface UsePaginationReturn {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    isFirstPage: boolean;
    isLastPage: boolean;
    startIndex: number;
    endIndex: number;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setTotalItems: (total: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    firstPage: () => void;
    lastPage: () => void;
    getPageRange: () => { from: number; to: number };
}

export const usePagination = (options: UsePaginationOptions = {}): UsePaginationReturn => {
    const {
        initialPage = 1,
        initialPageSize = 20,
        totalItems: initialTotalItems = 0
    } = options;

    const [page, setPageState] = useState(initialPage);
    const [pageSize, setPageSizeState] = useState(initialPageSize);
    const [totalItems, setTotalItems] = useState(initialTotalItems);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(totalItems / pageSize));
    }, [totalItems, pageSize]);

    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const isFirstPage = page === 1;
    const isLastPage = page >= totalPages;

    // Indices for slicing (0-indexed)
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize - 1, totalItems - 1);

    const setPage = useCallback((newPage: number) => {
        const validPage = Math.max(1, Math.min(newPage, totalPages));
        setPageState(validPage);
    }, [totalPages]);

    const setPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        setPageState(1); // Reset to first page when changing page size
    }, []);

    const nextPage = useCallback(() => {
        if (hasNextPage) setPage(page + 1);
    }, [hasNextPage, page, setPage]);

    const prevPage = useCallback(() => {
        if (hasPrevPage) setPage(page - 1);
    }, [hasPrevPage, page, setPage]);

    const firstPage = useCallback(() => {
        setPage(1);
    }, [setPage]);

    const lastPage = useCallback(() => {
        setPage(totalPages);
    }, [setPage, totalPages]);

    // For Supabase .range(from, to)
    const getPageRange = useCallback(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        return { from, to };
    }, [page, pageSize]);

    return {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage,
        hasPrevPage,
        isFirstPage,
        isLastPage,
        startIndex,
        endIndex,
        setPage,
        setPageSize,
        setTotalItems,
        nextPage,
        prevPage,
        firstPage,
        lastPage,
        getPageRange
    };
};

export default usePagination;
