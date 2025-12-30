import React from 'react';
import { Lightbulb } from 'lucide-react';

interface InsightBoxProps {
  insights: string[];
}

const InsightBox: React.FC<InsightBoxProps> = ({ insights }) => {
  if (!insights.length) return null;

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="text-blue-400" size={20} />
        <h3 className="text-blue-400 font-bold text-lg">Insights do Período</h3>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, index) => (
          <li key={index} className="text-blue-200/80 text-sm flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InsightBox;
