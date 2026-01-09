import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { fetchDemands, fetchTable } from '../lib/api';
import { useAuth } from './AuthContext';

interface AlertsContextType {
    demandsAlertCount: number;
    passwordsAlertCount: number;
    refreshAlerts: () => Promise<void>;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const AlertsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [demands, setDemands] = useState<any[]>([]);
    const [passwords, setPasswords] = useState<any[]>([]);

    // User role detection for filtering demands
    const role = user?.role?.toLowerCase() || '';
    const jobTitle = user?.job_title?.toLowerCase() || '';
    const isAdmin = ['admin', 'administrador', 'master'].includes(role);
    const isSocialMedia = jobTitle.includes('social') || role.includes('social');
    const isDesigner = jobTitle.includes('designer') || role.includes('designer');
    const isVideoMaker = jobTitle.includes('video') || role.includes('video') || jobTitle.includes('vídeo');
    const canViewAllDemands = isAdmin || isSocialMedia;

    // Filtered demands based on user role
    const filteredDemands = useMemo(() => {
        if (canViewAllDemands) return demands;

        if (isDesigner || isVideoMaker) {
            const userId = user?.id;
            const userName = user?.name?.toLowerCase().trim() || '';
            const userEmail = user?.email?.toLowerCase().trim() || '';

            return demands.filter(d => {
                const responsibleId = d.responsible_id;
                const responsibleProfileId = d.responsible?.id;
                const responsibleName = (d.responsible?.name || '').toLowerCase().trim();
                const responsibleEmail = (d.responsible?.email || '').toLowerCase().trim();

                const matchById = responsibleId === userId || responsibleProfileId === userId;
                const matchByName = responsibleName && userName && (
                    responsibleName === userName ||
                    responsibleName.includes(userName) ||
                    userName.includes(responsibleName)
                );
                const matchByEmail = responsibleEmail && userEmail && responsibleEmail === userEmail;

                return matchById || matchByName || matchByEmail;
            });
        }

        return demands;
    }, [demands, canViewAllDemands, isDesigner, isVideoMaker, user]);

    // Count demands about to expire (within 2 days)
    const demandsAlertCount = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return filteredDemands.filter(d => {
            if (!d.deadline) return false;

            // Check if already completed
            const s = d.statuses?.name?.toLowerCase() || '';
            const isCompleted = s.includes('conclu') || s.includes('agendado') || s.includes('postar') || s.includes('entregue');
            if (isCompleted) return false;

            const deadline = new Date(d.deadline.split('T')[0] + 'T12:00:00');
            deadline.setHours(0, 0, 0, 0);

            const diffTime = deadline.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Between 0 and 2 days (inclusive)
            return diffDays >= 0 && diffDays <= 2;
        }).length;
    }, [filteredDemands]);

    // Count passwords with upcoming renewals (within 7 days)
    const passwordsAlertCount = useMemo(() => {
        return passwords.filter(p => {
            if (!p.renewal_date || !p.is_active) return false;
            const [y, m, d] = p.renewal_date.split('-').map(Number);
            const renewalDate = new Date(y, m - 1, d);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 7;
        }).length;
    }, [passwords]);

    const refreshAlerts = async () => {
        try {
            const [demandsData, passwordsData] = await Promise.all([
                fetchDemands(),
                fetchTable('passwords')
            ]);
            setDemands(demandsData || []);
            setPasswords(passwordsData || []);
        } catch (error) {
            console.error('Error refreshing alerts:', error);
        }
    };

    // Initial load
    useEffect(() => {
        if (user) {
            refreshAlerts();
        }
    }, [user]);

    // Refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (user) {
                refreshAlerts();
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [user]);

    return (
        <AlertsContext.Provider value={{ demandsAlertCount, passwordsAlertCount, refreshAlerts }}>
            {children}
        </AlertsContext.Provider>
    );
};

export const useAlerts = () => {
    const context = useContext(AlertsContext);
    if (context === undefined) {
        throw new Error('useAlerts must be used within an AlertsProvider');
    }
    return context;
};
