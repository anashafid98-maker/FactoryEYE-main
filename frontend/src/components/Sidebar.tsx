
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown, FolderPlus, LayoutDashboard, Settings as SettingsIcon, AlertTriangle, Users, FileText } from 'lucide-react';
import { SensorNode } from '../data/mockData';
import ProjectManager from './ProjectManager';
import SensorPointManager from './SensorPointManager';
import { api, mockData, Project, Zone, Equipment, SensorInstallationDB } from '../api/lib/supabase';

interface SidebarProps {
  data: SensorNode[];
  onSensorClick: (sensorId: string) => void;
  onEquipmentFilter?: (equipmentId: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ data, onSensorClick, onEquipmentFilter }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['1', '2', '3', '4'])
  );
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [activeEquipmentId, setActiveEquipmentId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [sensors, setSensors] = useState<SensorInstallationDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);

  // Navigation items
  const navItems = [
    { path: '/overview', label: 'Overview', icon: LayoutDashboard },
    { path: '/equipment', label: 'Équipement', icon: LayoutDashboard },
    { path: '/admin-projects', label: 'Plan de Maintenance', icon: LayoutDashboard },
    { path: '/alerts', label: 'Alertes', icon: AlertTriangle },
    { path: '/export', label: 'Rapports', icon: FileText },
    { path: '/users', label: 'Utilisateurs', icon: Users },
    { path: '/settings', label: 'Paramètres', icon: SettingsIcon },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Try to load from API first
      const [projectsRes, zonesRes, equipmentRes, sensorsRes] = await Promise.all([
        api.getProjects(),
        api.getZones(1), // Default project
        api.getEquipment(1), // Default zone
        api.getSensorInstallations('1') // Default equipment
      ]);
      setProjects(projectsRes);
      setZones(zonesRes);
      setEquipment(equipmentRes);
      setSensors(sensorsRes);
      setUseMockData(false);
    } catch (error) {
      console.log('Using mock data:', error);
      // Fall back to mock data
      setProjects(mockData.projects);
      setZones(mockData.zones);
      setEquipment(mockData.equipment);
      setSensors(mockData.sensorInstallations);
      setUseMockData(true);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const handleNodeClick = (node: SensorNode, hasChildren: boolean) => {
    if (hasChildren) {
      toggleNode(node.id);
    } else if (node.type === 'sensor') {
      onSensorClick(node.id);
    }
  };

  const renderNode = (node: SensorNode, level: number = 0) => {
    const hasChildren = !!(node.children && node.children.length > 0);
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id}>
        <div
          className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm transition-colors"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleNodeClick(node, hasChildren)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" />
            ) : (
              <ChevronRight className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" />
            )
          ) : (
            <span className="w-3 mr-1"></span>
          )}

          <span
            className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
              node.status === 'good'
                ? 'bg-green-500'
                : node.status === 'alarm'
                ? 'bg-red-500'
                : 'bg-gray-400'
            }`}
          ></span>

          <span className="text-gray-600 dark:text-gray-300 text-xs">{node.name}</span>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleSelectEquipment = (equipmentId: string) => {
    setSelectedEquipmentId(equipmentId);
    setShowProjectManager(false);
  };

  const handleSensorClickInternal = (sensorId: string) => {
    onSensorClick(sensorId);
  };

  const isActiveRoute = (path: string) => location.pathname === path;

  const renderDatabaseTree = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
        </div>
      );
    }

    // Handle case where API returns undefined
    const projectList = projects || [];
    const zoneList = zones || [];
    const equipmentList = equipment || [];
    const sensorList = sensors || [];

    // Use mock data in demo mode or if data is empty
    const displayProjects = projectList.length > 0 ? projectList : mockData.projects;
    const displayZones = zoneList.length > 0 ? zoneList : mockData.zones;
    const displayEquipment = equipmentList.length > 0 ? equipmentList : mockData.equipment;
    const displaySensors = sensorList.length > 0 ? sensorList : mockData.sensorInstallations;

    return displayProjects.map((project) => {
      const projectZones = displayZones.filter(z => z.project?.id === project.id);
      const isProjectExpanded = expandedNodes.has(`project-${project.id}`);

      return (
        <div key={project.id}>
          <div
            className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm transition-colors"
            style={{ paddingLeft: '8px' }}
            onClick={() => toggleNode(`project-${project.id}`)}
          >
            {isProjectExpanded ? (
              <ChevronDown className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" />
            ) : (
              <ChevronRight className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" />
            )}
            <span className="w-2 h-2 rounded-full mr-2 flex-shrink-0 bg-blue-500"></span>
            <span className="text-gray-700 dark:text-gray-200 text-xs font-semibold">{project.name}</span>
          </div>

          {isProjectExpanded && projectZones.map((zone) => {
            const zoneEquipment = displayEquipment.filter(e => e.zone?.id === zone.id);
            const isZoneExpanded = expandedNodes.has(`zone-${zone.id}`);

            return (
              <div key={zone.id}>
                <div
                  className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm transition-colors"
                  style={{ paddingLeft: '24px' }}
                  onClick={() => toggleNode(`zone-${zone.id}`)}
                >
                  {isZoneExpanded ? (
                    <ChevronDown className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" />
                  )}
                  <span className="w-2 h-2 rounded-full mr-2 flex-shrink-0 bg-purple-500"></span>
                  <span className="text-gray-600 dark:text-gray-300 text-xs">{zone.zoneName}</span>
                </div>

                {isZoneExpanded && zoneEquipment.map((equip) => {
                  const equipSensors = displaySensors.filter(s => s.equipment_id === String(equip.id));
                  const isEquipExpanded = expandedNodes.has(`equipment-${equip.id}`);

                  return (
                    <div key={equip.id}>
                      <div
                        className={`flex items-center py-1 px-2 cursor-pointer text-sm transition-colors ${
                          activeEquipmentId === String(equip.id) ? 'bg-teal-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        style={{ paddingLeft: '40px' }}
                        onClick={() => {
                          toggleNode(`equipment-${equip.id}`);
                          setActiveEquipmentId(String(equip.id));
                          onEquipmentFilter?.(String(equip.id));
                        }}
                      >
                        {isEquipExpanded ? (
                          <ChevronDown className={`w-3 h-3 mr-1 flex-shrink-0 ${
                            activeEquipmentId === String(equip.id) ? 'text-white' : 'text-gray-400'
                          }`} />
                        ) : (
                          <ChevronRight className={`w-3 h-3 mr-1 flex-shrink-0 ${
                            activeEquipmentId === String(equip.id) ? 'text-white' : 'text-gray-400'
                          }`} />
                        )}
                        <span className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                          activeEquipmentId === String(equip.id) ? 'bg-white' : 'bg-orange-500'
                        }`}></span>
                        <span className={`text-xs ${
                          activeEquipmentId === String(equip.id) ? 'font-semibold text-white' : 'text-gray-600 dark:text-gray-300'
                        }`}>{equip.reference}</span>
                      </div>

                      {isEquipExpanded && equipSensors.map((sensor) => {
                        return (
                          <div
                            key={sensor.id}
                            className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm transition-colors"
                            style={{ paddingLeft: '56px' }}
                            onClick={() => handleSensorClickInternal(sensor.id)}
                          >
                            <span className="w-3 mr-1"></span>
                            <span className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                              sensor.is_active ? 'bg-green-500' : 'bg-gray-400'
                            }`}></span>
                            <span className="text-gray-600 dark:text-gray-300 text-xs">{sensor.sensor_name}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <>
      <div className="w-64 bg-white dark:bg-gray-800 h-auto overflow-y-auto border-r border-gray-200 dark:border-gray-700 flex-shrink-0 self-start">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-bold text-gray-800 dark:text-white text-lg">actoryEYE</span>
          </div>
          {useMockData && (
            <div className="mt-2 text-xs text-yellow-500">
              Mode demonstration
            </div>
          )}
        </div>

        {/* Page Navigation */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">Navigation</h3>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(item.path);
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-1 ${
                  active 
                    ? 'bg-teal-600 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>

        <div className="p-2">
          <div className="mb-3 px-2">
            <button
              onClick={() => setShowProjectManager(true)}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-lg text-xs font-medium transition-all shadow-md"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Gerer les Projets</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 mb-3 px-2">
            <input
              type="text"
              placeholder="Filter by zone or asset"
              className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 placeholder-gray-400 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" onClick={loadData}>
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="mb-2 px-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Projets</h3>
            {renderDatabaseTree()}
          </div>

          {data && data.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 px-2">Exemples</h3>
              {data.map((node) => renderNode(node))}
            </div>
          )}
        </div>
      </div>

      {showProjectManager && (
        <ProjectManager
          onClose={() => setShowProjectManager(false)}
          onSelectEquipment={handleSelectEquipment}
        />
      )}

      {selectedEquipmentId && (
        <SensorPointManager
          equipmentId={selectedEquipmentId}
          onClose={() => setSelectedEquipmentId(null)}
        />
      )}
    </>
  );
};

export default Sidebar;

