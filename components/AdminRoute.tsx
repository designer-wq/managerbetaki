import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const AdminRoute = () => {
    const { profile, loading } = useAuth();

    if (loading) {
        return <div className="p-10 text-zinc-500 animate-pulse">Verificando permissões...</div>;
    }

    // Admin Level includes: Admin, Administrador, Master
    const isAdmin = ['admin', 'administrador', 'master'].includes(profile?.role?.toLowerCase() || '') || profile?.permission_level === '4';

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="bg-red-500/10 p-6 rounded-full mb-6">
                    <ShieldAlert size={64} className="text-red-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Acesso Negado</h2>
                <p className="text-zinc-400 max-w-md mx-auto mb-6">
                    Você não tem permissão para acessar esta página.
                    Esta área é restrita a administradores.
                </p>
                {/* Optional: Button to go back or home */}
            </div>
        );
    }

    return <Outlet />;
};
