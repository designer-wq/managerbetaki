import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

interface ExportButtonProps {
    onExportCSV?: () => void;
    onExportPDF?: () => void;
    data?: any[];
    filename?: string;
    className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
    onExportCSV,
    onExportPDF,
    data = [],
    filename = 'relatorio',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

    const handleExportCSV = async () => {
        setExporting('csv');
        try {
            if (onExportCSV) {
                await onExportCSV();
            } else if (data.length > 0) {
                exportToCSV(data, filename);
            }
        } finally {
            setExporting(null);
            setIsOpen(false);
        }
    };

    const handleExportPDF = async () => {
        setExporting('pdf');
        try {
            if (onExportPDF) {
                await onExportPDF();
            } else {
                // Simple print-to-PDF approach
                window.print();
            }
        } finally {
            setExporting(null);
            setIsOpen(false);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-sm font-medium"
            >
                <Download size={16} />
                <span>Exportar</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-1">
                            <button
                                onClick={handleExportCSV}
                                disabled={exporting !== null}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {exporting === 'csv' ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <FileSpreadsheet size={16} className="text-emerald-500" />
                                )}
                                <div>
                                    <span className="font-medium">Excel/CSV</span>
                                    <p className="text-xs text-zinc-500">Dados em planilha</p>
                                </div>
                            </button>
                            <button
                                onClick={handleExportPDF}
                                disabled={exporting !== null}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {exporting === 'pdf' ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <FileText size={16} className="text-red-500" />
                                )}
                                <div>
                                    <span className="font-medium">PDF</span>
                                    <p className="text-xs text-zinc-500">Relatório visual</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// Helper function to export data as CSV
export const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                let cell = row[header];
                // Handle nested objects
                if (typeof cell === 'object' && cell !== null) {
                    cell = cell.name || JSON.stringify(cell);
                }
                // Escape commas and quotes
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                    cell = `"${cell.replace(/"/g, '""')}"`;
                }
                return cell ?? '';
            }).join(',')
        )
    ].join('\n');

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Helper function to format report data for export
export const formatReportDataForExport = (demands: any[]): any[] => {
    return demands.map(d => ({
        'ID': d.id,
        'Título': d.title,
        'Status': d.statuses?.name || '-',
        'Tipo': d.demand_types?.name || '-',
        'Origem': d.origins?.name || '-',
        'Responsável': d.responsible?.name || '-',
        'Prioridade': d.priority || '-',
        'Prazo': d.deadline || '-',
        'Criado em': d.created_at?.split('T')[0] || '-',
        'Atualizado em': d.updated_at?.split('T')[0] || '-',
    }));
};

export default ExportButton;
