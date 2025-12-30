import React from 'react';

interface ScoreBarProps {
  score: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ score }) => {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (s: number) => {
    if (s >= 80) return 'text-green-500';
    if (s >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-zinc-400 font-medium text-sm">Seu Score de Performance</h3>
          <p className="text-zinc-500 text-xs mt-1">Baseado em entregas e pontualidade</p>
        </div>
        <div className={`text-4xl font-bold ${getTextColor(score)}`}>
          {score}
        </div>
      </div>
      
      <div className="h-4 bg-zinc-800 rounded-full overflow-hidden relative">
        <div 
          className={`h-full ${getColor(score)} transition-all duration-1000 ease-out relative`}
          style={{ width: `${score}%` }}
        >
            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/20" />
        </div>
        
        {/* Markers */}
        <div className="absolute top-0 bottom-0 left-[60%] w-[1px] bg-zinc-700/50" title="Meta Mínima (60)" />
        <div className="absolute top-0 bottom-0 left-[80%] w-[1px] bg-zinc-700/50" title="Excelência (80)" />
      </div>
      
      <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-mono uppercase">
        <span>Crítico (0-59)</span>
        <span>Atenção (60-79)</span>
        <span>Excelente (80-100)</span>
      </div>
    </div>
  );
};

export default ScoreBar;
