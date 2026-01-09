import React, { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    ListTodo,
    Users,
    Settings,
    Database,
    LogOut,
    X,
    BarChart3
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlerts } from '../../contexts/AlertsContext';
import { getSupabase } from '../../lib/supabase';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user: authUser, profile } = useAuth();
    const { demandsAlertCount, passwordsAlertCount } = useAlerts();
    const [appLogo, setAppLogo] = useState('/logo.png');

    const user = profile || (authUser ? {
        name: authUser.email?.split('@')[0] || 'User',
        role: 'User',
        avatar_url: authUser.user_metadata?.avatar_url,
        email: authUser.email
    } : null);

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const { fetchTable } = await import('../../lib/api');
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
            onClose();
        }
    };

    const role = user?.role?.toLowerCase() || '';
    const isAdmin = ['admin', 'administrador', 'master'].includes(role);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: [] },
        { icon: BarChart3, label: 'Relatório Designers', path: '/designer-report', roles: [] },
        { icon: ListTodo, label: 'Demandas', path: '/demands', roles: [] },
        { icon: Users, label: 'Equipe', path: '/users', roles: ['admin', 'administrador', 'master', 'gerente', 'manager', 'gestor'] },
        { icon: Database, label: 'Cadastros', path: '/registers', roles: ['admin', 'administrador', 'master'] },
        { icon: Settings, label: 'Configurações', path: '/config', roles: ['admin', 'administrador', 'master'] },
    ];

    const visibleMenuItems = menuItems.filter(item => {
        if (!item.roles || item.roles.length === 0) return true;
        return item.roles.includes(role) || isAdmin;
    });

    const handleNavClick = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                onClick={onClose}
            />

            {/* Sidebar Drawer */}
            <aside className="fixed left-0 top-0 bottom-0 w-72 bg-zinc-950 border-r border-zinc-800 z-50 md:hidden flex flex-col animate-slide-in-left">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div
                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-zinc-700"
                            style={{ backgroundImage: `url("${appLogo}")` }}
                        />
                        <div>
                            <h1 className="text-white text-lg font-bold tracking-tight">Manager Mkt</h1>
                            <p className="text-zinc-500 text-xs">Sistema de Gestão</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
                    {visibleMenuItems.map((item) => {
                        const isActive = item.path === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={handleNavClick}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                                        ? 'text-white bg-zinc-800 border-l-2 border-primary'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                                    }
                `}
                            >
                                <item.icon
                                    size={20}
                                    className={isActive ? 'text-primary' : ''}
                                />
                                <span>{item.label}</span>

                                {/* Alert Badge for Demands */}
                                {item.path === '/demands' && demandsAlertCount > 0 && (
                                    <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-amber-500 text-black animate-pulse">
                                        {demandsAlertCount}
                                    </span>
                                )}

                                {/* Alert Badge for Passwords */}
                                {item.path === '/passwords' && passwordsAlertCount > 0 && (
                                    <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-amber-500 text-black animate-pulse">
                                        {passwordsAlertCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-zinc-600"
                                style={{
                                    backgroundImage: user?.avatar_url ? `url("${user.avatar_url}")` : 'none',
                                    backgroundColor: user?.avatar_url ? 'transparent' : '#3f3f46'
                                }}
                            >
                                {!user?.avatar_url && (
                                    <div className="w-full h-full flex items-center justify-center text-sm text-white uppercase font-medium">
                                        {user?.name?.slice(0, 2) || 'US'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium">{user?.name || 'Visitante'}</p>
                                <p className="text-zinc-500 text-xs">{user?.role || 'Acesso Restrito'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Sair"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default MobileSidebar;
