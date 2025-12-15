import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ListTodo,
  Users,
  BarChart3,
  Settings,
  FolderPlus,
  LogOut,
  Database
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePermissions } from '../contexts/PermissionsContext';
import { useAuth } from '../contexts/AuthContext';
import { getSupabase } from '../lib/supabase';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, profile } = useAuth();
  const [appLogo, setAppLogo] = useState('/logo.png');

  // Unified user object for UI
  const user = profile || (authUser ? {
    name: authUser.email?.split('@')[0] || 'User',
    role: 'User',
    avatar_url: authUser.user_metadata?.avatar_url,
    email: authUser.email
  } : null);

  // Fetch App Logo
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { fetchTable } = await import('../lib/api');
        const config = await fetchTable('app_config');
        const logo = config?.find((c: any) => c.key === 'app_logo');
        if (logo?.value) {
          setAppLogo(logo.value);
        }
      } catch (e) {
        console.error("Error fetching logo:", e);
      }
    };
    fetchLogo();
  }, []);

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair?')) {
      const supabase = getSupabase();
      if (supabase) await supabase.auth.signOut();
      navigate('/login');
    }
  };

  const { can, loading } = usePermissions();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', id: 'dashboard' },
    { icon: ListTodo, label: 'Demandas', path: '/demands', id: 'demands' },
    { icon: Users, label: 'Equipe', path: '/users', id: 'team' },
    { icon: BarChart3, label: 'Relatórios', path: '/reports', id: 'reports' },
    { icon: Database, label: 'Cadastros', path: '/registers', id: 'registers' },
    { icon: Settings, label: 'Configurações', path: '/config', id: 'config' },
  ];

  if (loading) return <div className="w-64 h-screen bg-zinc-950 border-r border-zinc-800 shrink-0 animate-pulse"></div>;

  return (
    <aside className="hidden md:flex flex-col w-64 h-full border-r border-border-dark bg-surface-dark p-4 justify-between shrink-0">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-zinc-700"
            style={{ backgroundImage: `url("${appLogo}")` }}
          />
          <div>
            <h1 className="text-white text-lg font-bold tracking-tight">Manager Mkt</h1>
            <p className="text-zinc-500 text-xs text-nowrap">Sistema de Gestão</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                  ${isActive
                    ? 'text-white bg-zinc-900 border-l-2 border-[#bcd200]'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }
                `}
              >
                <item.icon
                  size={20}
                  className={`transition-colors ${isActive ? 'text-[#bcd200]' : 'group-hover:text-zinc-300'}`}
                />
                {item.label}
                {isActive && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#bcd200] shadow-[0_0_8px_rgba(188,210,0,0.5)]"></div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-4 py-4 mt-2 border-t border-border-dark">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0 border border-zinc-600"
              style={{ backgroundImage: user?.avatar_url ? `url("${user.avatar_url}")` : 'none', backgroundColor: user?.avatar_url ? 'transparent' : '#3f3f46' }}
            >
              {!user?.avatar_url && <div className="w-full h-full flex items-center justify-center text-xs text-white uppercase">{user?.name?.slice(0, 2) || 'US'}</div>}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-white text-sm font-medium leading-none truncate">{user?.name || 'Visitante'}</p>
              {/* Fixed: Show Job Title and then Role */}
              <p className="text-zinc-500 text-xs mt-1 truncate">
                {user?.job_titles?.name || 'Sem Cargo'} • {user?.role || 'Acesso Restrito'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
            title="Sair do Sistema"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;