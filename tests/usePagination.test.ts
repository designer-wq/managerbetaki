import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../hooks/usePagination';

describe('usePagination', () => {
    describe('initialization', () => {
        it('should initialize with default values', () => {
            const { result } = renderHook(() => usePagination());

            expect(result.current.page).toBe(1);
            expect(result.current.pageSize).toBe(20);
            expect(result.current.totalItems).toBe(0);
            expect(result.current.totalPages).toBe(1);
        });

        it('should initialize with custom values', () => {
            const { result } = renderHook(() =>
                usePagination({ initialPage: 3, initialPageSize: 10, totalItems: 100 })
            );

            expect(result.current.page).toBe(3);
            expect(result.current.pageSize).toBe(10);
            expect(result.current.totalItems).toBe(100);
            expect(result.current.totalPages).toBe(10);
        });
    });

    describe('navigation', () => {
        it('should navigate to next page', () => {
            const { result } = renderHook(() =>
                usePagination({ totalItems: 100, initialPageSize: 10 })
            );

            act(() => {
                result.current.nextPage();
            });

            expect(result.current.page).toBe(2);
        });

        it('should navigate to previous page', () => {
            const { result } = renderHook(() =>
                usePagination({ initialPage: 3, totalItems: 100, initialPageSize: 10 })
            );

            act(() => {
                result.current.prevPage();
            });

            expect(result.current.page).toBe(2);
        });

        it('should not navigate past last page', () => {
            const { result } = renderHook(() =>
                usePagination({ initialPage: 10, totalItems: 100, initialPageSize: 10 })
            );

            act(() => {
                result.current.nextPage();
            });

            expect(result.current.page).toBe(10);
        });

        it('should not navigate before first page', () => {
            const { result } = renderHook(() => usePagination());

            act(() => {
                result.current.prevPage();
            });

            expect(result.current.page).toBe(1);
        });

        it('should navigate to first page', () => {
            const { result } = renderHook(() =>
                usePagination({ initialPage: 5, totalItems: 100, initialPageSize: 10 })
            );

            act(() => {
                result.current.firstPage();
            });

            expect(result.current.page).toBe(1);
        });

        it('should navigate to last page', () => {
            const { result } = renderHook(() =>
                usePagination({ totalItems: 100, initialPageSize: 10 })
            );

            act(() => {
                result.current.lastPage();
            });

            expect(result.current.page).toBe(10);
        });
    });

    describe('page status', () => {
        it('should correctly report hasNextPage and hasPrevPage', () => {
            const { result } = renderHook(() =>
                usePagination({ initialPage: 5, totalItems: 100, initialPageSize: 10 })
            );

            expect(result.current.hasNextPage).toBe(true);
            expect(result.current.hasPrevPage).toBe(true);
            expect(result.current.isFirstPage).toBe(false);
            expect(result.current.isLastPage).toBe(false);
        });

        it('should report isFirstPage correctly', () => {
            const { result } = renderHook(() =>
                usePagination({ totalItems: 100, initialPageSize: 10 })
            );

            expect(result.current.isFirstPage).toBe(true);
            expect(result.current.hasPrevPage).toBe(false);
        });

        it('should report isLastPage correctly', () => {
            const { result } = renderHook(() =>
                usePagination({ initialPage: 10, totalItems: 100, initialPageSize: 10 })
            );

            expect(result.current.isLastPage).toBe(true);
            expect(result.current.hasNextPage).toBe(false);
        });
    });

    describe('getPageRange', () => {
        it('should return correct range for Supabase', () => {
            const { result } = renderHook(() =>
                usePagination({ initialPage: 2, initialPageSize: 10 })
            );

            const range = result.current.getPageRange();

            expect(range.from).toBe(10);
            expect(range.to).toBe(19);
        });

        it('should return correct range for first page', () => {
            const { result } = renderHook(() =>
                usePagination({ initialPageSize: 20 })
            );

            const range = result.current.getPageRange();

            expect(range.from).toBe(0);
            expect(range.to).toBe(19);
        });
    });

    describe('page size change', () => {
        it('should reset to first page when changing page size', () => {
            const { result } = renderHook(() =>
                usePagination({ initialPage: 5, totalItems: 100, initialPageSize: 10 })
            );

            act(() => {
                result.current.setPageSize(20);
            });

            expect(result.current.page).toBe(1);
            expect(result.current.pageSize).toBe(20);
        });
    });
});
