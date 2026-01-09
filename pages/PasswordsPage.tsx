import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import { Search, Plus, Eye, EyeOff, Copy, Trash2, Edit2, Globe, Calendar, DollarSign, AlertCircle, RefreshCw, Filter } from 'lucide-react';
import { useToast } from '../components/ui/ToastContext';
import { fetchTable, createRecord, updateRecord, deleteRecord } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface PasswordRecord {
    id: string;
    name: string;
    login: string;
    password: string;
    url?: string;
    notes?: string;
    is_active: boolean;
    purchase_date?: string;
    renewal_date?: string;
    cost?: number;
    is_recurring: boolean;
    recurrence_type?: 'monthly' | 'yearly' | 'quarterly' | 'one-time' | 'recurrent';
    created_at: string;
    updated_at: string;
    created_by: string;
}

const PasswordsPage = () => {
    const [passwords, setPasswords] = useState<PasswordRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
    const [isCreating, setIsCreating] = useState(false);
    const [editingPassword, setEditingPassword] = useState<PasswordRecord | null>(null);
    const { addToast } = useToast();
    const { user } = useAuth();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        login: '',
        password: '',
        url: '',
        notes: '',
        is_active: true,
        purchase_date: '',
        renewal_date: '',
        cost: 0,
        is_recurring: false,
        recurrence_type: 'monthly' as 'monthly' | 'yearly' | 'quarterly' | 'one-time' | 'recurrent'
    });

    // Load passwords
    const loadPasswords = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchTable('passwords');
            // Sort by created_at descending
            const sortedData = (data || []).sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setPasswords(sortedData);
        } catch (error: any) {
            console.error('Error loading passwords:', error);
            addToast('Erro ao carregar senhas', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadPasswords();
    }, [loadPasswords]);

    // Filter passwords
    const filteredPasswords = passwords.filter(pwd => {
        const matchesSearch =
            pwd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pwd.login.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterStatus === 'all') return matchesSearch;
        if (filterStatus === 'active') return matchesSearch && pwd.is_active;
        if (filterStatus === 'inactive') return matchesSearch && !pwd.is_active;
        return matchesSearch;
    });

    // Calculate stats
    const stats = {
        totalInvested: passwords
            .filter(p => p.is_active && p.cost)
            .reduce((sum, p) => sum + (p.cost || 0), 0),
        annualProjection: passwords
            .filter(p => p.is_active && p.is_recurring && p.cost)
            .reduce((sum, p) => {
                const cost = p.cost || 0;
                if (p.recurrence_type === 'monthly') return sum + (cost * 12);
                if (p.recurrence_type === 'yearly') return sum + cost;
                if (p.recurrence_type === 'quarterly') return sum + (cost * 4);
                return sum;
            }, 0),
        monthlySpending: passwords
            .filter(p => p.is_active && p.is_recurring && p.cost)
            .reduce((sum, p) => {
                const cost = p.cost || 0;
                if (p.recurrence_type === 'monthly') return sum + cost;
                if (p.recurrence_type === 'yearly') return sum + (cost / 12);
                if (p.recurrence_type === 'quarterly') return sum + (cost / 3);
                return sum;
            }, 0),
        activeCount: passwords.filter(p => p.is_active).length,
        totalCount: passwords.length,
        upcomingRenewals: passwords.filter(p => {
            if (!p.renewal_date || !p.is_active) return false;
            const [y, m, d] = p.renewal_date.split('-').map(Number);
            const renewalDate = new Date(y, m - 1, d);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 7;
        }).length,
        upcomingRenewalsList: passwords.filter(p => {
            if (!p.renewal_date || !p.is_active) return false;
            const [y, m, d] = p.renewal_date.split('-').map(Number);
            const renewalDate = new Date(y, m - 1, d);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 7;
        }).map(p => {
            const [y, m, d] = p.renewal_date!.split('-').map(Number);
            const renewalDate = new Date(y, m - 1, d);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return { ...p, daysUntil };
        })
    };

    // Toggle password visibility
    const togglePasswordVisibility = (id: string) => {
        setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Copy to clipboard
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        addToast(`${label} copiado!`, 'success');
    };

    // Create/Update password
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Preparar dados - converter strings vazias para null em campos de data
        const dataToSave = {
            name: formData.name,
            login: formData.login,
            password: formData.password,
            url: formData.url || null,
            notes: formData.notes || null,
            is_active: formData.is_active,
            purchase_date: formData.purchase_date || null,
            renewal_date: formData.renewal_date || null,
            cost: formData.cost || 0,
            is_recurring: formData.is_recurring,
            recurrence_type: formData.is_recurring ? formData.recurrence_type : null
        };

        try {
            if (editingPassword) {
                // Update
                await updateRecord('passwords', editingPassword.id, {
                    ...dataToSave,
                    updated_at: new Date().toISOString()
                });
                addToast('Senha atualizada com sucesso!', 'success');
            } else {
                // Create
                await createRecord('passwords', {
                    ...dataToSave,
                    created_by: user?.id
                });
                addToast('Senha criada com sucesso!', 'success');
            }

            resetForm();
            loadPasswords();
        } catch (error: any) {
            console.error('Error saving password:', error);
            addToast(error.message || 'Erro ao salvar senha', 'error');
        }
    };

    // Delete password
    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta senha?')) return;

        try {
            await deleteRecord('passwords', id);
            addToast('Senha excluída com sucesso!', 'success');
            loadPasswords();
        } catch (error: any) {
            console.error('Error deleting password:', error);
            addToast('Erro ao excluir senha', 'error');
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            login: '',
            password: '',
            url: '',
            notes: '',
            is_active: true,
            purchase_date: '',
            renewal_date: '',
            cost: 0,
            is_recurring: false,
            recurrence_type: 'monthly'
        });
        setIsCreating(false);
        setEditingPassword(null);
    };

    // Edit password
    const handleEdit = (password: PasswordRecord) => {
        setEditingPassword(password);
        setFormData({
            name: password.name,
            login: password.login,
            password: password.password,
            url: password.url || '',
            notes: password.notes || '',
            is_active: password.is_active,
            purchase_date: password.purchase_date || '',
            renewal_date: password.renewal_date || '',
            cost: password.cost || 0,
            is_recurring: password.is_recurring,
            recurrence_type: password.recurrence_type || 'monthly'
        });
        setIsCreating(true);
    };

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Format date
    const formatDate = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pt-BR');
    };

    // Calculate expiration date based on purchase date and recurrence type
    const calculateExpirationDate = (purchaseDate: string, recurrenceType: string): string => {
        if (!purchaseDate || recurrenceType === 'one-time') return '';

        // Parse date without timezone issues
        const [year, month, day] = purchaseDate.split('-').map(Number);
        const purchase = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const purchaseDay = day;

        let renewal: Date;

        switch (recurrenceType) {
            case 'recurrent':
                // Recorrente: sempre usa o dia da compra no mês atual ou próximo
                renewal = new Date(today.getFullYear(), today.getMonth(), purchaseDay);
                // Se o dia já passou este mês, vai pro próximo
                if (renewal < today) {
                    renewal.setMonth(renewal.getMonth() + 1);
                }
                break;
            case 'monthly':
                // Mensal: adiciona 1 mês a partir da data de compra
                renewal = new Date(year, month - 1, day);
                renewal.setMonth(renewal.getMonth() + 1);
                break;
            case 'quarterly':
                // Trimestral: adiciona 3 meses a partir da data de compra
                renewal = new Date(year, month - 1, day);
                renewal.setMonth(renewal.getMonth() + 3);
                break;
            case 'yearly':
                // Anual: adiciona 1 ano a partir da data de compra
                renewal = new Date(year, month - 1, day);
                renewal.setFullYear(renewal.getFullYear() + 1);
                break;
            default:
                return '';
        }

        // Format as YYYY-MM-DD without timezone issues
        const renewalYear = renewal.getFullYear();
        const renewalMonth = String(renewal.getMonth() + 1).padStart(2, '0');
        const renewalDay = String(renewal.getDate()).padStart(2, '0');
        return `${renewalYear}-${renewalMonth}-${renewalDay}`;
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-950">
            <Header
                title="Gerenciador de Senhas"
                subtitle={`${filteredPasswords.length} senhas cadastradas`}
            />

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 custom-scrollbar">
                <div className="max-w-[1800px] mx-auto space-y-6">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* Monthly Spending */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="text-primary" size={20} />
                                <span className="text-zinc-400 text-xs">Gasto Mensal</span>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {formatCurrency(stats.monthlySpending)}
                            </div>
                            <div className="text-zinc-500 text-xs mt-1">assinaturas recorrentes</div>
                        </div>

                        {/* Annual Projection */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="text-blue-400" size={20} />
                                <span className="text-zinc-400 text-xs">Gasto Anual</span>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {formatCurrency(stats.annualProjection)}
                            </div>
                            <div className="text-zinc-500 text-xs mt-1">projeção anual</div>
                        </div>

                        {/* Total Invested */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Globe className="text-yellow-400" size={20} />
                                <span className="text-zinc-400 text-xs">Total Investido</span>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {formatCurrency(stats.totalInvested)}
                            </div>
                            <div className="text-zinc-500 text-xs mt-1">compras únicas + vitalício</div>
                        </div>

                        {/* Active Passwords */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="text-green-400" size={20} />
                                <span className="text-zinc-400 text-xs">Senhas Ativas</span>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {stats.activeCount}
                            </div>
                            <div className="text-zinc-500 text-xs mt-1">de {stats.totalCount} cadastradas</div>
                        </div>

                        {/* Upcoming Renewals */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="text-blue-400" size={20} />
                                <span className="text-zinc-400 text-xs">Renovações</span>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {stats.upcomingRenewals}
                            </div>
                            <div className="text-zinc-500 text-xs mt-1">próximos 7 dias</div>
                        </div>

                        {/* All OK Badge */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="text-green-400" size={20} />
                                <span className="text-zinc-400 text-xs">Atenção</span>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                0
                            </div>
                            <div className="text-zinc-500 text-xs mt-1">tudo ok!</div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 flex items-center bg-zinc-900/50 px-4 py-3 border border-zinc-700/50 focus-within:border-primary rounded-lg">
                            <Search size={20} className="text-zinc-500" />
                            <input
                                className="ml-3 w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
                                placeholder="Buscar por nome, login..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filter */}
                        <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg px-3 py-2">
                            <Filter size={16} className="text-zinc-500" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="bg-transparent text-sm text-white outline-none cursor-pointer"
                            >
                                <option value="all">Todos</option>
                                <option value="active">Ativos</option>
                                <option value="inactive">Inativos</option>
                            </select>
                        </div>

                        {/* Refresh */}
                        <button
                            onClick={loadPasswords}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-zinc-300 hover:text-white hover:border-zinc-600 transition-all"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            <span className="text-sm">Atualizar</span>
                        </button>

                        {/* New Password Button */}
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-black rounded-lg font-medium transition-all"
                        >
                            <Plus size={20} />
                            Nova Senha
                        </button>
                    </div>

                    {/* Alerta de Programas Prestes a Vencer */}
                    {stats.upcomingRenewalsList.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20">
                                    <AlertCircle className="text-amber-400 animate-pulse" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-amber-400 font-semibold">⚠️ Programas Prestes a Vencer</h3>
                                    <p className="text-amber-400/70 text-sm">{stats.upcomingRenewalsList.length} programa(s) com renovação nos próximos 7 dias</p>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                {stats.upcomingRenewalsList.map(pwd => (
                                    <div
                                        key={pwd.id}
                                        onClick={() => handleEdit(pwd)}
                                        className="flex items-center justify-between bg-zinc-900/80 rounded-lg px-4 py-3 cursor-pointer hover:bg-zinc-800/80 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Globe size={16} className="text-amber-400" />
                                            <span className="text-white font-medium">{pwd.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-zinc-400 text-sm">
                                                Renova: {formatDate(pwd.renewal_date!)}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${pwd.daysUntil === 0 ? 'bg-red-500 text-white' :
                                                    pwd.daysUntil <= 2 ? 'bg-amber-500 text-black' :
                                                        'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {pwd.daysUntil === 0 ? 'HOJE!' :
                                                    pwd.daysUntil === 1 ? 'Amanhã' :
                                                        `${pwd.daysUntil} dias`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Passwords Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-zinc-800 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : filteredPasswords.length === 0 ? (
                        <div className="text-center py-20 px-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                            <Globe className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                            <h3 className="text-zinc-300 font-medium text-lg mb-2">Nenhuma senha encontrada</h3>
                            <p className="text-zinc-500 text-sm">
                                {searchTerm || filterStatus !== 'all'
                                    ? 'Tente ajustar os filtros de busca.'
                                    : 'Clique em "Nova Senha" para adicionar sua primeira senha.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPasswords.map((pwd) => (
                                <div
                                    key={pwd.id}
                                    onClick={() => handleEdit(pwd)}
                                    className="bg-zinc-900 border border-zinc-800 hover:border-primary/50 rounded-xl p-5 transition-all group relative cursor-pointer hover:bg-zinc-900/80"
                                >
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${pwd.is_active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-500'}`}>
                                            {pwd.is_active ? '✓ Ativo' : 'Inativo'}
                                        </span>
                                    </div>

                                    {/* Service Icon */}
                                    <div className="mb-4">
                                        <div className="w-14 h-14 bg-zinc-800 rounded-lg flex items-center justify-center">
                                            <Globe className="text-primary" size={28} />
                                        </div>
                                    </div>

                                    {/* Service Name */}
                                    <h3 className="text-white font-semibold text-lg mb-4">{pwd.name}</h3>

                                    {/* Login */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-zinc-500 text-sm">Login:</span>
                                            <span className="text-zinc-300 text-sm">{pwd.login}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(pwd.login, 'Login'); }}
                                                className="p-1.5 hover:bg-zinc-800 rounded transition-all"
                                                title="Copiar login"
                                            >
                                                <Copy size={14} className="text-zinc-500" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-zinc-500 text-sm">Senha:</span>
                                            <span className="text-zinc-300 text-sm font-mono">
                                                {showPassword[pwd.id] ? pwd.password : '••••••••'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); togglePasswordVisibility(pwd.id); }}
                                                className="p-1.5 hover:bg-zinc-800 rounded transition-all"
                                                title={showPassword[pwd.id] ? 'Ocultar' : 'Mostrar'}
                                            >
                                                {showPassword[pwd.id] ? (
                                                    <EyeOff size={14} className="text-zinc-500" />
                                                ) : (
                                                    <Eye size={14} className="text-zinc-500" />
                                                )}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(pwd.password, 'Senha'); }}
                                                className="p-1.5 hover:bg-zinc-800 rounded transition-all"
                                                title="Copiar senha"
                                            >
                                                <Copy size={14} className="text-zinc-500" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                                        {pwd.purchase_date && (
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                <span>Compra: {formatDate(pwd.purchase_date)}</span>
                                            </div>
                                        )}
                                        {pwd.renewal_date && (
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                <span>Renova: {formatDate(pwd.renewal_date)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recurrence Type + Value */}
                                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                                            <RefreshCw size={12} className="text-primary" />
                                            <span>
                                                {pwd.is_recurring
                                                    ? pwd.recurrence_type === 'recurrent' ? 'Recorrente' : pwd.recurrence_type === 'monthly' ? 'Mensal' : pwd.recurrence_type === 'quarterly' ? 'Trimestral' : 'Anual'
                                                    : 'Pagamento único'
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {pwd.cost && pwd.cost > 0 && (
                                                <div className="text-lg font-bold" style={{ color: '#bcd200' }}>
                                                    {formatCurrency(pwd.cost)}
                                                    {pwd.is_recurring && (
                                                        <span className="text-xs font-normal text-zinc-500">
                                                            /{pwd.recurrence_type === 'monthly' ? 'mês' : pwd.recurrence_type === 'yearly' ? 'ano' : 'trim'}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(pwd.id); }}
                                                className="p-1.5 hover:bg-red-500/20 rounded transition-all ml-2"
                                                title="Excluir"
                                            >
                                                <Trash2 size={14} className="text-zinc-500 hover:text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingPassword ? 'Editar Senha' : 'Nova Senha'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Nome do Sistema *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary"
                                    placeholder="Ex: Netflix, Spotify..."
                                />
                            </div>

                            {/* Link da Plataforma */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Link da Plataforma
                                </label>
                                <input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary"
                                    placeholder="https://..."
                                />
                            </div>

                            {/* Login and Password */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Login *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.login}
                                        onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Senha *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Data de Compra *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.purchase_date}
                                        onChange={(e) => {
                                            const newPurchaseDate = e.target.value;
                                            const newRenewalDate = formData.is_recurring
                                                ? calculateExpirationDate(newPurchaseDate, formData.recurrence_type)
                                                : formData.renewal_date;
                                            setFormData({ ...formData, purchase_date: newPurchaseDate, renewal_date: newRenewalDate });
                                        }}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Data de Expiração
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.renewal_date}
                                        onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Payment Type and Value */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Tipo de Pagamento
                                    </label>
                                    <select
                                        value={formData.is_recurring ? formData.recurrence_type : 'one-time'}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === 'one-time') {
                                                setFormData({ ...formData, is_recurring: false, recurrence_type: 'one-time', renewal_date: '' });
                                            } else {
                                                const newRenewalDate = calculateExpirationDate(formData.purchase_date, value);
                                                setFormData({ ...formData, is_recurring: true, recurrence_type: value as any, renewal_date: newRenewalDate });
                                            }
                                        }}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary"
                                    >
                                        <option value="one-time">Pagamento Único</option>
                                        <option value="recurrent">Recorrente (Mensal Automático)</option>
                                        <option value="monthly">Mensal</option>
                                        <option value="quarterly">Trimestral</option>
                                        <option value="yearly">Anual</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                                        Valor Total (R$)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cost ? formData.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                                        onChange={(e) => {
                                            // Remove tudo que não é número
                                            const rawValue = e.target.value.replace(/\D/g, '');
                                            // Converte para centavos e depois para reais
                                            const numericValue = parseInt(rawValue || '0', 10) / 100;
                                            setFormData({ ...formData, cost: numericValue });
                                        }}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                                <span className="text-sm text-zinc-300">Senha Ativa</span>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Observações
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white outline-none focus:border-primary resize-none"
                                    placeholder="Anotações adicionais..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-black rounded-lg font-medium transition-all"
                                >
                                    {editingPassword ? 'Atualizar' : 'Criar Senha'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PasswordsPage;
