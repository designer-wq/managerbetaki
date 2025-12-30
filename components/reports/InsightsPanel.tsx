import React from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';

interface InsightsPanelProps {
    insights: string[];
    isLoading?: boolean;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, isLoading }) => {
    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-xl p-5 animate-pulse">
                <div className="h-6 w-32 bg-zinc-800 rounded mb-4" />
                <div className="space-y-3">
                    <div className="h-4 w-full bg-zinc-800/50 rounded" />
                    <div className="h-4 w-3/4 bg-zinc-800/50 rounded" />
                    <div className="h-4 w-5/6 bg-zinc-800/50 rounded" />
                </div>
            </div>
        );
    }

    if (insights.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Sparkles size={100} className="text-primary" />
            </div>

            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Lightbulb size={18} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-white">Insights Automáticos</h3>
            </div>

            <div className="space-y-3 relative z-10 transition-all">
                {insights.map((text, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50 hover:border-primary/30 transition-colors">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            {text}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InsightsPanel;
