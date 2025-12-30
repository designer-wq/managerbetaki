import React from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  tooltip?: string;
  color?: string; // Tailwind text color class, e.g., 'text-blue-500'
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, subtext, trend, tooltip, color = 'text-white' }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between relative group hover:border-zinc-700 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <p className="text-zinc-400 text-sm font-medium flex items-center gap-1">
          {title}
          {tooltip && (
            <div className="relative group/tooltip">
              <HelpCircle size={14} className="text-zinc-600 cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-48 bg-zinc-800 text-zinc-300 text-xs p-2 rounded shadow-lg border border-zinc-700 z-50">
                {tooltip}
              </div>
            </div>
          )}
        </p>
        <div className={`p-2 rounded-lg bg-zinc-800/50 ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
        {subtext && (
          <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

export default KPICard;
