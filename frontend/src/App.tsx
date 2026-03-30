import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavSidebar from './components/NavSidebar';
import MaintenanceSidebar from './components/MaintenanceSidebar';
import Overview from './pages/Overview';
import UserDashboard from './pages/UserDashboard';
import Projects from './pages/Projects';
import AdminProjects from './pages/AdminProjects';
import EquipmentTest from './pages/EquipmentTest';
import Equipment from './pages/Equipment';
import UserEquipment from './pages/UserEquipment';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Users from './pages/Users';
import AddSensor from './pages/AddSensor';
import ReportsExport from './pages/ReportsExport';
import Header from './components/header';
import ErrorBoundary from './components/ErrorBoundary';

import './App.css';

const PrivateRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'ADMIN' | 'USER' }) => {
  const [isDarkMode, setIsDarkMode] = React.useState(() => localStorage.getItem("theme") === "dark");
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('role');
  const [isMaintenanceOpen, setIsMaintenanceOpen] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0f172a] text-black dark:text-white flex flex-col">
      <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <div className="flex flex-1 min-h-[calc(100vh-52px)]">
        <NavSidebar onOpenMaintenance={() => setIsMaintenanceOpen(true)} />
        <MaintenanceSidebar isOpen={isMaintenanceOpen} onClose={() => setIsMaintenanceOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Redirection basée sur le rôle */}
        <Route path="/" element={
          localStorage.getItem('role') === 'ADMIN' ? 
            <Navigate to="/overview" /> : 
            <Navigate to="/user-dashboard" />
        }/>

        {/* Admin routes */}
        <Route path="/overview" element={
          <PrivateRoute requiredRole="ADMIN">
            <Overview />
          </PrivateRoute>
        }/>
        <Route path="/equipment" element={
          <PrivateRoute requiredRole="ADMIN">
            <ErrorBoundary>
              <Equipment />
            </ErrorBoundary>
          </PrivateRoute>

        }/>
        <Route path="/admin-projects" element={
          <PrivateRoute requiredRole="ADMIN">
            <AdminProjects />
          </PrivateRoute>
        }/>

        {/* User routes */}
        <Route path="/user-dashboard" element={
          <PrivateRoute requiredRole="USER">
            <UserDashboard />
          </PrivateRoute>
        }/>
        <Route path="/user-equipment" element={
          <PrivateRoute requiredRole="USER">
            <UserEquipment />
          </PrivateRoute>
        }/>
        <Route path="/projects" element={
          <PrivateRoute requiredRole="USER">
            <Projects />
          </PrivateRoute>
        }/>

        {/* Routes partagées */}
        <Route path="/alerts" element={<PrivateRoute><Alerts /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/users" element={
          <PrivateRoute requiredRole="ADMIN">
            <Users />
          </PrivateRoute>
        }/>
        <Route path="/addsensor" element={
          <PrivateRoute requiredRole="ADMIN">
            <AddSensor />
          </PrivateRoute>
        }/>
        <Route path="/export" element={
          <PrivateRoute requiredRole="ADMIN">
            <ReportsExport />
          </PrivateRoute>
        }/>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;