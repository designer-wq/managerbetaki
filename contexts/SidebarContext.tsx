import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
    isMobileMenuOpen: boolean;
    openMobileMenu: () => void;
    closeMobileMenu: () => void;
    toggleMobileMenu: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isMobileMenuOpen: false,
    openMobileMenu: () => { },
    closeMobileMenu: () => { },
    toggleMobileMenu: () => { },
});

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const openMobileMenu = () => setIsMobileMenuOpen(true);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);
    const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

    return (
        <SidebarContext.Provider value={{ isMobileMenuOpen, openMobileMenu, closeMobileMenu, toggleMobileMenu }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => useContext(SidebarContext);
