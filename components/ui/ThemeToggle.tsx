import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
    variant?: 'icon' | 'dropdown' | 'full';
    className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
    const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

    if (variant === 'icon') {
        return (
            <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all ${className}`}
                title={`Mudar para modo ${resolvedTheme === 'dark' ? 'claro' : 'escuro'}`}
            >
                {resolvedTheme === 'dark' ? (
                    <Sun size={18} className="transition-transform hover:rotate-12" />
                ) : (
                    <Moon size={18} className="transition-transform hover:-rotate-12" />
                )}
            </button>
        );
    }

    if (variant === 'dropdown') {
        return (
            <div className={`relative group ${className}`}>
                <button
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all"
                    title="Tema"
                >
                    {resolvedTheme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                </button>

                <div className="absolute right-0 top-full mt-2 w-40 py-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button
                        onClick={() => setTheme('light')}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-800 transition-colors ${theme === 'light' ? 'text-primary' : 'text-zinc-300'
                            }`}
                    >
                        <Sun size={16} />
                        <span>Claro</span>
                        {theme === 'light' && <span className="ml-auto text-primary">✓</span>}
                    </button>
                    <button
                        onClick={() => setTheme('dark')}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-800 transition-colors ${theme === 'dark' ? 'text-primary' : 'text-zinc-300'
                            }`}
                    >
                        <Moon size={16} />
                        <span>Escuro</span>
                        {theme === 'dark' && <span className="ml-auto text-primary">✓</span>}
                    </button>
                    <button
                        onClick={() => setTheme('system')}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-zinc-800 transition-colors ${theme === 'system' ? 'text-primary' : 'text-zinc-300'
                            }`}
                    >
                        <Monitor size={16} />
                        <span>Sistema</span>
                        {theme === 'system' && <span className="ml-auto text-primary">✓</span>}
                    </button>
                </div>
            </div>
        );
    }

    // Full variant with labels
    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <span className="text-sm text-zinc-400">Tema:</span>
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1">
                <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${theme === 'light'
                        ? 'bg-white text-zinc-900'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                >
                    <Sun size={14} />
                    <span>Claro</span>
                </button>
                <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${theme === 'dark'
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                >
                    <Moon size={14} />
                    <span>Escuro</span>
                </button>
                <button
                    onClick={() => setTheme('system')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${theme === 'system'
                        ? 'bg-primary text-zinc-900'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                >
                    <Monitor size={14} />
                    <span>Auto</span>
                </button>
            </div>
        </div>
    );
};

export default ThemeToggle;
