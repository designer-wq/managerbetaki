import React from 'react';
import { Search, Bell, Plus, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAddClick?: () => void;
  addButtonText?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, onAddClick, addButtonText }) => {
  return (
    <header className="flex items-center justify-between border-b border-border-dark bg-surface-dark px-8 py-5 shrink-0 z-10">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-white p-2">
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-white text-2xl font-bold leading-tight">{title}</h2>
          {subtitle && <p className="text-zinc-400 text-sm mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-6">
        <label className="hidden md:flex items-center h-12 w-80 bg-highlight rounded-[6px] px-4 border border-transparent focus-within:border-primary/50 transition-all">
          <Search className="text-zinc-400" size={20} />
          <input
            className="bg-transparent border-none text-white placeholder-zinc-500 focus:ring-0 w-full ml-2 text-sm outline-none"
            placeholder="Search..."
            type="text"
          />
        </label>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center size-10 rounded-full bg-highlight text-white hover:bg-zinc-700 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full"></span>
          </button>

          {onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-zinc-900 font-bold text-sm hover:brightness-110 transition-all"
            >
              <Plus size={20} />
              <span>{addButtonText || 'Novo'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;