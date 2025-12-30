import { useMemo } from 'react';

interface DemandData {
    id: string;
    created_at: string;
    updated_at: string;
    deadline: string | null;
    status_id: string;
    responsible_id: string;
    statuses?: { name: string };
}

interface PredictionResult {
    estimatedDays: number;
    confidence: 'high' | 'medium' | 'low';
    basedOn: number; // number of historical samples
    isOnTrack: boolean;
    risk: 'low' | 'medium' | 'high' | 'critical';
    details: string;
}

export function useDeadlinePrediction(demands: DemandData[]) {
    // Calculate average delivery time per designer
    const designerVelocity = useMemo(() => {
        const velocityMap = new Map<string, { totalDays: number; count: number }>();

        demands.forEach(demand => {
            if (!demand.responsible_id || !demand.created_at || !demand.updated_at) return;

            const statusName = demand.statuses?.name?.toLowerCase() || '';
            const isCompleted = statusName.includes('conclu') ||
                statusName.includes('entregue') ||
                statusName.includes('postar') ||
                statusName.includes('agendado');

            if (!isCompleted) return;

            const createdAt = new Date(demand.created_at);
            const completedAt = new Date(demand.updated_at);
            const daysToComplete = Math.max(1, Math.ceil((completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));

            const existing = velocityMap.get(demand.responsible_id) || { totalDays: 0, count: 0 };
            velocityMap.set(demand.responsible_id, {
                totalDays: existing.totalDays + daysToComplete,
                count: existing.count + 1
            });
        });

        const result = new Map<string, number>();
        velocityMap.forEach((data, designerId) => {
            result.set(designerId, Math.round(data.totalDays / data.count));
        });

        return result;
    }, [demands]);

    // Calculate global average
    const globalAverageDays = useMemo(() => {
        let totalDays = 0;
        let count = 0;

        designerVelocity.forEach(avgDays => {
            totalDays += avgDays;
            count++;
        });

        return count > 0 ? Math.round(totalDays / count) : 5; // Default 5 days if no data
    }, [designerVelocity]);

    const predictDeliveryDate = (demand: DemandData): PredictionResult => {
        const createdAt = new Date(demand.created_at);
        const now = new Date();
        const daysInProgress = Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        // Get designer-specific velocity or use global
        const designerVelocityDays = demand.responsible_id
            ? designerVelocity.get(demand.responsible_id)
            : null;

        const hasDesignerData = designerVelocityDays !== null && designerVelocityDays !== undefined;
        const estimatedDays = hasDesignerData ? designerVelocityDays : globalAverageDays;

        // Confidence based on sample size
        const samplesForDesigner = demands.filter(d =>
            d.responsible_id === demand.responsible_id &&
            d.statuses?.name?.toLowerCase().includes('conclu')
        ).length;

        let confidence: 'high' | 'medium' | 'low' = 'low';
        if (samplesForDesigner >= 10) confidence = 'high';
        else if (samplesForDesigner >= 5) confidence = 'medium';

        // Calculate estimated completion date
        const estimatedCompletion = new Date(createdAt);
        estimatedCompletion.setDate(estimatedCompletion.getDate() + estimatedDays);

        // Check if on track (considering deadline)
        let isOnTrack = true;
        let risk: 'low' | 'medium' | 'high' | 'critical' = 'low';

        if (demand.deadline) {
            const deadline = new Date(demand.deadline);
            const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const estimatedDaysRemaining = Math.max(0, estimatedDays - daysInProgress);

            if (daysUntilDeadline < 0) {
                // Already past deadline
                isOnTrack = false;
                risk = 'critical';
            } else if (estimatedDaysRemaining > daysUntilDeadline) {
                // Won't make it in time
                isOnTrack = false;
                const excess = estimatedDaysRemaining - daysUntilDeadline;
                if (excess > 3) risk = 'critical';
                else if (excess > 1) risk = 'high';
                else risk = 'medium';
            } else if (daysUntilDeadline <= 2) {
                risk = 'medium';
            }
        }

        // Generate details message
        let details = '';
        if (hasDesignerData) {
            details = `Baseado em ${samplesForDesigner} entregas anteriores do designer (média: ${estimatedDays} dias)`;
        } else {
            details = `Baseado na média global da equipe (${globalAverageDays} dias). Sem histórico específico do designer.`;
        }

        return {
            estimatedDays,
            confidence,
            basedOn: samplesForDesigner,
            isOnTrack,
            risk,
            details
        };
    };

    const getPredictionsForActiveDemands = (): Map<string, PredictionResult> => {
        const predictions = new Map<string, PredictionResult>();

        demands.forEach(demand => {
            const statusName = demand.statuses?.name?.toLowerCase() || '';
            const isActive = !statusName.includes('conclu') &&
                !statusName.includes('entregue') &&
                !statusName.includes('agendado');

            if (isActive) {
                predictions.set(demand.id, predictDeliveryDate(demand));
            }
        });

        return predictions;
    };

    const getAtRiskDemands = (): DemandData[] => {
        return demands.filter(demand => {
            const prediction = predictDeliveryDate(demand);
            return prediction.risk === 'high' || prediction.risk === 'critical';
        });
    };

    return {
        designerVelocity,
        globalAverageDays,
        predictDeliveryDate,
        getPredictionsForActiveDemands,
        getAtRiskDemands
    };
}

export default useDeadlinePrediction;
