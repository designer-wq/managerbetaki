import React from 'react';
import { HelpCircle, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { KpiMetric } from '../../lib/reports/types';

interface KpiCardProps {
    data: KpiMetric;
}

const KpiCard: React.FC<KpiCardProps> = ({ data }) => {
    return (
        <div className="relative group bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all hover:shadow-lg hover:shadow-black/20">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-sm font-medium">{data.label}</span>
                    <div className="relative group/tooltip">
                        <HelpCircle size={14} className="text-zinc-600 cursor-help hover:text-zinc-400 transition-colors" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black border border-zinc-700 rounded-lg shadow-xl text-xs text-zinc-300 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                            {data.tooltip}
                            <div className="absolute pt-1 top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-zinc-700"></div>
                        </div>
                    </div>
                </div>
                {data.icon && (
                    <div className={`p-2 rounded-lg bg-zinc-800/50 ${data.color ? data.color : 'text-zinc-400'}`}>
                        <data.icon size={20} />
                    </div>
                )}
            </div>

            <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-white tracking-tight">{data.value}</span>
                {data.subValue && (
                    <div className={`flex items-center text-xs font-medium mb-1.5 ${data.trend === 'up' ? 'text-green-400' :
                            data.trend === 'down' ? 'text-red-400' :
                                'text-zinc-500'
                        }`}>
                        {data.trend === 'up' && <ArrowUpRight size={14} />}
                        {data.trend === 'down' && <ArrowDownRight size={14} />}
                        {data.trend === 'neutral' && <Minus size={14} />}
                        {data.subValue}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KpiCard;
