import React from 'react';
import { FileBarChart2 } from 'lucide-react';

interface ReportEmptyStateProps {
  title?: string;
  description?: string;
}

const ReportEmptyState: React.FC<ReportEmptyStateProps> = ({ 
  title = 'Nenhum dado encontrado', 
  description = 'Não há dados suficientes para gerar este relatório no período selecionado.' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/30 border border-zinc-800/50 rounded-xl border-dashed">
      <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
        <FileBarChart2 size={32} className="text-zinc-600" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-zinc-500 max-w-md">{description}</p>
    </div>
  );
};

export default ReportEmptyState;
