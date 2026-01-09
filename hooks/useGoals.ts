import { useState, useEffect, useCallback } from 'react';

export interface Goal {
    id: string;
    designerId: string;
    designerName: string;
    title: string;
    description?: string;
    targetValue: number;
    currentValue: number;
    unit: 'demands' | 'ontime_rate' | 'hours';
    period: 'weekly' | 'monthly' | 'quarterly';
    startDate: string;
    endDate: string;
    status: 'active' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'manager-betaki-goals';

export function useGoals() {
    const [goals, setGoals] = useState<Goal[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setGoals(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    }, []);

    // Persist to localStorage
    const persistGoals = useCallback((updatedGoals: Goal[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGoals));
            setGoals(updatedGoals);
        } catch (error) {
            console.error('Error saving goals:', error);
        }
    }, []);

    const createGoal = useCallback((goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'currentValue'>) => {
        const newGoal: Goal = {
            ...goalData,
            id: crypto.randomUUID(),
            currentValue: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        persistGoals([...goals, newGoal]);
        return newGoal;
    }, [goals, persistGoals]);

    const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
        const updatedGoals = goals.map(g =>
            g.id === id
                ? { ...g, ...updates, updatedAt: new Date().toISOString() }
                : g
        );
        persistGoals(updatedGoals);
    }, [goals, persistGoals]);

    const deleteGoal = useCallback((id: string) => {
        persistGoals(goals.filter(g => g.id !== id));
    }, [goals, persistGoals]);

    const updateProgress = useCallback((id: string, currentValue: number) => {
        const goal = goals.find(g => g.id === id);
        if (!goal) return;

        const isCompleted = currentValue >= goal.targetValue;
        const now = new Date();
        const endDate = new Date(goal.endDate);
        const isFailed = now > endDate && !isCompleted;

        updateGoal(id, {
            currentValue,
            status: isCompleted ? 'completed' : isFailed ? 'failed' : 'active'
        });
    }, [goals, updateGoal]);

    const getGoalsByDesigner = useCallback((designerId: string) => {
        return goals.filter(g => g.designerId === designerId);
    }, [goals]);

    const getActiveGoals = useCallback(() => {
        return goals.filter(g => g.status === 'active');
    }, [goals]);

    const getGoalProgress = useCallback((goal: Goal): number => {
        if (goal.targetValue === 0) return 0;
        return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
    }, []);

    return {
        goals,
        createGoal,
        updateGoal,
        deleteGoal,
        updateProgress,
        getGoalsByDesigner,
        getActiveGoals,
        getGoalProgress
    };
}

export default useGoals;
