import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
    page: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    showPageSizeSelector?: boolean;
    pageSizeOptions?: number[];
    className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
    page,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    showPageSizeSelector = true,
    pageSizeOptions = [10, 20, 50, 100],
    className = ''
}) => {
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        const showPages = 5; // Number of page buttons to show

        if (totalPages <= showPages) {
            // Show all pages
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Show first, last, and pages around current
            if (page <= 3) {
                pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
            } else if (page >= totalPages - 2) {
                pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages);
            }
        }

        return pages;
    };

    const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalItems);

    return (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 ${className}`}>
            {/* Info */}
            <div className="text-sm text-zinc-400 order-2 sm:order-1">
                Mostrando <span className="font-medium text-white">{startItem}</span> a{' '}
                <span className="font-medium text-white">{endItem}</span> de{' '}
                <span className="font-medium text-white">{totalItems}</span> resultados
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 order-1 sm:order-2">
                {/* Page Size Selector */}
                {showPageSizeSelector && onPageSizeChange && (
                    <div className="hidden sm:flex items-center gap-2 mr-4">
                        <span className="text-xs text-zinc-500">Por página:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center gap-1">
                    {/* First Page */}
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={!hasPrevPage}
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Primeira página"
                    >
                        <ChevronsLeft size={18} />
                    </button>

                    {/* Previous Page */}
                    <button
                        onClick={() => onPageChange(page - 1)}
                        disabled={!hasPrevPage}
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Página anterior"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    {/* Page Numbers */}
                    <div className="hidden sm:flex items-center gap-1 mx-1">
                        {getPageNumbers().map((p, i) => (
                            p === 'ellipsis' ? (
                                <span key={`ellipsis-${i}`} className="px-2 text-zinc-500">...</span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => onPageChange(p)}
                                    className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${p === page
                                            ? 'bg-primary text-black'
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                        }`}
                                >
                                    {p}
                                </button>
                            )
                        ))}
                    </div>

                    {/* Mobile Page Indicator */}
                    <span className="sm:hidden px-3 text-sm text-zinc-400">
                        {page} / {totalPages}
                    </span>

                    {/* Next Page */}
                    <button
                        onClick={() => onPageChange(page + 1)}
                        disabled={!hasNextPage}
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Próxima página"
                    >
                        <ChevronRight size={18} />
                    </button>

                    {/* Last Page */}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={!hasNextPage}
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Última página"
                    >
                        <ChevronsRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
