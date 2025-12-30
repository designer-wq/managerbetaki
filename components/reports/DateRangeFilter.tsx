import React, { useState } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { getTodaySP, getSaoPauloDate } from '../../lib/timezone';

export type DateFilterType = 'all' | 'today' | '7d' | '30d' | 'this_month' | 'last_month' | 'quarter' | 'year' | 'custom';

export interface DateRange {
    type: DateFilterType;
    startDate: string | null;
    endDate: string | null;
    label: string;
}

interface DateRangeFilterProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
    className?: string;
}

const PRESET_OPTIONS: { type: DateFilterType; label: string }[] = [
    { type: 'all', label: 'Todo o Período' },
    { type: 'today', label: 'Hoje' },
    { type: '7d', label: 'Últimos 7 dias' },
    { type: '30d', label: 'Últimos 30 dias' },
    { type: 'this_month', label: 'Este Mês' },
    { type: 'last_month', label: 'Mês Anterior' },
    { type: 'quarter', label: 'Último Trimestre' },
    { type: 'year', label: 'Este Ano' },
    { type: 'custom', label: 'Personalizado' },
];

// Helper function to format date to YYYY-MM-DD in local timezone
const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getDateRangeFromType = (type: DateFilterType, customStart?: string, customEnd?: string): DateRange => {
    // Use São Paulo timezone for date calculations
    const now = getSaoPauloDate();
    const today = getTodaySP();

    switch (type) {
        case 'today':
            return { type, startDate: today, endDate: today, label: 'Hoje' };

        case '7d': {
            const start = new Date(now);
            start.setDate(start.getDate() - 7);
            return { type, startDate: formatLocalDate(start), endDate: today, label: 'Últimos 7 dias' };
        }

        case '30d': {
            const start = new Date(now);
            start.setDate(start.getDate() - 30);
            return { type, startDate: formatLocalDate(start), endDate: today, label: 'Últimos 30 dias' };
        }

        case 'this_month': {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return { type, startDate: formatLocalDate(start), endDate: today, label: 'Este Mês' };
        }

        case 'last_month': {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return { type, startDate: formatLocalDate(start), endDate: formatLocalDate(end), label: 'Mês Anterior' };
        }

        case 'quarter': {
            const start = new Date(now);
            start.setMonth(start.getMonth() - 3);
            return { type, startDate: formatLocalDate(start), endDate: today, label: 'Último Trimestre' };
        }

        case 'year': {
            const start = new Date(now.getFullYear(), 0, 1);
            return { type, startDate: formatLocalDate(start), endDate: today, label: 'Este Ano' };
        }

        case 'custom':
            return {
                type,
                startDate: customStart || null,
                endDate: customEnd || null,
                label: customStart && customEnd ? `${formatDate(customStart)} - ${formatDate(customEnd)}` : 'Personalizado'
            };

        case 'all':
        default:
            return { type: 'all', startDate: null, endDate: null, label: 'Todo o Período' };
    }
};

const formatDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(2)}`;
};

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customStart, setCustomStart] = useState(value.startDate || '');
    const [customEnd, setCustomEnd] = useState(value.endDate || '');
    const [showCustom, setShowCustom] = useState(value.type === 'custom');

    const handleSelect = (type: DateFilterType) => {
        if (type === 'custom') {
            setShowCustom(true);
        } else {
            setShowCustom(false);
            onChange(getDateRangeFromType(type));
            setIsOpen(false);
        }
    };

    const applyCustomRange = () => {
        if (customStart && customEnd) {
            onChange(getDateRangeFromType('custom', customStart, customEnd));
            setIsOpen(false);
        }
    };

    const clearFilter = () => {
        onChange(getDateRangeFromType('all'));
        setIsOpen(false);
        setShowCustom(false);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Trigger Button Container */}
            <div className="flex items-center">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${value.type !== 'all'
                        ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600'
                        }`}
                >
                    <Calendar size={16} />
                    <span>{value.label}</span>
                    <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {value.type !== 'all' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            clearFilter();
                        }}
                        className="ml-1 p-1.5 rounded-full bg-zinc-800/50 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Limpar filtro"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Invisible overlay to close dropdown when clicking outside */}
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />
                    {/* Dropdown Panel - with solid opaque background */}
                    <div
                        className="absolute left-0 top-full mt-2 w-72 rounded-xl shadow-2xl z-[101] border border-zinc-700"
                        style={{ backgroundColor: '#18181b' }}
                    >
                        {/* Preset Options */}
                        <div className="p-2 border-b border-zinc-800" style={{ backgroundColor: '#18181b' }}>
                            <p className="text-xs text-zinc-500 font-medium px-2 py-1 uppercase tracking-wider">Períodos Pré-definidos</p>
                            <div className="grid grid-cols-2 gap-1 mt-1">
                                {PRESET_OPTIONS.filter(o => o.type !== 'custom').map((option) => (
                                    <button
                                        key={option.type}
                                        onClick={() => handleSelect(option.type)}
                                        className={`px-3 py-2 text-left text-sm rounded-lg transition-colors ${value.type === option.type
                                            ? 'bg-primary text-black font-medium'
                                            : 'text-zinc-300 hover:bg-zinc-800'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Range */}
                        <div className="p-3" style={{ backgroundColor: '#18181b' }}>
                            <button
                                onClick={() => setShowCustom(!showCustom)}
                                className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors flex items-center justify-between ${value.type === 'custom'
                                    ? 'bg-primary text-black font-medium'
                                    : 'text-zinc-300 hover:bg-zinc-800'
                                    }`}
                            >
                                <span>Período Personalizado</span>
                                <ChevronDown size={14} className={`transition-transform ${showCustom ? 'rotate-180' : ''}`} />
                            </button>

                            {showCustom && (
                                <div className="mt-3 space-y-3" style={{ backgroundColor: '#18181b' }}>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-zinc-500 mb-1 block">Data Inicial</label>
                                            <input
                                                type="date"
                                                value={customStart}
                                                onChange={(e) => setCustomStart(e.target.value)}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500 mb-1 block">Data Final</label>
                                            <input
                                                type="date"
                                                value={customEnd}
                                                onChange={(e) => setCustomEnd(e.target.value)}
                                                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={applyCustomRange}
                                        disabled={!customStart || !customEnd}
                                        className="w-full py-2 bg-primary text-black font-bold text-sm rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Aplicar Filtro
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DateRangeFilter;

