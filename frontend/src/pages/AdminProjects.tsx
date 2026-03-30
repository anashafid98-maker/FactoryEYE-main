import React, { useState } from 'react';
import { Sensor } from '../components/CompressorDiagram';
import ProjectManager from '../components/ProjectManager';

// Import data
import {
  tableData,
  equipmentDiagrams,
  SensorData,
  SensorInstallation
} from '../data/mockData';

// Import existing components
import DataTable from '../components/DataTable';
import ActionPanel from '../components/ActionPanel';

// Import API and types
import { SensorInstallationDB } from '../api/lib/supabase';

// Local Equipment type compatible with ActionPanel's expected interface
interface Equipment {
  id: string;
  reference: string;
  type: string;
  manufacturer: string | null;
  model: string | null;
  diagram_url: string | null;
}

// Extended sensor type with all needed fields
interface ExtendedSensorData extends SensorData {
  equipmentReference?: string;
  diagramAvailable?: boolean;
}

const AdminProjects = () => {
  // State for sensors
  const [sensors, setSensors] = useState<ExtendedSensorData[]>(tableData);
  
  // Selected for sidebar
  const [selectedSensor, setSelectedSensor] = useState<SensorInstallation | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Show/hide project manager
  const [showProjectManager, setShowProjectManager] = useState(false);

  // Equipment sensors for ActionsPanel
  const equipmentSensors: SensorInstallationDB[] = sensors
    .filter(s => s.equipmentReference)
    .map(s => ({
      id: s.id,
      equipment_id: s.equipmentReference!,
      sensor_name: s.point,
      sensor_type: s.type || '',
      measurement_type: '',
      installation_point: s.type || '',
      position_x: 0,
      position_y: 0,
      manufacturer: '',
      model: '',
      serial_number: '',
      installation_date: '',
      calibration_date: '',
      next_calibration_date: '',
      installed_by: '',
      is_active: s.isActive,
      status: s.status,
      notes: '',
      created_at: '',
      updated_at: ''
    }));

  // Handler for toggling sensor active state
  const handleToggleSensor = (sensorId: string, isActive: boolean) => {
    setSensors(prev => prev.map(s => 
      s.id === sensorId ? { ...s, isActive } : s
    ));
  };

  // Handler for viewing equipment diagram
  const handleViewDiagram = (equipmentRef: string) => {
    const sensor = sensors.find(s => s.equipmentReference === equipmentRef);
    if (sensor) {
      setSelectedSensor({
        sensorId: sensor.id,
        sensorName: sensor.point,
        equipmentName: sensor.equipmentReference || '',
        equipmentReference: sensor.equipmentReference || '',
        installationDate: '',
        installationLocation: '',
        sensorType: sensor.type || '',
        measurementType: '',
        manufacturer: '',
        serialNumber: '',
        calibrationDate: '',
        nextCalibrationDate: '',
        installedBy: '',
        notes: '',
        diagram: ''
      });
    }
  };

  // Handler for deleting sensor
  const handleDeleteSensor = (sensorId: string) => {
    setSensors(prev => prev.filter(s => s.id !== sensorId));
  };

  // Stats
  const stats = {
    total: sensors.length,
    active: sensors.filter(s => s.isActive).length,
    alarm: sensors.filter(s => s.status === 'alarm').length,
    good: sensors.filter(s => s.status === 'good').length,
  };

  // Local project state (for editing)
  const [localProjects, setLocalProjects] = useState([
    {
      name: 'Monitoring Online  - Atelier JorfLasfar OPEX',
      status: 'En cours',
      team: 'Équipe Maintenance',
      deadline: '2024-03-25',
      progress: 65,
      equipment: [
        {
          name: 'Compresseur C-01',
          sensors: [
            { id: 'S1', x: 20, y: 20 },
            { id: 'S2', x: 50, y: 25 },
            { id: 'S3', x: 80, y: 30 },
          ],
        },
      ],
    },
   
  ]);

  
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);

  const [editedProject, setEditedProject] = useState({
    name: '',
    status: '',
    team: '',
    deadline: '',
    progress: 0,
    equipment: [] as { name: string; sensors: Sensor[] }[],
  });

  const handleEditProject = (index: number) => {
    setEditedProject({ ...localProjects[index] });
    setEditingProjectIndex(index);
  };

  const handleSaveProject = () => {
    if (editingProjectIndex === null) return;
    setLocalProjects(prev =>
      prev.map((p, i) => (i === editingProjectIndex ? { ...editedProject } : p))
    );
    setEditingProjectIndex(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Page Title */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <p className=" text-gray-600 mt-1">Gestion des equipements, capteurs et projets de maintenance</p>
            </div>
            
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Capteurs</div>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-green-600">Actifs</div>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.good}</div>
              <div className="text-sm text-blue-600">En Bon etat</div>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-red-600">{stats.alarm}</div>
              <div className="text-sm text-red-600">Alarmes</div>
            </div>
          </div>

          {/* Table and ActionPanel side by side */}
          <div className="flex gap-4">
            {/* Sensors Table */}
            <div className="bg-white rounded-lg shadow-md p-6 flex-1">
              <h2 className="text-xl font-bold mb-4">Gestion des Capteurs</h2>
              <DataTable 
                data={sensors}
                onToggleSensor={handleToggleSensor}
                onViewDiagram={handleViewDiagram}
                onDeleteSensor={handleDeleteSensor}
                equipmentDiagrams={Object.fromEntries(
                  Object.entries(equipmentDiagrams).map(([key, val]) => [key, val.diagram])
                )}
              />
            </div>

            {/* Actions Panel */}
            <div className="w-80 flex-shrink-0">
              <ActionPanel 
                selectedSensor={selectedSensor}
                selectedEquipment={selectedEquipment}
                equipmentSensors={equipmentSensors}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Projets de Maintenance</h2>
            <button
              onClick={() => setShowProjectManager(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              + Nouveau Projet
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-3 font-semibold">Nom</th>
                <th className="p-3 font-semibold">Statut</th>
                <th className="p-3 font-semibold">Équipe</th>
                <th className="p-3 font-semibold">Échéance</th>
                <th className="p-3 font-semibold">Progrès</th>
                <th className="p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {localProjects.map((project, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="p-3">{project.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'En cours' ? 'bg-blue-100 text-blue-700' :
                      project.status === 'Complété' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{project.status}</span>
                  </td>
                  <td className="p-3">{project.team}</td>
                  <td className="p-3">{project.deadline}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleEditProject(index)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Project Modal */}
      {editingProjectIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Modifier le Projet</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={editedProject.name}
                  onChange={e => setEditedProject(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={editedProject.status}
                  onChange={e => setEditedProject(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Planifié">Planifié</option>
                  <option value="En cours">En cours</option>
                  <option value="Complété">Complété</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Équipe</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={editedProject.team}
                  onChange={e => setEditedProject(prev => ({ ...prev, team: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Échéance</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={editedProject.deadline}
                  onChange={e => setEditedProject(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progrès (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={editedProject.progress}
                  onChange={e => setEditedProject(prev => ({ ...prev, progress: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setEditingProjectIndex(null)}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProject}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Manager Modal */}
      {showProjectManager && (
        <ProjectManager
          onClose={() => setShowProjectManager(false)}
        />
      )}
    </div>
  );
};

export default AdminProjects;

