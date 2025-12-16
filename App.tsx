import React from 'react';
import { HashRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import DemandsPage from './pages/DemandsPage';
import CreateDemandPage from './pages/CreateDemandPage';
import ReportsPage from './pages/ReportsPage';
import CreateUserPage from './pages/CreateUserPage';
import LoginPage from './pages/LoginPage';
import ConfigPage from './pages/ConfigPage';
import RegistersPage from './pages/RegistersPage';

const Layout = () => {
  return (
    <div className="flex h-screen w-full flex-row bg-zinc-950">
      <Sidebar />
      <Outlet />
    </div>
  );
};

import { ToastProvider } from './components/ui/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { PermissionsProvider } from './contexts/PermissionsContext';

const App = () => {
  return (
    <ToastProvider>
      <Router>
      <AuthProvider>
        <PermissionsProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Authenticated Routes */}
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/demands" element={<DemandsPage />} />
                <Route path="/demands/new" element={<CreateDemandPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/users" element={<CreateUserPage />} />
                <Route path="/config" element={<ConfigPage />} />
                <Route path="/registers" element={<RegistersPage />} />

                {/* Fallbacks for demo purposes */}
                <Route path="/settings" element={<div className="p-10 text-white">Settings Page Placeholder</div>} />
              </Route>
            </Routes>
        </PermissionsProvider>
      </AuthProvider>
      </Router>
    </ToastProvider>
  );
};

export default App;