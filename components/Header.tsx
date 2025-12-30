import React from 'react';
import { Plus, Menu } from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';
import ThemeToggle from './ui/ThemeToggle';
import NotificationsDropdown from './ui/NotificationsDropdown';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAddClick?: () => void;
  addButtonText?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onAddClick, addButtonText }) => {
  const { toggleMobileMenu } = useSidebar();

  return (
    <header className="relative flex items-center justify-between border-b border-border-dark bg-surface-dark px-4 md:px-8 py-4 md:py-5 shrink-0 z-10">
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={toggleMobileMenu}
          className="md:hidden text-zinc-400 hover:text-white p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-white text-xl md:text-2xl font-bold leading-tight">{title}</h2>
          {subtitle && <p className="text-zinc-400 text-xs md:text-sm mt-0.5 md:mt-1 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <ThemeToggle variant="dropdown" />

        {/* Notifications */}
        <NotificationsDropdown />

        {/* Add Button */}
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-zinc-900 font-semibold text-sm hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40"
          >
            <Plus size={18} />
            {addButtonText || 'Adicionar'}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
