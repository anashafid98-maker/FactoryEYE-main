import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings as SettingsIcon, AlertTriangle, Users, FileText, Wrench } from 'lucide-react';

interface NavSidebarProps {
  onOpenMaintenance?: () => void;
}

const NavSidebar: React.FC<NavSidebarProps> = ({ onOpenMaintenance }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items
  const navItems = [
    { path: '/overview', label: 'Overview', icon: LayoutDashboard },
    { path: '/equipment', label: 'Équipement', icon: LayoutDashboard },
    { key: 'maintenance', label: 'Plan de Maintenance', icon: Wrench },
    { path: '/alerts', label: 'Alertes', icon: AlertTriangle },
    { path: '/export', label: 'Rapports', icon: FileText },
    { path: '/users', label: 'Utilisateurs', icon: Users },
    { path: '/settings', label: 'Paramètres', icon: SettingsIcon },
  ];

  const isActiveRoute = (path: string) => location.pathname === path;

  const handleNavClick = (item: { path?: string; key?: string; label: string }) => {
    if (item.key === 'maintenance') {
      // Navigate to admin-projects page and open project manager
      navigate('/admin-projects');
      if (onOpenMaintenance) {
        onOpenMaintenance();
      }
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 min-h-full overflow-y-auto border-r border-gray-700 flex-shrink-0">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="font-bold text-white text-lg">actoryEYE</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-2 border-b border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-2">Navigation</h3>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path ? isActiveRoute(item.path) : false;
          return (
            <div
              key={item.key || item.path}
              onClick={() => handleNavClick(item)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-1 ${
                isActive 
                  ? 'bg-teal-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NavSidebar;

