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
        // Mock loading to simulate auth check completion, but no real fetch needed for permissions
        if (!authLoading) {
            setLoading(false);
        }
    }, [authLoading]);

    const can = (module: string, action: PermissionAction): boolean => {
        return true; // Always allow everything
    };

    return (
        <PermissionsContext.Provider value={{ can, loading: loading || authLoading }}>
            {children}
        </PermissionsContext.Provider>
    );
};

export const usePermissions = () => useContext(PermissionsContext);
