import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

type PermissionAction = 'view' | 'edit' | 'delete';

interface PermissionsContextType {
    can: (module: string, action: PermissionAction) => boolean;
    loading: boolean;
    refresh: () => void;
}

const PermissionsContext = createContext<PermissionsContextType>({
    can: () => false,
    loading: true,
    refresh: () => { }
});

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { profile, loading: authLoading } = useAuth();
    const [permissionsMap, setPermissionsMap] = useState<Record<string, Record<string, boolean>>>({});
    const [loading, setLoading] = useState(true);

    const loadPermissions = async () => {
        if (authLoading) return;

        if (!profile?.role) {
            console.log('[Permissions] No role found, denying all access');
            setPermissionsMap({});
            setLoading(false);
            return;
        }

        try {
            const { getSupabase } = await import('../lib/supabase');
            const supabase = getSupabase();
            if (!supabase) {
                console.error('[Permissions] Supabase not initialized');
                setLoading(false);
                return;
            }

            const roleKey = profile.role.toLowerCase();
            console.log(`[Permissions] Loading permissions for role: ${roleKey}`);

            const { data, error } = await supabase
                .from('role_permissions')
                .select('*')
                .or(`role.eq.${roleKey},role.eq.${profile.role}`);

            if (error) {
                console.error('[Permissions] Error fetching permissions:', error);
                setLoading(false);
                return;
            }

            if (data && data.length > 0) {
                console.log(`[Permissions] Found ${data.length} permission records for role: ${roleKey}`);
                const map: Record<string, Record<string, boolean>> = {};
                data.forEach((p: any) => {
                    if (!map[p.resource]) map[p.resource] = {};
                    map[p.resource]['view'] = p.can_view === true;
                    map[p.resource]['edit'] = p.can_manage === true;
                    map[p.resource]['create'] = p.can_manage === true;
                    map[p.resource]['delete'] = p.can_delete === true;
                });
                console.log('[Permissions] Permissions map:', map);
                setPermissionsMap(map);
            } else {
                console.warn(`[Permissions] No permissions found for role: ${roleKey}`);
                setPermissionsMap({});
            }
        } catch (err) {
            console.error('[Permissions] Error loading permissions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPermissions();
    }, [profile, authLoading]);

    const can = (module: string, action: PermissionAction): boolean => {
        if (loading) return false;

        // ONLY admin/master/administrador have full access override
        const roleKey = profile?.role?.toLowerCase() || '';
        const isAdmin = ['admin', 'administrador', 'master'].includes(roleKey);

        if (isAdmin) {
            return true;
        }

        // Check permissions from database
        const resource = permissionsMap[module];
        if (!resource) {
            console.log(`[Permissions] No permissions found for module: ${module}, denying access`);
            return false;
        }

        const hasPermission = action === 'view' ? !!resource['view'] :
            action === 'edit' ? !!resource['edit'] :
                action === 'delete' ? !!resource['delete'] : false;

        return hasPermission;
    };

    return (
        <PermissionsContext.Provider value={{ can, loading: loading || authLoading, refresh: loadPermissions }}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => useContext(PermissionsContext);

