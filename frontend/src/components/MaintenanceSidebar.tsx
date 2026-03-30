import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FolderPlus, X } from 'lucide-react';
import ProjectManager from './ProjectManager';
import SensorPointManager from './SensorPointManager';
import { api, mockData, Project, Zone, Equipment, SensorInstallationDB } from '../api/lib/supabase';

interface MaintenanceSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const MaintenanceSidebar: React.FC<MaintenanceSidebarProps> = ({ isOpen, onClose }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [projects, setProjects] = useState<Project[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [sensors, setSensors] = useState<SensorInstallationDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isOpenSidebar = isOpen !== undefined ? isOpen : internalOpen;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectsRes, zonesRes, equipmentRes, sensorsRes] = await Promise.all([
        api.getProjects(),
        api.getZones(1),
        api.getEquipment(1),
        api.getSensorInstallations('1')
      ]);
      setProjects(projectsRes);
      setZones(zonesRes);
      setEquipment(equipmentRes);
      setSensors(sensorsRes);
    } catch (error) {
      console.log('Using mock data:', error);
      setProjects(mockData.projects);
      setZones(mockData.zones);
      setEquipment(mockData.equipment);
      setSensors(mockData.sensorInstallations);
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

  const handleSelectEquipment = (equipmentId: string) => {
    setSelectedEquipmentId(equipmentId);
    setShowProjectManager(false);
  };

  const renderDatabaseTree = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
        </div>
      );
    }

    const displayProjects = projects.length > 0 ? projects : mockData.projects;
    const displayZones = zones.length > 0 ? zones : mockData.zones;
    const displayEquipment = equipment.length > 0 ? equipment : mockData.equipment;

    return displayProjects.map((project) => {
      const projectZones = displayZones.filter(z => z.project?.id === project.id);
      const isProjectExpanded = expandedNodes.has(`project-${project.id}`);

      return (
        <div key={project.id}>
          <div
            className="flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer text-sm transition-colors"
            style={{ paddingLeft: '8px' }}
            onClick={() => toggleNode(`project-${project.id}`)}
          >
            {isProjectExpanded ? (
              <ChevronDown className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" />
            ) : (
              <ChevronRight className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" />
            )}
            <span className="w-2 h-2 rounded-full mr-2 flex-shrink-0 bg-blue-500"></span>
            <span className="text-gray-200 text-xs font-semibold">{project.name}</span>
          </div>

          {isProjectExpanded && projectZones.map((zone) => {
            const zoneEquipment = displayEquipment.filter(e => e.zone?.id === zone.id);
            const isZoneExpanded = expandedNodes.has(`zone-${zone.id}`);

            return (
              <div key={zone.id}>
                <div
                  className="flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer text-sm transition-colors"
                  style={{ paddingLeft: '24px' }}
                  onClick={() => toggleNode(`zone-${zone.id}`)}
                >
                  {isZoneExpanded ? (
                    <ChevronDown className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" />
                  )}
                  <span className="w-2 h-2 rounded-full mr-2 flex-shrink-0 bg-purple-500"></span>
                  <span className="text-gray-300 text-xs">{zone.zoneName}</span>
                </div>

                {isZoneExpanded && zoneEquipment.map((equip) => (
                  <div
                    key={equip.id}
                    className="flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer text-sm transition-colors"
                    style={{ paddingLeft: '40px' }}
                    onClick={() => handleSelectEquipment(String(equip.id))}
                  >
                    <span className="w-3 mr-1"></span>
                    <span className="w-2 h-2 rounded-full mr-2 flex-shrink-0 bg-orange-500"></span>
                    <span className="text-gray-300 text-xs">{equip.reference}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    });
  };

  if (!isOpenSidebar) return null;

  return (
    <>
      <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 h-auto overflow-y-auto border-r border-gray-700 flex-shrink-0 self-start">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Gestion de Projets</h3>
          <button onClick={handleClose} className="p-1 hover:bg-gray-700 rounded transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
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
              className="flex-1 text-xs bg-gray-700 border border-gray-600 text-gray-200 placeholder-gray-400 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button className="p-1 hover:bg-gray-700 rounded transition-colors" onClick={loadData}>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="mb-2 px-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Projets</h3>
            {renderDatabaseTree()}
          </div>
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

export default MaintenanceSidebar;

