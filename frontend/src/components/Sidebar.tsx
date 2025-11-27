import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Settings, 
  Bell, 
  LogOut,
  Factory,
  FileDown,
  Activity
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role') as 'ADMIN' | 'USER';
  const userId = localStorage.getItem('userId');

  const getDashboardPath = () => {
    return userRole === 'ADMIN' ? '/overview' : '/user-dashboard';
  };

  const getEquipmentPath = () => {
    return userRole === 'ADMIN' ? '/equipment' : '/user-equipment';
  };

  const getProjectsPath = () => {
    return userRole === 'ADMIN' ? '/admin-projects' : '/projects';
  };

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      text: 'Vue d\'ensemble', 
      path: getDashboardPath(),
      allowedRoles: ['ADMIN', 'USER']
    },
    { 
      icon: Factory, 
      text: 'Équipements', 
      path: getEquipmentPath(),
      allowedRoles: ['ADMIN', 'USER']
    },
    { 
      icon: FolderKanban, 
      text: 'Plan de maintenance', 
      path: getProjectsPath(),
      allowedRoles: ['ADMIN', 'USER']
    },
    { 
      icon: FileDown, 
      text: 'Exporter', 
      path: '/export',
      allowedRoles: ['ADMIN','USER']
    },
    { 
      icon: Bell, 
      text: 'Alertes', 
      path: '/alerts',
      allowedRoles: ['ADMIN', 'USER']
    },
    { 
      icon: Settings, 
      text: 'Paramètres', 
      path: '/settings',
      allowedRoles: ['ADMIN', 'USER']
    },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col justify-between min-h-screen">
      <div>
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            FactoryEYE
          </h1>
        </div>
        <nav className="mt-4">
          {menuItems.map((item, index) => (
            item.allowedRoles.includes(userRole) && (
              <NavLink
                key={index}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 ${
                    isActive ? 'bg-gray-100 border-l-4 border-blue-500' : ''
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.text}</span>
              </NavLink>
            )
          ))}
        </nav>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
  <div className="flex items-center gap-3 mb-4">
          <img
            src="https://tse3.mm.bing.net/th/id/OIP.GxwC7rumCfFT465ySJTfIwHaHa?rs=1&pid=ImgDetMain"
            alt="Profile"
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <p className="text-sm font-medium text-slate-800">
              {localStorage.getItem('username') || "Utilisateur"}
            </p>
            <p className="text-xs text-slate-500">{userRole}</p>
          </div>
        </div>
        <button 
    className="flex items-center gap-2 text-slate-600 hover:text-red-600 w-full px-2 py-1.5 hover:bg-gray-100 rounded transition-colors"
    onClick={handleLogout}
  >
    <LogOut className="h-5 w-5 min-w-[20px]" />
    <span className="whitespace-nowrap">Déconnexion</span>
  </button>
</div>
    </div>
  );
};

export default Sidebar;