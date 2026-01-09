import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
    category?: string;
}

// Global shortcuts registry
const shortcuts: KeyboardShortcut[] = [];

export const useKeyboardShortcuts = (
    customShortcuts?: KeyboardShortcut[],
    enabled: boolean = true
) => {
    const navigate = useNavigate();

    // Default navigation shortcuts
    const defaultShortcuts: KeyboardShortcut[] = [
        {
            key: 'g',
            alt: true,
            action: () => navigate('/'),
            description: 'Ir para Dashboard',
            category: 'Navegação'
        },
        {
            key: 'd',
            alt: true,
            action: () => navigate('/demands'),
            description: 'Ir para Demandas',
            category: 'Navegação'
        },
        {
            key: 'n',
            alt: true,
            action: () => navigate('/demands/new'),
            description: 'Nova Demanda',
            category: 'Ações'
        },
        {
            key: 'u',
            alt: true,
            action: () => navigate('/users'),
            description: 'Ir para Usuários',
            category: 'Navegação'
        },
        {
            key: '?',
            shift: true,
            action: () => {
                // Toggle shortcuts help modal
                const event = new CustomEvent('toggleShortcutsHelp');
                window.dispatchEvent(event);
            },
            description: 'Mostrar atalhos',
            category: 'Ajuda'
        }
    ];

    const allShortcuts = [...defaultShortcuts, ...(customShortcuts || [])];

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        // Ignore if user is typing in an input
        const target = event.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            return;
        }

        for (const shortcut of allShortcuts) {
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
            const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey || shortcut.ctrl;
            const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
            const altMatch = shortcut.alt ? event.altKey : !event.altKey;

            // Special handling for CMD+K (allow meta key)
            if (shortcut.key === 'k' && shortcut.meta) {
                if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    shortcut.action();
                    return;
                }
                continue;
            }

            if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                event.preventDefault();
                shortcut.action();
                return;
            }
        }
    }, [allShortcuts, enabled]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return {
        shortcuts: allShortcuts,
        registerShortcut: (shortcut: KeyboardShortcut) => {
            shortcuts.push(shortcut);
        },
        unregisterShortcut: (key: string) => {
            const index = shortcuts.findIndex(s => s.key === key);
            if (index > -1) shortcuts.splice(index, 1);
        }
    };
};

// Component to display shortcuts help
export const getShortcutDisplay = (shortcut: KeyboardShortcut): string => {
    const keys: string[] = [];

    if (shortcut.ctrl) keys.push('Ctrl');
    if (shortcut.meta) keys.push('⌘');
    if (shortcut.alt) keys.push('Alt');
    if (shortcut.shift) keys.push('Shift');
    keys.push(shortcut.key.toUpperCase());

    return keys.join(' + ');
};

export default useKeyboardShortcuts;
