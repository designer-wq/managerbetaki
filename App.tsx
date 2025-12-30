import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileSidebar from './components/ui/MobileSidebar';
import DashboardPage from './pages/DashboardPage';
import DemandsPage from './pages/DemandsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import GoalsPage from './pages/GoalsPage';
import CreateDemandPage from './pages/CreateDemandPage';

// Reports V2
import ReportsPage from './pages/reports/ReportsPage';

import CreateUserPage from './pages/CreateUserPage';
import LoginPage from './pages/LoginPage';
import ConfigPage from './pages/ConfigPage';
import RegistersPage from './pages/RegistersPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PermissionRoute } from './components/PermissionRoute';
import { ToastProvider } from './components/ui/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { SidebarProvider, useSidebar } from './contexts/SidebarContext';
import { NotificationsProvider } from './contexts/NotificationsContext';

// Professional Features
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { CommandPalette } from './components/ui/CommandPalette';
import { ShortcutsHelp } from './components/ui/ShortcutsHelp';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { ThemeProvider } from './contexts/ThemeContext';

// Layout with Command Palette and Shortcuts
const LayoutWithFeatures = () => {
  const { isMobileMenuOpen, closeMobileMenu } = useSidebar();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  // Register CMD+K for command palette
  const { shortcuts } = useKeyboardShortcuts([
    {
      key: 'k',
      meta: true,
      action: () => setIsCommandPaletteOpen(true),
      description: 'Busca Global',
      category: 'Ações'
    }
  ]);

  // Listen for shortcuts help toggle
  useEffect(() => {
    const handleToggleHelp = () => setIsShortcutsHelpOpen(prev => !prev);
    window.addEventListener('toggleShortcutsHelp', handleToggleHelp);
    return () => window.removeEventListener('toggleShortcutsHelp', handleToggleHelp);
  }, []);

  return (
    <>
      <div className="flex h-screen w-full flex-row bg-zinc-950">
        <Sidebar />
        <MobileSidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
        <Outlet />
      </div>

      {/* Command Palette (CMD+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Shortcuts Help Modal (Shift+?) */}
      <ShortcutsHelp
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
        shortcuts={shortcuts}
      />
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <ToastProvider>
          <Router>
            <AuthProvider>
              <PermissionsProvider>
                <NotificationsProvider>
                  <SidebarProvider>
                    <Routes>
                      <Route path="/login" element={<LoginPage />} />

                      {/* Authenticated Routes */}
                      <Route element={<ProtectedRoute />}>
                        <Route element={<LayoutWithFeatures />}>
                          {/* Dashboard - uses 'dashboard' permission */}
                          <Route path="/" element={
                            <PermissionRoute resource="dashboard">
                              <DashboardPage />
                            </PermissionRoute>
                          } />

                          {/* Demands - uses 'demands' permission */}
                          <Route path="/demands" element={
                            <PermissionRoute resource="demands">
                              <DemandsPage />
                            </PermissionRoute>
                          } />
                          <Route path="/demands/new" element={
                            <PermissionRoute resource="demands" action="edit">
                              <CreateDemandPage />
                            </PermissionRoute>
                          } />

                          {/* Reports - uses 'reports' permission */}
                          <Route path="/reports" element={
                            <PermissionRoute resource="reports">
                              <ReportsPage />
                            </PermissionRoute>
                          } />

                          {/* Goals - uses 'goals' permission */}
                          <Route path="/goals" element={
                            <PermissionRoute resource="goals">
                              <GoalsPage />
                            </PermissionRoute>
                          } />

                          {/* Team - uses 'team' permission */}
                          <Route path="/users" element={
                            <PermissionRoute resource="team">
                              <CreateUserPage />
                            </PermissionRoute>
                          } />

                          {/* Registers - uses 'registers' permission */}
                          <Route path="/registers" element={
                            <PermissionRoute resource="registers">
                              <RegistersPage />
                            </PermissionRoute>
                          } />

                          {/* Config Routes - uses 'config' permission */}
                          <Route path="/config" element={
                            <PermissionRoute resource="config">
                              <ConfigPage />
                            </PermissionRoute>
                          } />
                          <Route path="/activity-log" element={
                            <PermissionRoute resource="activity_log">
                              <ActivityLogPage />
                            </PermissionRoute>
                          } />

                          {/* Fallbacks for demo purposes */}
                          <Route path="/settings" element={<div className="p-10 text-white">Settings Page Placeholder</div>} />
                        </Route>
                      </Route>
                    </Routes>
                  </SidebarProvider>
                </NotificationsProvider>
              </PermissionsProvider>
            </AuthProvider>
          </Router>
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;