import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../contexts/PermissionsContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface PermissionRouteProps {
    resource: string;
    action?: 'view' | 'edit' | 'delete';
    children?: React.ReactNode;
}

/**
 * A route wrapper that checks permissions from the database.
 * Uses the PermissionsContext to verify if the current user
 * has the required permission for the specified resource and action.
 */
export const PermissionRoute: React.FC<PermissionRouteProps> = ({
    resource,
    action = 'view',
    children
}) => {
    const { profile, loading: authLoading } = useAuth();
    const { can, loading: permLoading } = usePermissions();
    const location = useLocation();

    const isLoading = authLoading || permLoading;

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-zinc-500 gap-3">
                <Loader2 size={24} className="animate-spin" />
                <span className="animate-pulse">Verificando permissões...</span>
            </div>
        );
    }

    // Check if user is admin/master (always has access)
    const role = profile?.role?.toLowerCase() || '';
    const isAdmin = ['admin', 'administrador', 'master'].includes(role) || profile?.permission_level === '4';

    // Check permission from database
    const hasPermission = isAdmin || can(resource, action);

    if (!hasPermission) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-8">
                <div className="bg-red-500/10 p-6 rounded-full mb-6 animate-in zoom-in duration-300">
                    <ShieldAlert size={64} className="text-red-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    Acesso Negado
                </h2>
                <p className="text-zinc-400 max-w-md mx-auto mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                    Você não tem permissão para acessar esta página.
                </p>
                <div className="flex items-center gap-2 text-zinc-500 text-sm bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800 animate-in fade-in duration-500 delay-200">
                    <span>Recurso:</span>
                    <code className="text-primary">{resource}</code>
                    <span>•</span>
                    <span>Ação:</span>
                    <code className="text-primary">{action}</code>
                </div>
                <p className="text-zinc-600 text-sm mt-6 animate-in fade-in duration-500 delay-300">
                    Entre em contato com o administrador para solicitar acesso.
                </p>
            </div>
        );
    }

    return children ? <>{children}</> : <Outlet />;
};

export default PermissionRoute;
