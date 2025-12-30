import React from 'react';
import { X, Trash2, UserPlus, CheckCircle, AlertCircle, Clock, Archive } from 'lucide-react';

interface BulkActionsBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onChangeStatus: (statusId: string) => void;
    onAssignDesigner: (designerId: string) => void;
    onDelete: () => void;
    statuses: { id: string; name: string; color?: string }[];
    designers: { id: string; name: string }[];
    isLoading?: boolean;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
    selectedCount,
    onClearSelection,
    onChangeStatus,
    onAssignDesigner,
    onDelete,
    statuses,
    designers,
    isLoading = false
}) => {
    const [showStatusMenu, setShowStatusMenu] = React.useState(false);
    const [showDesignerMenu, setShowDesignerMenu] = React.useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

    if (selectedCount === 0) return null;

    return (
        <>
            {/* Bulk Actions Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
                <div className="flex items-center gap-4 px-6 py-3 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl">
                    {/* Selected Count */}
                    <div className="flex items-center gap-2 pr-4 border-r border-zinc-700">
                        <div className="flex items-center justify-center size-8 rounded-full bg-primary text-zinc-900 font-bold text-sm">
                            {selectedCount}
                        </div>
                        <span className="text-white text-sm font-medium">
                            {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}
                        </span>
                        <button
                            onClick={onClearSelection}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors ml-1"
                            title="Limpar seleção"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Status Action */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowStatusMenu(!showStatusMenu);
                                setShowDesignerMenu(false);
                            }}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            <CheckCircle size={16} />
                            <span>Alterar Status</span>
                        </button>

                        {showStatusMenu && (
                            <div className="absolute bottom-full left-0 mb-2 w-56 py-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                                {statuses.map(status => (
                                    <button
                                        key={status.id}
                                        onClick={() => {
                                            onChangeStatus(status.id);
                                            setShowStatusMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-zinc-700 transition-colors"
                                    >
                                        <span
                                            className="size-3 rounded-full"
                                            style={{ backgroundColor: status.color || '#71717a' }}
                                        />
                                        <span className="text-white">{status.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Assign Designer Action */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowDesignerMenu(!showDesignerMenu);
                                setShowStatusMenu(false);
                            }}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            <UserPlus size={16} />
                            <span>Atribuir Designer</span>
                        </button>

                        {showDesignerMenu && (
                            <div className="absolute bottom-full left-0 mb-2 w-56 py-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                                <button
                                    onClick={() => {
                                        onAssignDesigner('');
                                        setShowDesignerMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-zinc-700 transition-colors text-zinc-400"
                                >
                                    <UserPlus size={14} />
                                    <span>Remover atribuição</span>
                                </button>
                                <div className="border-t border-zinc-700 my-1" />
                                {designers.map(designer => (
                                    <button
                                        key={designer.id}
                                        onClick={() => {
                                            onAssignDesigner(designer.id);
                                            setShowDesignerMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-zinc-700 transition-colors"
                                    >
                                        <div className="size-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                                            {designer.name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-white">{designer.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Delete Action */}
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        <Trash2 size={16} />
                        <span>Excluir</span>
                    </button>

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex items-center gap-2 text-zinc-400">
                            <div className="size-4 border-2 border-zinc-600 border-t-primary rounded-full animate-spin" />
                            <span className="text-sm">Processando...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowDeleteConfirm(false)}
                    />
                    <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md animate-scale-in">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center justify-center size-12 rounded-full bg-red-500/10 text-red-500">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Confirmar Exclusão</h3>
                                <p className="text-zinc-400 text-sm">Esta ação não pode ser desfeita</p>
                            </div>
                        </div>

                        <p className="text-zinc-300 mb-6">
                            Tem certeza que deseja excluir {selectedCount} {selectedCount === 1 ? 'demanda' : 'demandas'}?
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors text-sm font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    onDelete();
                                    setShowDeleteConfirm(false);
                                }}
                                disabled={isLoading}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BulkActionsBar;
