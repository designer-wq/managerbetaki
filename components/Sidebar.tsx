import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Settings,
  FolderOpen,
  LogOut,
  Database,
  Key,
  CalendarDays,
  BarChart3,
  CalendarRange
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePermissions } from '../contexts/PermissionsContext';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertsContext';
import { getSupabase } from '../lib/supabase';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, profile } = useAuth();
  const { demandsAlertCount, passwordsAlertCount } = useAlerts();
  const [appLogo, setAppLogo] = useState('/logo.png');
  const [isCollapsed, setIsCollapsed] = useState(true);

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
          let val = logo.value;
          if (!val.startsWith('http') && !val.startsWith('/') && !val.startsWith('data:')) {
            val = '/' + val;
          }
          setAppLogo(val);
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

  // Determine role based on profile
  const role = user?.role?.toLowerCase() || '';
  const jobTitle = user?.job_title?.toLowerCase() || '';
  const isAdmin = ['admin', 'administrador', 'master'].includes(role);
  const isManager = ['gerente', 'manager', 'gestor'].includes(role) || isAdmin;
  const isDesigner = jobTitle.includes('designer') || role.includes('designer');
  const isVideoMaker = jobTitle.includes('video') || role.includes('video') || jobTitle.includes('vídeo');
  const canAccessDashboard = isAdmin || isDesigner || isVideoMaker;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', resource: 'dashboard', dashboardOnly: true },
    { icon: BarChart3, label: 'Relatório Designers', path: '/designer-report', resource: 'dashboard', dashboardOnly: true },
    { icon: CalendarRange, label: 'Calendário Capacidade', path: '/capacity-calendar', resource: 'dashboard', dashboardOnly: true },
    { icon: ListTodo, label: 'Demandas', path: '/demands', resource: 'demands' },
    { icon: FolderOpen, label: 'Arquivos', path: '/files', resource: 'demands' },
    { icon: CalendarDays, label: 'Calendário Sazonal', path: '/seasonal-calendar', resource: 'demands' },
    { icon: Users, label: 'Equipe', path: '/users', resource: 'team' },
    { icon: Database, label: 'Cadastros', path: '/registers', resource: 'registers' },
    { icon: Key, label: 'Senhas', path: '/passwords', resource: 'config', adminOnly: true },
    { icon: Settings, label: 'Configurações', path: '/config', resource: 'config' },
  ];

  // Filter menu items based on permissions from database
  const visibleMenuItems = menuItems.filter((item: any) => {
    // If item is admin-only, only admins can see it
    if (item.adminOnly && !isAdmin) return false;

    // If item is dashboard-only, only admin/designer/videomaker can see it
    if (item.dashboardOnly && !canAccessDashboard) return false;

    // Admin/Master always sees everything
    if (isAdmin) return true;

    // Check permission from database using the 'can' function
    return can(item.resource, 'view');
  });

  if (loading) return <div className="w-64 h-screen bg-zinc-950 border-r border-zinc-800 shrink-0 animate-pulse"></div>;

  return (
    <aside className={`hidden md:flex flex-col h-full border-r border-border-dark bg-surface-dark p-4 justify-between shrink-0 transition-all duration-300 z-30 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex flex-col gap-8">
        <div className={`flex items-center gap-3 px-2 ${isCollapsed ? 'justify-center' : ''} relative`}>
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-zinc-700 shrink-0"
            style={{ backgroundImage: `url("${appLogo}")` }}
          />
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-white text-lg font-bold tracking-tight truncate">Manager Mkt</h1>
              <p className="text-zinc-500 text-xs text-nowrap truncate">Sistema de Gestão</p>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`absolute ${isCollapsed ? 'left-full ml-4 top-2 bg-zinc-800 text-zinc-400 p-1 rounded hover:text-white' : 'right-0 text-zinc-500 hover:text-white'} transition-colors z-50`}
            title={isCollapsed ? "Expandir" : "Recolher"}
          >
            {/* Using a custom conditional icon rendering without extra imports for simplicity if not strictly required, 
                 but actually I need to import lucide icons for consistency.
                 Wait, I can't import easily in replace_file_content if I don't add imports at top. 
                 I'll add imports in a separate step or just use existing icons if available? 
                 I checked the imports, I don't have ChevronLeft/Right. 
                 I will assume I can add them to the import list in the next step or do it all in one multi_replace if I was using that.
                 Since I am using replace_file_content for a big chunk, I better make sure I have the imports.
                 I will check imports first. */}
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            )}
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {visibleMenuItems.map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : ''}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
                  ${isActive
                    ? 'text-white bg-zinc-900 border-l-2 border-[#bcd200]'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }
                  ${isCollapsed ? 'justify-center px-0' : ''}
                `}
              >
                <item.icon
                  size={20}
                  className={`transition-colors shrink-0 ${isActive ? 'text-[#bcd200]' : 'group-hover:text-zinc-300'}`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {/* Alert Badge for Demands */}
                {item.path === '/demands' && demandsAlertCount > 0 && (
                  <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-amber-500 text-black animate-pulse`}>
                    {demandsAlertCount}
                  </span>
                )}

                {/* Alert Badge for Passwords */}
                {item.path === '/passwords' && passwordsAlertCount > 0 && (
                  <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-amber-500 text-black animate-pulse`}>
                    {passwordsAlertCount}
                  </span>
                )}

                {isActive && !(item.path === '/demands' && demandsAlertCount > 0) && !(item.path === '/passwords' && passwordsAlertCount > 0) && (
                  <div className={`absolute ${isCollapsed ? 'top-2 right-2' : 'right-2'} w-1.5 h-1.5 rounded-full bg-[#bcd200] shadow-[0_0_8px_rgba(188,210,0,0.5)]`}></div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2">
        <div className={`flex items-center ${isCollapsed ? 'flex-col justify-center gap-4' : 'justify-between'} px-4 py-4 mt-2 border-t border-border-dark`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0 border border-zinc-600"
              style={{ backgroundImage: user?.avatar_url ? `url("${user.avatar_url}")` : 'none', backgroundColor: user?.avatar_url ? 'transparent' : '#3f3f46' }}
            >
              {!user?.avatar_url && <div className="w-full h-full flex items-center justify-center text-xs text-white uppercase">{user?.name?.slice(0, 2) || 'US'}</div>}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <p className="text-white text-sm font-medium leading-none truncate">{user?.name || 'Visitante'}</p>
                {/* Fixed: Show Job Title and then Role */}
                <p className="text-zinc-500 text-xs mt-1 truncate">
                  {user?.job_titles?.name || 'Sem Cargo'} • {user?.role || 'Acesso Restrito'}
                </p>
              </div>
            )}
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