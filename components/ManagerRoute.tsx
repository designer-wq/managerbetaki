import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const ManagerRoute = () => {
    const { profile, loading } = useAuth();

    if (loading) {
        return <div className="p-10 text-zinc-500 animate-pulse">Verificando permissões...</div>;
    }

    // Manager Level includes: Admin Roles + Gerente + Manager + Gestor
    const isManager = ['admin', 'administrador', 'master', 'gerente', 'manager', 'gestor'].includes(profile?.role?.toLowerCase() || '') ||
        parseInt(profile?.permission_level || '0') >= 2;

    if (!isManager) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="bg-red-500/10 p-6 rounded-full mb-6">
                    <ShieldAlert size={64} className="text-red-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Acesso Negado</h2>
                <p className="text-zinc-400 max-w-md mx-auto mb-6">
                    Você não tem permissão para acessar esta página.
                    Esta área é restrita a gerentes e administradores.
                </p>
            </div>
        );
    }

    return <Outlet />;
};
