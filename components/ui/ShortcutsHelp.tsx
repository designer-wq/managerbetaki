import React, { useState, useEffect } from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { getShortcutDisplay, KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

interface ShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
    shortcuts: KeyboardShortcut[];
}

export const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({
    isOpen,
    onClose,
    shortcuts
}) => {
    // Group shortcuts by category
    const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
        const category = shortcut.category || 'Outros';
        if (!acc[category]) acc[category] = [];
        acc[category].push(shortcut);
        return acc;
    }, {} as Record<string, KeyboardShortcut[]>);

    useEffect(() => {
        if (!isOpen) return;

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50 animate-scale-in">
                <div className="card-enterprise overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Keyboard size={20} className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Atalhos de Teclado</h2>
                                <p className="text-xs text-zinc-500">Navegue mais rápido pelo sistema</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 max-h-[60vh] overflow-y-auto">
                        {Object.entries(groupedShortcuts).map(([category, items]) => (
                            <div key={category} className="mb-6 last:mb-0">
                                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                                    {category}
                                </h3>
                                <div className="space-y-2">
                                    {items.map((shortcut, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                                        >
                                            <span className="text-sm text-zinc-300">{shortcut.description}</span>
                                            <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400 font-mono">
                                                {shortcut.meta && <Command size={12} />}
                                                {getShortcutDisplay(shortcut).replace('⌘ + ', '')}
                                            </kbd>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Special Shortcut */}
                        <div className="mt-6 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <span className="text-sm text-primary">Busca Global</span>
                                <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded text-xs text-primary font-mono">
                                    <Command size={12} />
                                    K
                                </kbd>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02]">
                        <p className="text-xs text-zinc-500 text-center">
                            Pressione <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">?</kbd> a qualquer momento para ver esta ajuda
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ShortcutsHelp;
