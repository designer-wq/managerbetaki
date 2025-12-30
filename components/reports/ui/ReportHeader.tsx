import React from 'react';
import { Calendar } from 'lucide-react';

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  period: string;
  onPeriodChange: (period: string) => void;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({ title, subtitle, period, onPeriodChange }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-zinc-400 mt-1">{subtitle}</p>}
      </div>
      
      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
        {['30 Dias', 'Mês Atual', 'Semana'].map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              period === p 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {p}
          </button>
        ))}
        <div className="w-px h-4 bg-zinc-800 mx-1" />
        <button className="px-3 py-2 text-zinc-500 hover:text-white">
            <Calendar size={18} />
        </button>
      </div>
    </div>
  );
};

export default ReportHeader;
