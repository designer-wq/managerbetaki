import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Target, Plus, Trash2, TrendingUp, Calendar, User, CheckCircle, XCircle, Clock, Edit2 } from 'lucide-react';
import { useGoals, Goal } from '../hooks/useGoals';
import { fetchProfiles, fetchAuthUsersList, fetchDemands } from '../lib/api';

const GoalsPage: React.FC = () => {
    const { goals, createGoal, updateGoal, deleteGoal, updateProgress, getGoalProgress } = useGoals();
    const [designers, setDesigners] = useState<any[]>([]);
    const [demands, setDemands] = useState<any[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        designerId: '',
        title: '',
        description: '',
        targetValue: 10,
        unit: 'demands' as 'demands' | 'ontime_rate' | 'hours',
        period: 'monthly' as 'weekly' | 'monthly' | 'quarterly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const authUsers = await fetchAuthUsersList();
                const onlyDesigners = (authUsers || []).filter((u: any) =>
                    u.status === 'active' &&
                    u.job_title_name?.toLowerCase().includes('designer')
                );
                setDesigners(onlyDesigners);

                const demandsData = await fetchDemands();
                setDemands(demandsData || []);
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        loadData();
    }, []);

    // Calculate end date based on period
    useEffect(() => {
        if (formData.startDate && formData.period) {
            const start = new Date(formData.startDate);
            let end: Date;

            switch (formData.period) {
                case 'weekly':
                    end = new Date(start);
                    end.setDate(end.getDate() + 7);
                    break;
                case 'monthly':
                    end = new Date(start);
                    end.setMonth(end.getMonth() + 1);
                    break;
                case 'quarterly':
                    end = new Date(start);
                    end.setMonth(end.getMonth() + 3);
                    break;
                default:
                    end = start;
            }

            setFormData(prev => ({
                ...prev,
                endDate: end.toISOString().split('T')[0]
            }));
        }
    }, [formData.startDate, formData.period]);

    // Auto-calculate progress for active goals based on demands
    useEffect(() => {
        goals.forEach(goal => {
            if (goal.status !== 'active') return;

            const designerDemands = demands.filter(d => {
                if (d.responsible_id !== goal.designerId) return false;

                const demandDate = new Date(d.created_at);
                const startDate = new Date(goal.startDate);
                const endDate = new Date(goal.endDate);

                return demandDate >= startDate && demandDate <= endDate;
            });

            if (goal.unit === 'demands') {
                const completedDemands = designerDemands.filter(d =>
                    d.statuses?.name?.toLowerCase().includes('conclu') ||
                    d.statuses?.name?.toLowerCase().includes('entregue')
                );
                if (completedDemands.length !== goal.currentValue) {
                    updateProgress(goal.id, completedDemands.length);
                }
            }
        });
    }, [demands, goals]);

    const handleSubmit = () => {
        const designer = designers.find(d => d.id === formData.designerId);
        if (!designer || !formData.title) return;

        if (editingGoal) {
            updateGoal(editingGoal.id, {
                designerId: formData.designerId,
                designerName: designer.name,
                title: formData.title,
                description: formData.description,
                targetValue: formData.targetValue,
                unit: formData.unit,
                period: formData.period,
                startDate: formData.startDate,
                endDate: formData.endDate
            });
        } else {
            createGoal({
                designerId: formData.designerId,
                designerName: designer.name,
                title: formData.title,
                description: formData.description,
                targetValue: formData.targetValue,
                unit: formData.unit,
                period: formData.period,
                startDate: formData.startDate,
                endDate: formData.endDate
            });
        }

        resetForm();
    };

    const resetForm = () => {
        setFormData({
            designerId: '',
            title: '',
            description: '',
            targetValue: 10,
            unit: 'demands',
            period: 'monthly',
            startDate: new Date().toISOString().split('T')[0],
            endDate: ''
        });
        setIsCreateModalOpen(false);
        setEditingGoal(null);
    };

    const handleEdit = (goal: Goal) => {
        setFormData({
            designerId: goal.designerId,
            title: goal.title,
            description: goal.description || '',
            targetValue: goal.targetValue,
            unit: goal.unit,
            period: goal.period,
            startDate: goal.startDate,
            endDate: goal.endDate
        });
        setEditingGoal(goal);
        setIsCreateModalOpen(true);
    };

    const getStatusIcon = (status: Goal['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="text-green-500" size={18} />;
            case 'failed':
                return <XCircle className="text-red-500" size={18} />;
            default:
                return <Clock className="text-yellow-500" size={18} />;
        }
    };

    const getUnitLabel = (unit: Goal['unit']) => {
        switch (unit) {
            case 'demands':
                return 'demandas';
            case 'ontime_rate':
                return '% no prazo';
            case 'hours':
                return 'horas';
        }
    };

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const failedGoals = goals.filter(g => g.status === 'failed');

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
            <Header
                title="Metas e OKRs"
                subtitle="Defina e acompanhe metas por designer"
            />

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-6xl mx-auto">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Target className="text-blue-500" size={20} />
                                </div>
                                <div>
                                    <p className="text-zinc-500 text-sm">Total de Metas</p>
                                    <p className="text-2xl font-bold text-white">{goals.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/10 rounded-lg">
                                    <Clock className="text-yellow-500" size={20} />
                                </div>
                                <div>
                                    <p className="text-zinc-500 text-sm">Em Andamento</p>
                                    <p className="text-2xl font-bold text-white">{activeGoals.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <CheckCircle className="text-green-500" size={20} />
                                </div>
                                <div>
                                    <p className="text-zinc-500 text-sm">Concluídas</p>
                                    <p className="text-2xl font-bold text-white">{completedGoals.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <XCircle className="text-red-500" size={20} />
                                </div>
                                <div>
                                    <p className="text-zinc-500 text-sm">Não Atingidas</p>
                                    <p className="text-2xl font-bold text-white">{failedGoals.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Metas Ativas</h2>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-zinc-900 font-bold rounded-lg hover:bg-primary-hover transition-colors"
                        >
                            <Plus size={18} />
                            Nova Meta
                        </button>
                    </div>

                    {/* Goals List */}
                    {goals.length === 0 ? (
                        <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800 rounded-xl">
                            <Target className="mx-auto text-zinc-600 mb-4" size={48} />
                            <h3 className="text-lg font-medium text-zinc-400 mb-2">Nenhuma meta definida</h3>
                            <p className="text-zinc-500 text-sm mb-4">Crie metas para acompanhar o progresso da equipe</p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-4 py-2 bg-primary text-zinc-900 font-bold rounded-lg hover:bg-primary-hover transition-colors"
                            >
                                Criar Primeira Meta
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {goals.map(goal => {
                                const progress = getGoalProgress(goal);
                                return (
                                    <div
                                        key={goal.id}
                                        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(goal.status)}
                                                <div>
                                                    <h3 className="font-semibold text-white">{goal.title}</h3>
                                                    <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                                                        <User size={14} />
                                                        <span>{goal.designerName}</span>
                                                        <span>•</span>
                                                        <Calendar size={14} />
                                                        <span>
                                                            {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(goal)}
                                                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteGoal(goal.id)}
                                                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-zinc-400">
                                                    {goal.currentValue} / {goal.targetValue} {getUnitLabel(goal.unit)}
                                                </span>
                                                <span className={`font-bold ${progress >= 100 ? 'text-green-500' : progress >= 70 ? 'text-yellow-500' : 'text-zinc-400'}`}>
                                                    {progress}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 rounded-full ${progress >= 100
                                                        ? 'bg-green-500'
                                                        : progress >= 70
                                                            ? 'bg-yellow-500'
                                                            : 'bg-primary'
                                                        }`}
                                                    style={{ width: `${Math.min(100, progress)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
                    <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 animate-scale-in">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingGoal ? 'Editar Meta' : 'Nova Meta'}
                        </h2>

                        <div className="space-y-4">
                            {/* Designer Select */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Designer</label>
                                <select
                                    value={formData.designerId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, designerId: e.target.value }))}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary"
                                >
                                    <option value="">Selecione um designer</option>
                                    {designers.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Título da Meta</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Ex: Entregar 15 demandas no mês"
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 outline-none focus:border-primary"
                                />
                            </div>

                            {/* Target & Unit */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Meta</label>
                                    <input
                                        type="number"
                                        value={formData.targetValue}
                                        onChange={(e) => setFormData(prev => ({ ...prev, targetValue: parseInt(e.target.value) || 0 }))}
                                        min={1}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Unidade</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as any }))}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary"
                                    >
                                        <option value="demands">Demandas</option>
                                        <option value="ontime_rate">% No Prazo</option>
                                        <option value="hours">Horas</option>
                                    </select>
                                </div>
                            </div>

                            {/* Period & Start Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Período</label>
                                    <select
                                        value={formData.period}
                                        onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as any }))}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary"
                                    >
                                        <option value="weekly">Semanal</option>
                                        <option value="monthly">Mensal</option>
                                        <option value="quarterly">Trimestral</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Data Início</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            {formData.endDate && (
                                <p className="text-sm text-zinc-500">
                                    Término: {new Date(formData.endDate).toLocaleDateString()}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={resetForm}
                                className="flex-1 px-4 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.designerId || !formData.title}
                                className="flex-1 px-4 py-3 bg-primary text-zinc-900 font-bold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingGoal ? 'Salvar' : 'Criar Meta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalsPage;
