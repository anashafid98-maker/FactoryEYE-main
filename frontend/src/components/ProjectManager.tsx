import React, { useState, useEffect } from 'react';
import { FolderPlus, Plus, ChevronRight, ChevronDown, MapPin, Settings, X, Trash2, Image as ImageIcon } from 'lucide-react';
import { api, mockData, Project, Zone, Equipment } from '../api/lib/supabase';
import DiagramManager from './DiagramManager';

interface ProjectWithDetails extends Project {
  zones?: (Zone & { equipment?: Equipment[] })[];
}

interface ProjectManagerProps {
  onClose: () => void;
  onSelectEquipment?: (equipmentId: string) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ onClose, onSelectEquipment }) => {
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showZoneForm, setShowZoneForm] = useState<string | null>(null);
  const [showEquipmentForm, setShowEquipmentForm] = useState<string | null>(null);
  const [showDiagramManager, setShowDiagramManager] = useState<{ equipmentId: string; equipmentName: string; currentDiagram?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [projectForm, setProjectForm] = useState({ name: '', description: '' });
  const [zoneForm, setZoneForm] = useState({ name: '', description: '', location: '' });
  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    reference: '',
    type: '',
    manufacturer: '',
    model: '',
    serial_number: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      // Fetch all projects
      const projectsData = await api.getProjects();
      
      if (projectsData && Array.isArray(projectsData)) {
        const projectsWithZones = await Promise.all(
          projectsData.map(async (project) => {
            // Fetch zones for each project
            const zonesData = await api.getZones(project.id);
            
            if (zonesData && Array.isArray(zonesData)) {
              const zonesWithEquipment = await Promise.all(
                zonesData.map(async (zone) => {
                  const equipmentData = await api.getEquipment(zone.id);
                  return { ...zone, equipment: equipmentData || [] };
                })
              );
              return { ...project, zones: zonesWithEquipment };
            }
            return { ...project, zones: [] };
          })
        );

        setProjects(projectsWithZones);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.createProject({
        name: projectForm.name,
        description: projectForm.description,
        status: 'active',
        created_by: 'system'
      });
      
      setProjectForm({ name: '', description: '' });
      setShowProjectForm(false);
      loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateZone = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.createZone({
        project_id: projectId,
        name: zoneForm.name,
        description: zoneForm.description,
        location: zoneForm.location
      });
      
      setZoneForm({ name: '', description: '', location: '' });
      setShowZoneForm(null);
      loadProjects();
    } catch (error) {
      console.error('Error creating zone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent, zoneId: string) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.createEquipment({
        zone_id: zoneId,
        name: equipmentForm.name,
        reference: equipmentForm.reference,
        type: equipmentForm.type,
        manufacturer: equipmentForm.manufacturer,
        model: equipmentForm.model,
        serial_number: equipmentForm.serial_number,
        installation_date: new Date().toISOString().split('T')[0],
        status: 'operational'
      });
      
      setEquipmentForm({
        name: '',
        reference: '',
        type: '',
        manufacturer: '',
        model: '',
        serial_number: '',
      });
      setShowEquipmentForm(null);
      loadProjects();
    } catch (error) {
      console.error('Error creating equipment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const toggleZone = (zoneId: string) => {
    const newExpanded = new Set(expandedZones);
    if (newExpanded.has(zoneId)) {
      newExpanded.delete(zoneId);
    } else {
      newExpanded.add(zoneId);
    }
    setExpandedZones(newExpanded);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet et toutes ses zones et équipements ?')) {
      setIsLoading(true);
      try {
        await api.deleteProject(projectId);
        loadProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette zone et tous ses équipements ?')) {
      setIsLoading(true);
      try {
        await api.deleteZone(zoneId);
        loadProjects();
      } catch (error) {
        console.error('Error deleting zone:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet équipement et tous ses capteurs ?')) {
      setIsLoading(true);
      try {
        await api.deleteEquipment(equipmentId);
        loadProjects();
      } catch (error) {
        console.error('Error deleting equipment:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FolderPlus className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Gestion de Projets</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          <div className="mb-4">
            <button
              onClick={() => setShowProjectForm(!showProjectForm)}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Projet</span>
            </button>
          </div>

          {showProjectForm && (
            <form onSubmit={handleCreateProject} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Créer un nouveau projet</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nom du projet"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={2}
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProjectForm(false)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {projects.map((project) => (
              <div key={project.id} className="border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer">
                  <div className="flex items-center space-x-2 flex-1" onClick={() => toggleProject(project.id)}>
                    {expandedProjects.has(project.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                    <FolderPlus className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-gray-600">{project.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowZoneForm(showZoneForm === project.id ? null : project.id)}
                      disabled={isLoading}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      disabled={isLoading}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors disabled:opacity-50"
                      title="Supprimer le projet"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {expandedProjects.has(project.id) && (
                  <div className="p-3 space-y-2">
                    {showZoneForm === project.id && (
                      <form onSubmit={(e) => handleCreateZone(e, project.id)} className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                        <h4 className="text-xs font-semibold text-gray-800 mb-2">Ajouter une zone</h4>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Nom de la zone"
                            value={zoneForm.name}
                            onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Emplacement"
                            value={zoneForm.location}
                            onChange={(e) => setZoneForm({ ...zoneForm, location: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                          />
                          <textarea
                            placeholder="Description"
                            value={zoneForm.description}
                            onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                            rows={2}
                          />
                          <div className="flex space-x-2">
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              Créer
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowZoneForm(null)}
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {project.zones?.map((zone) => (
                      <div key={zone.id} className="border border-gray-200 rounded ml-4">
                        <div className="flex items-center justify-between p-2 bg-white hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center space-x-2 flex-1" onClick={() => toggleZone(zone.id)}>
                            {expandedZones.has(zone.id) ? (
                              <ChevronDown className="w-3 h-3 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-gray-600" />
                            )}
                            <MapPin className="w-3 h-3 text-green-600" />
                            <div>
                              <div className="text-xs font-semibold text-gray-800">{zone.name}</div>
                              {zone.location && (
                                <div className="text-xs text-gray-600">{zone.location}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setShowEquipmentForm(showEquipmentForm === zone.id ? null : zone.id)}
                              disabled={isLoading}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteZone(zone.id);
                              }}
                              disabled={isLoading}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors disabled:opacity-50"
                              title="Supprimer la zone"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {expandedZones.has(zone.id) && (
                          <div className="p-2 space-y-2">
                            {showEquipmentForm === zone.id && (
                              <form onSubmit={(e) => handleCreateEquipment(e, zone.id)} className="bg-orange-50 border border-orange-200 rounded p-3 mb-2">
                                <h4 className="text-xs font-semibold text-gray-800 mb-2">Ajouter un équipement</h4>
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Nom de l'équipement"
                                    value={equipmentForm.name}
                                    onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                                    required
                                  />
                                  <input
                                    type="text"
                                    placeholder="Référence"
                                    value={equipmentForm.reference}
                                    onChange={(e) => setEquipmentForm({ ...equipmentForm, reference: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                                    required
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      placeholder="Type"
                                      value={equipmentForm.type}
                                      onChange={(e) => setEquipmentForm({ ...equipmentForm, type: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Fabricant"
                                      value={equipmentForm.manufacturer}
                                      onChange={(e) => setEquipmentForm({ ...equipmentForm, manufacturer: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Modèle"
                                      value={equipmentForm.model}
                                      onChange={(e) => setEquipmentForm({ ...equipmentForm, model: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Numéro de série"
                                      value={equipmentForm.serial_number}
                                      onChange={(e) => setEquipmentForm({ ...equipmentForm, serial_number: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      type="submit"
                                      disabled={isLoading}
                                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                                    >
                                      Créer
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowEquipmentForm(null)}
                                      disabled={isLoading}
                                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              </form>
                            )}

                            {zone.equipment?.map((equipment) => (
                              <div
                                key={equipment.id}
                                className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded ml-4 hover:bg-gray-50"
                              >
                                <div
                                  className="flex items-center space-x-2 flex-1 cursor-pointer"
                                  onClick={() => onSelectEquipment && onSelectEquipment(equipment.id)}
                                >
                                  <Settings className="w-3 h-3 text-orange-600" />
                                  <div className="flex-1">
                                    <div className="text-xs font-semibold text-gray-800">{equipment.name}</div>
                                    <div className="text-xs text-gray-600">{equipment.reference}</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowDiagramManager({
                                        equipmentId: equipment.id,
                                        equipmentName: equipment.name,
                                        currentDiagram: equipment.diagram_url || undefined,
                                      });
                                    }}
                                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                                    title="Gérer le schéma"
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEquipment(equipment.id);
                                    }}
                                    disabled={isLoading}
                                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors disabled:opacity-50"
                                    title="Supprimer l'équipement"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {showDiagramManager && (
          <DiagramManager
            equipmentId={showDiagramManager.equipmentId}
            equipmentName={showDiagramManager.equipmentName}
            currentDiagram={showDiagramManager.currentDiagram}
            onClose={() => setShowDiagramManager(null)}
            onDiagramUpdated={() => {
              loadProjects();
              setShowDiagramManager(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectManager;

