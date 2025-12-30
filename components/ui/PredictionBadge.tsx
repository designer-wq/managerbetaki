import React from 'react';
import { AlertTriangle, Clock, TrendingUp, CheckCircle, Info } from 'lucide-react';

interface PredictionBadgeProps {
    risk: 'low' | 'medium' | 'high' | 'critical';
    estimatedDays: number;
    confidence: 'high' | 'medium' | 'low';
    details: string;
    isOnTrack: boolean;
    compact?: boolean;
}

export const PredictionBadge: React.FC<PredictionBadgeProps> = ({
    risk,
    estimatedDays,
    confidence,
    details,
    isOnTrack,
    compact = false
}) => {
    const [showTooltip, setShowTooltip] = React.useState(false);

    const getRiskStyles = () => {
        switch (risk) {
            case 'critical':
                return {
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/30',
                    text: 'text-red-400',
                    icon: AlertTriangle
                };
            case 'high':
                return {
                    bg: 'bg-orange-500/10',
                    border: 'border-orange-500/30',
                    text: 'text-orange-400',
                    icon: AlertTriangle
                };
            case 'medium':
                return {
                    bg: 'bg-yellow-500/10',
                    border: 'border-yellow-500/30',
                    text: 'text-yellow-400',
                    icon: Clock
                };
            case 'low':
            default:
                return {
                    bg: 'bg-green-500/10',
                    border: 'border-green-500/30',
                    text: 'text-green-400',
                    icon: CheckCircle
                };
        }
    };

    const styles = getRiskStyles();
    const Icon = styles.icon;

    if (compact) {
        return (
            <div
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${styles.bg} ${styles.text} text-[10px] font-medium`}>
                    <Icon size={10} />
                    <span>{estimatedDays}d</span>
                </div>

                {showTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={14} className={styles.text} />
                            <span className="text-white text-sm font-medium">Previsão de Entrega</span>
                        </div>
                        <p className="text-zinc-400 text-xs mb-2">{details}</p>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">Confiança:</span>
                            <span className={confidence === 'high' ? 'text-green-400' : confidence === 'medium' ? 'text-yellow-400' : 'text-zinc-400'}>
                                {confidence === 'high' ? 'Alta' : confidence === 'medium' ? 'Média' : 'Baixa'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-zinc-500">Status:</span>
                            <span className={isOnTrack ? 'text-green-400' : 'text-red-400'}>
                                {isOnTrack ? 'No prazo' : 'Em risco'}
                            </span>
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-zinc-900 border-r border-b border-zinc-700" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`p-4 rounded-xl border ${styles.bg} ${styles.border}`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${styles.bg}`}>
                    <Icon size={18} className={styles.text} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${styles.text}`}>
                            {risk === 'critical' ? 'Risco Crítico' :
                                risk === 'high' ? 'Alto Risco' :
                                    risk === 'medium' ? 'Atenção' : 'No Prazo'}
                        </span>
                        <span className="text-xs text-zinc-500">
                            ~{estimatedDays} dias para entrega
                        </span>
                    </div>
                    <p className="text-xs text-zinc-400">{details}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                        <div className="flex items-center gap-1">
                            <Info size={12} className="text-zinc-500" />
                            <span className="text-zinc-500">Confiança:</span>
                            <span className={
                                confidence === 'high' ? 'text-green-400' :
                                    confidence === 'medium' ? 'text-yellow-400' : 'text-zinc-400'
                            }>
                                {confidence === 'high' ? 'Alta' : confidence === 'medium' ? 'Média' : 'Baixa'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Summary component for dashboard
interface PredictionSummaryProps {
    atRiskCount: number;
    onTrackCount: number;
    avgDeliveryDays: number;
}

export const PredictionSummary: React.FC<PredictionSummaryProps> = ({
    atRiskCount,
    onTrackCount,
    avgDeliveryDays
}) => {
    return (
        <div className="grid grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{onTrackCount}</div>
                <div className="text-xs text-zinc-500 mt-1">No Prazo</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{atRiskCount}</div>
                <div className="text-xs text-zinc-500 mt-1">Em Risco</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">{avgDeliveryDays}d</div>
                <div className="text-xs text-zinc-500 mt-1">Média Entrega</div>
            </div>
        </div>
    );
};

export default PredictionBadge;
