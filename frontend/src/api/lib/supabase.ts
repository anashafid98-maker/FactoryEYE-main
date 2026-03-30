// SQL Server Database - Using direct API calls to Spring Boot Backend
// This file provides type definitions and API service for Spring Boot backend

// Point to Spring Boot backend (port 8890)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8890';

// Entity types matching Spring Boot backend
export interface Project {
  id: number;
  name: string;
  description?: string;
  status?: string;
  createdBy?: string;
  zones?: Zone[];
}

export interface Zone {
  id: number;
  zoneName: string;
  description?: string;
  location?: string;
  project?: Project;
  projectId?: number;
  equipment?: Equipment[];
}

export interface Equipment {
  id: number;
  name: string;
  reference?: string;
  type?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  status?: string;
  diagramUrl?: string;
  zone?: Zone;
}

export interface SensorInstallationDB {
  id: string;
  equipment_id: string;
  sensor_name: string;
  sensor_type: string;
  measurement_type: string;
  installation_point: string;
  position_x: number;
  position_y: number;
  manufacturer: string;
  model: string;
  serial_number: string;
  installation_date: string;
  calibration_date: string;
  next_calibration_date: string;
  installed_by: string;
  is_active: boolean;
  status: 'good' | 'alarm' | 'offline';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenancePlan {
  id: string;
  equipment_id: string;
  name: string;
  description: string;
  scheduled_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  estimated_duration: number;
  assigned_to: string;
  created_at: string;
  updated_at: string;
}

// API Functions for SQL Server Backend
export const api = {
  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      return data?.length > 0 ? data : mockData.projects;
    } catch {
      console.log('Using mock projects data');
      return mockData.projects;
    }
  },

  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      if (!response.ok) throw new Error('Failed to create project');
      return response.json();
    } catch {
      console.log('Using mock create project');
      const newProject: Project = {
        ...project,
        id: Date.now()
      };
      return newProject;
    }
  },

  async updateProject(id: number, project: Partial<Project>): Promise<Project> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      if (!response.ok) throw new Error('Failed to update project');
      return response.json();
    } catch {
      console.log('Using mock update project');
      return {} as Project;
    }
  },

  async deleteProject(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete project');
    } catch {
      console.log('Using mock delete project');
    }
  },

  // Zones
  async getZones(projectId: number): Promise<Zone[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/zones`);
      if (!response.ok) throw new Error('Failed to fetch zones');
      const data = await response.json();
      return data?.length > 0 ? data : mockData.zones.filter(z => z.project?.id === projectId);
    } catch {
      console.log('Using mock zones data');
      return mockData.zones.filter(z => z.project?.id === projectId);
    }
  },

  async createZone(zone: Omit<Zone, 'id'>): Promise<Zone> {
    try {
      // Extract projectId from zone.project if present
      const zoneData = {
        zoneName: zone.zoneName,
        description: zone.description,
        location: zone.location,
        projectId: zone.project?.id || zone.projectId
      };
      
      const response = await fetch(`${API_BASE_URL}/api/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneData)
      });
      if (!response.ok) throw new Error('Failed to create zone');
      return response.json();
    } catch {
      console.log('Using mock create zone');
      const newZone: Zone = {
        ...zone,
        id: Date.now()
      };
      return newZone;
    }
  },

  async deleteZone(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/zones/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete zone');
    } catch {
      console.log('Using mock delete zone');
    }
  },

  // Equipment
  async getEquipment(zoneId: number): Promise<Equipment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/zones/${zoneId}/equipment`);
      if (!response.ok) throw new Error('Failed to fetch equipment');
      const data = await response.json();
      return data?.length > 0 ? data : mockData.equipment.filter(e => e.zone?.id === zoneId);
    } catch {
      console.log('Using mock equipment data');
      return mockData.equipment.filter(e => e.zone?.id === zoneId);
    }
  },

  async createEquipment(equipment: Omit<Equipment, 'id'>): Promise<Equipment> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipment)
      });
      if (!response.ok) throw new Error('Failed to create equipment');
      return response.json();
    } catch {
      console.log('Using mock create equipment');
      const newEquip: Equipment = {
        ...equipment,
        id: Date.now()
      };
      return newEquip;
    }
  },

  async deleteEquipment(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete equipment');
    } catch {
      console.log('Using mock delete equipment');
    }
  },

  async updateEquipment(id: number, equipment: Partial<Equipment>): Promise<Equipment> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(equipment)
      });
      if (!response.ok) throw new Error('Failed to update equipment');
      return response.json();
    } catch {
      console.log('Using mock update equipment');
      return {} as Equipment;
    }
  },

  // Sensors
  async getSensorInstallations(equipmentId: string): Promise<SensorInstallationDB[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/equipment/${equipmentId}/sensors`);
      if (!response.ok) throw new Error('Failed to fetch sensor installations');
      const data = await response.json();
      return data?.length > 0 ? data : mockData.sensorInstallations.filter(s => s.equipment_id === equipmentId);
    } catch {
      console.log('Using mock sensors data');
      return mockData.sensorInstallations.filter(s => s.equipment_id === equipmentId);
    }
  },

  async createSensorInstallation(sensor: Omit<SensorInstallationDB, 'id' | 'created_at' | 'updated_at'>): Promise<SensorInstallationDB> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sensors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sensor)
      });
      if (!response.ok) throw new Error('Failed to create sensor installation');
      return response.json();
    } catch {
      console.log('Using mock create sensor');
      const newSensor: SensorInstallationDB = {
        ...sensor,
        id: String(Date.now()),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return newSensor;
    }
  },

  async updateSensorInstallation(id: string, sensor: Partial<SensorInstallationDB>): Promise<SensorInstallationDB> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sensors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sensor)
      });
      if (!response.ok) throw new Error('Failed to update sensor installation');
      return response.json();
    } catch {
      console.log('Using mock update sensor');
      return {} as SensorInstallationDB;
    }
  },

  async deleteSensorInstallation(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sensors/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete sensor installation');
    } catch {
      console.log('Using mock delete sensor');
    }
  },

  // Toggle sensor active status
  async toggleSensorStatus(id: string, isActive: boolean): Promise<SensorInstallationDB> {
    return this.updateSensorInstallation(id, { is_active: isActive });
  },

  // Maintenance Plans
  async getMaintenancePlans(): Promise<MaintenancePlan[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/maintenance-plans`);
      if (!response.ok) throw new Error('Failed to fetch maintenance plans');
      const data = await response.json();
      return data?.length > 0 ? data : mockData.maintenancePlans;
    } catch {
      console.log('Using mock maintenance plans data');
      return mockData.maintenancePlans;
    }
  }
};

// Mock data for development when API is not available
export const mockData = {
  projects: [
    {
      id: 1,
      name: 'Maintenance Préventive - Ligne A',
      description: 'Projet de maintenance preventive pour la ligne de production A',
      status: 'active',
      createdBy: 'admin'
    },
    {
      id: 2,
      name: 'Mise à niveau Système Contrôle',
      description: 'Mise a niveau du systeme de controle',
      status: 'active',
      createdBy: 'admin'
    },
    {
      id: 3,
      name: 'Remplacement Pompes P-101',
      description: 'Remplacement des pompes P-101',
      status: 'completed',
      createdBy: 'admin'
    }
  ] as Project[],

  zones: [
    { id: 1, zoneName: 'Zone A1', description: 'Zone de production A1', location: 'Batiment A', project: { id: 1, name: 'Maintenance Préventive - Ligne A' } },
    { id: 2, zoneName: 'Zone A2', description: 'Zone de production A2', location: 'Batiment A', project: { id: 1, name: 'Maintenance Préventive - Ligne A' } }
  ] as Zone[],

  equipment: [
    { id: 1, name: 'Compresseur C-01', reference: 'COMP-001', type: 'Compresseur', manufacturer: 'Atlas Copco', model: 'GA-45', serialNumber: 'SN12345', status: 'operational', diagramUrl: '/diagrams/compressor-01.svg', zone: { id: 1, zoneName: 'Zone A1' } },
    { id: 2, name: 'Pompe P-101', reference: 'PUMP-101', type: 'Pompe', manufacturer: 'Grundfos', model: 'CR-32', serialNumber: 'SN67890', status: 'operational', diagramUrl: '/diagrams/pump-101.svg', zone: { id: 1, zoneName: 'Zone A1' } }
  ] as Equipment[],

  sensorInstallations: [
    { id: '1', equipment_id: '1', sensor_name: 'Temperature Capteur 1', sensor_type: 'TC', measurement_type: 'temperature', installation_point: 'Sortie', position_x: 100, position_y: 50, manufacturer: 'Omron', model: 'E5CC', serial_number: 'OM123', installation_date: '2023-06-20', calibration_date: '2024-01-15', next_calibration_date: '2025-01-15', installed_by: 'Technicien A', is_active: true, status: 'good' as const, notes: '', created_at: '2023-06-20T08:00:00Z', updated_at: '2024-03-01T08:00:00Z' },
    { id: '2', equipment_id: '1', sensor_name: 'Vibration Capteur 1', sensor_type: 'ACC', measurement_type: 'vibration', installation_point: 'Carter', position_x: 150, position_y: 80, manufacturer: 'PCB', model: '603C01', serial_number: 'PCB456', installation_date: '2023-06-20', calibration_date: '2024-01-20', next_calibration_date: '2025-01-20', installed_by: 'Technicien A', is_active: true, status: 'alarm' as const, notes: 'Vibration elevee detectee', created_at: '2023-06-20T08:00:00Z', updated_at: '2024-03-15T10:00:00Z' },
    { id: '3', equipment_id: '2', sensor_name: 'Pression Capteur 1', sensor_type: 'PT', measurement_type: 'pressure', installation_point: 'Aspiration', position_x: 80, position_y: 40, manufacturer: 'Rosemount', model: '3051S', serial_number: 'ROS789', installation_date: '2023-08-25', calibration_date: '2024-02-01', next_calibration_date: '2025-02-01', installed_by: 'Technicien B', is_active: true, status: 'good' as const, notes: '', created_at: '2023-08-25T08:00:00Z', updated_at: '2024-02-01T08:00:00Z' }
  ] as SensorInstallationDB[],

  maintenancePlans: [
    { id: '1', equipment_id: '1', name: 'Maintenance préventive Compresseur C-01', description: 'Inspection et lubrification des composants', scheduled_date: '2024-04-15T08:00:00Z', status: 'pending' as const, estimated_duration: 120, assigned_to: 'Technicien A', created_at: '2024-03-01T08:00:00Z', updated_at: '2024-03-01T08:00:00Z' },
    { id: '2', equipment_id: '2', name: 'Remplacement joints Pompe P-101', description: 'Remplacement des joints d\'étanchéité', scheduled_date: '2024-04-10T09:00:00Z', status: 'in_progress' as const, estimated_duration: 90, assigned_to: 'Technicien B', created_at: '2024-03-05T08:00:00Z', updated_at: '2024-04-01T08:00:00Z' },
    { id: '3', equipment_id: '1', name: 'Calibration capteurs température', description: 'Calibration des capteurs de température', scheduled_date: '2024-03-20T10:00:00Z', status: 'completed' as const, estimated_duration: 60, assigned_to: 'Technicien A', created_at: '2024-03-01T08:00:00Z', updated_at: '2024-03-20T12:00:00Z' },
    { id: '4', equipment_id: '2', name: 'Vérification pression Pompe P-101', description: 'Vérification des pressions de fonctionnement', scheduled_date: '2024-03-25T14:00:00Z', status: 'overdue' as const, estimated_duration: 45, assigned_to: 'Technicien B', created_at: '2024-03-10T08:00:00Z', updated_at: '2024-03-10T08:00:00Z' }
  ] as MaintenancePlan[]
};

export default api;
