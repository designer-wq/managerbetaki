import React, { useState } from 'react';
import { Bookmark, BookmarkPlus, Trash2, Check, X } from 'lucide-react';
import { SavedFilter, useSavedFilters } from '../../hooks/useSavedFilters';

interface SavedFiltersMenuProps {
    currentFilters: SavedFilter['filters'];
    onApplyFilter: (filters: SavedFilter['filters']) => void;
}

export const SavedFiltersMenu: React.FC<SavedFiltersMenuProps> = ({
    currentFilters,
    onApplyFilter
}) => {
    const { savedFilters, saveFilter, deleteFilter } = useSavedFilters();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newFilterName, setNewFilterName] = useState('');

    const handleSaveFilter = () => {
        if (!newFilterName.trim()) return;
        saveFilter(newFilterName.trim(), currentFilters);
        setNewFilterName('');
        setIsSaving(false);
    };

    const handleApplyFilter = (filter: SavedFilter) => {
        onApplyFilter(filter.filters);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-all"
            >
                <Bookmark size={16} />
                <span>Filtros Salvos</span>
                {savedFilters.length > 0 && (
                    <span className="text-[10px] font-bold bg-primary text-zinc-900 px-1.5 py-0.5 rounded-full">
                        {savedFilters.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-30"
                        onClick={() => {
                            setIsOpen(false);
                            setIsSaving(false);
                        }}
                    />
                    <div className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-40 overflow-hidden">
                        {/* Header */}
                        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                            <span className="text-sm font-medium text-white">Filtros Salvos</span>
                            <button
                                onClick={() => setIsSaving(!isSaving)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-primary hover:bg-zinc-800 transition-colors"
                                title="Salvar filtro atual"
                            >
                                <BookmarkPlus size={16} />
                            </button>
                        </div>

                        {/* Save New Filter Form */}
                        {isSaving && (
                            <div className="p-3 border-b border-zinc-800 bg-zinc-950/50">
                                <p className="text-xs text-zinc-500 mb-2">Salvar filtro atual como:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newFilterName}
                                        onChange={(e) => setNewFilterName(e.target.value)}
                                        placeholder="Nome do filtro"
                                        className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 outline-none focus:border-primary"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveFilter();
                                            if (e.key === 'Escape') setIsSaving(false);
                                        }}
                                    />
                                    <button
                                        onClick={handleSaveFilter}
                                        disabled={!newFilterName.trim()}
                                        className="p-2 bg-primary text-zinc-900 rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsSaving(false);
                                            setNewFilterName('');
                                        }}
                                        className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Filter List */}
                        <div className="max-h-64 overflow-y-auto">
                            {savedFilters.length === 0 ? (
                                <div className="p-4 text-center text-zinc-500 text-sm">
                                    Nenhum filtro salvo.
                                    <br />
                                    <span className="text-xs">Clique em + para salvar o filtro atual.</span>
                                </div>
                            ) : (
                                savedFilters.map((filter) => (
                                    <div
                                        key={filter.id}
                                        className="flex items-center justify-between px-3 py-2 hover:bg-zinc-800/50 transition-colors group"
                                    >
                                        <button
                                            onClick={() => handleApplyFilter(filter)}
                                            className="flex-1 text-left text-sm text-zinc-300 hover:text-white transition-colors"
                                        >
                                            <span className="font-medium">{filter.name}</span>
                                            <div className="text-[10px] text-zinc-500 mt-0.5">
                                                {new Date(filter.createdAt).toLocaleDateString()}
                                            </div>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteFilter(filter.id);
                                            }}
                                            className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Excluir filtro"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SavedFiltersMenu;
