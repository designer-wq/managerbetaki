import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchTable } from '../lib/api';

type PermissionAction = 'view' | 'edit' | 'delete';

interface PermissionsContextType {
    can: (module: string, action: PermissionAction) => boolean;
    loading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
    can: () => false,
    loading: true
});

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { profile, isAdmin, loading: authLoading } = useAuth();
    const [permissionsMap, setPermissionsMap] = useState<Record<string, Record<string, boolean>>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPermissions = async () => {
            if (authLoading) return;
            if (!profile) {
                setLoading(false);
                return;
            }

            if (isAdmin) {
                setLoading(false);
                return; // Admin always has access
            }

            const data = await fetchTable('permissions');
            const map: Record<string, Record<string, boolean>> = {};

            if (data) {
                // Filter permissions for the current user's role
                const userPermissions = data.filter((p: any) => p.role === profile.role);
                userPermissions.forEach((p: any) => {
                    if (!map[p.module]) map[p.module] = {};
                    map[p.module]['view'] = p.view;
                    map[p.module]['edit'] = p.edit;
                    map[p.module]['delete'] = p.delete;
                });
            }

            setPermissionsMap(map);
            setLoading(false);
        };

        loadPermissions();
    }, [profile, authLoading, isAdmin]);

    const can = (module: string, action: PermissionAction): boolean => {
        if (loading) return false;
        if (isAdmin) return true; // Admin override
        if (!profile) return false;

        const modulePerms = permissionsMap[module];
        if (!modulePerms) return false; // Default deny if no record found

        return !!modulePerms[action];
    };

    return (
        <PermissionsContext.Provider value={{ can, loading: loading || authLoading }}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => useContext(PermissionsContext);
