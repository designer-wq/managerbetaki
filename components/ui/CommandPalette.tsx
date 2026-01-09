import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Home,
    FileText,
    Plus,
    Users,
    Settings,
    Command,
    ArrowRight,
    Clock,
    X,
    Hash
} from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

interface CommandItem {
    id: string;
    type: 'navigation' | 'demand' | 'action' | 'user';
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
    keywords?: string[];
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [demands, setDemands] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Navigation commands
    const navigationCommands: CommandItem[] = [
        {
            id: 'nav-dashboard',
            type: 'navigation',
            title: 'Dashboard',
            subtitle: 'Ir para o painel principal',
            icon: <Home size={18} />,
            action: () => { navigate('/'); onClose(); },
            keywords: ['home', 'inicio', 'painel']
        },
        {
            id: 'nav-demands',
            type: 'navigation',
            title: 'Demandas',
            subtitle: 'Ver todas as demandas',
            icon: <FileText size={18} />,
            action: () => { navigate('/demands'); onClose(); },
            keywords: ['tarefas', 'pedidos', 'jobs']
        },
        {
            id: 'nav-new-demand',
            type: 'navigation',
            title: 'Nova Demanda',
            subtitle: 'Criar uma nova demanda',
            icon: <Plus size={18} />,
            action: () => { navigate('/demands/new'); onClose(); },
            keywords: ['criar', 'adicionar', 'new']
        },
        {
            id: 'nav-users',
            type: 'navigation',
            title: 'Usuários',
            subtitle: 'Gerenciar usuários',
            icon: <Users size={18} />,
            action: () => { navigate('/users'); onClose(); },
            keywords: ['pessoas', 'equipe', 'team']
        },
        {
            id: 'nav-config',
            type: 'navigation',
            title: 'Configurações',
            subtitle: 'Ajustes do sistema',
            icon: <Settings size={18} />,
            action: () => { navigate('/config'); onClose(); },
            keywords: ['settings', 'ajustes', 'preferencias']
        }
    ];

    // Fetch demands for search
    useEffect(() => {
        if (isOpen && query.length >= 2) {
            const searchDemands = async () => {
                const supabase = getSupabase();
                if (!supabase) return;
                setIsLoading(true);
                try {
                    const { data } = await supabase
                        .from('demands')
                        .select('id, title, code, status:statuses(name)')
                        .or(`title.ilike.%${query}%,code.ilike.%${query}%`)
                        .limit(5);

                    setDemands(data || []);
                } catch (error) {
                    console.error('Error searching demands:', error);
                }
                setIsLoading(false);
            };

            const debounce = setTimeout(searchDemands, 300);
            return () => clearTimeout(debounce);
        } else {
            setDemands([]);
        }
    }, [query, isOpen]);

    // Fetch users for search
    useEffect(() => {
        if (isOpen && query.length >= 2) {
            const searchUsers = async () => {
                const supabase = getSupabase();
                if (!supabase) return;
                try {
                    const { data } = await supabase
                        .from('users')
                        .select('id, name, email')
                        .ilike('name', `%${query}%`)
                        .limit(3);

                    setUsers(data || []);
                } catch (error) {
                    console.error('Error searching users:', error);
                }
            };

            const debounce = setTimeout(searchUsers, 300);
            return () => clearTimeout(debounce);
        } else {
            setUsers([]);
        }
    }, [query, isOpen]);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // Save search to recent
    const saveRecentSearch = useCallback((term: string) => {
        if (term.length < 2) return;
        const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    }, [recentSearches]);

    // Build filtered commands list
    const getFilteredCommands = useCallback((): CommandItem[] => {
        const results: CommandItem[] = [];
        const lowerQuery = query.toLowerCase();

        // Filter navigation commands
        const filteredNav = navigationCommands.filter(cmd => {
            if (!query) return true;
            return (
                cmd.title.toLowerCase().includes(lowerQuery) ||
                cmd.subtitle?.toLowerCase().includes(lowerQuery) ||
                cmd.keywords?.some(k => k.includes(lowerQuery))
            );
        });
        results.push(...filteredNav);

        // Add demand results
        demands.forEach(demand => {
            results.push({
                id: `demand-${demand.id}`,
                type: 'demand',
                title: demand.title,
                subtitle: demand.code ? `#${demand.code}` : `ID: ${demand.id}`,
                icon: <Hash size={18} />,
                action: () => {
                    saveRecentSearch(demand.title);
                    navigate('/demands');
                    onClose();
                    // Could trigger edit modal here
                }
            });
        });

        // Add user results
        users.forEach(user => {
            results.push({
                id: `user-${user.id}`,
                type: 'user',
                title: user.name,
                subtitle: user.email,
                icon: <Users size={18} />,
                action: () => {
                    saveRecentSearch(user.name);
                    navigate('/users');
                    onClose();
                }
            });
        });

        return results;
    }, [query, demands, users, navigate, onClose, saveRecentSearch]);

    const filteredCommands = getFilteredCommands();

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredCommands.length]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(i => Math.max(i - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredCommands[selectedIndex]) {
                        filteredCommands[selectedIndex].action();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filteredCommands, onClose]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            selectedEl?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'navigation': return 'Navegação';
            case 'demand': return 'Demanda';
            case 'user': return 'Usuário';
            case 'action': return 'Ação';
            default: return '';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'navigation': return 'bg-blue-500/20 text-blue-400';
            case 'demand': return 'bg-primary/20 text-primary';
            case 'user': return 'bg-purple-500/20 text-purple-400';
            case 'action': return 'bg-orange-500/20 text-orange-400';
            default: return 'bg-zinc-500/20 text-zinc-400';
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl z-50 animate-scale-in">
                <div className="card-enterprise overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                        <Search size={20} className="text-zinc-500" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar demandas, páginas, usuários..."
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-500 text-sm"
                        />
                        {isLoading && (
                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        )}
                        <button
                            onClick={onClose}
                            className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Results */}
                    <div ref={listRef} className="max-h-[400px] overflow-y-auto">
                        {/* Recent searches */}
                        {!query && recentSearches.length > 0 && (
                            <div className="px-3 py-2">
                                <p className="text-xs text-zinc-500 px-2 mb-2 flex items-center gap-1.5">
                                    <Clock size={12} />
                                    Buscas recentes
                                </p>
                                {recentSearches.map((term, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setQuery(term)}
                                        className="w-full text-left px-2 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Commands list */}
                        {filteredCommands.length > 0 ? (
                            <div className="py-2">
                                {filteredCommands.map((cmd, index) => (
                                    <button
                                        key={cmd.id}
                                        data-index={index}
                                        onClick={cmd.action}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${selectedIndex === index
                                            ? 'bg-primary/10 text-white'
                                            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <span className={`p-1.5 rounded ${getTypeColor(cmd.type)}`}>
                                            {cmd.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{cmd.title}</p>
                                            {cmd.subtitle && (
                                                <p className="text-xs text-zinc-500 truncate">{cmd.subtitle}</p>
                                            )}
                                        </div>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getTypeColor(cmd.type)}`}>
                                            {getTypeLabel(cmd.type)}
                                        </span>
                                        {selectedIndex === index && (
                                            <ArrowRight size={14} className="text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : query.length >= 2 && !isLoading ? (
                            <div className="py-8 text-center">
                                <Search size={32} className="mx-auto text-zinc-600 mb-2" />
                                <p className="text-sm text-zinc-500">Nenhum resultado para "{query}"</p>
                            </div>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">↑↓</kbd>
                                navegar
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">↵</kbd>
                                selecionar
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">esc</kbd>
                                fechar
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-zinc-600">
                            <Command size={12} />
                            <span>K</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CommandPalette;
