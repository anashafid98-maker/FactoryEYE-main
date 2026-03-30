/*
 * NOTE: This file contains TypeScript interfaces and legacy mock data.
 * The actual application data now comes from the Supabase database.
 * Mock data below is kept only for reference and backward compatibility.
 */

export interface SensorNode {
  id: string;
  name: string;
  status: 'good' | 'alarm' | 'offline';
  type: 'folder' | 'sensor';
  children?: SensorNode[];
  expanded?: boolean;
  equipment?: string;
  reference?: string;
}

export interface SensorInstallation {
  sensorId: string;
  sensorName: string;
  equipmentName: string;
  equipmentReference: string;
  installationDate: string;
  installationLocation: string;
  sensorType: string;
  measurementType: string;
  manufacturer: string;
  serialNumber: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  installedBy: string;
  notes: string;
  diagram: string;
}

export interface SensorData {
  id: string;
  point: string;
  type: string;
  mca: number;
  nov: number;
  temperature: number;
  status: 'good' | 'alarm';
  lastCommunication: string;
  isActive: boolean;
  equipmentReference?: string;
  diagramAvailable?: boolean;
}

export const sensorTreeData: SensorNode[] = [
  {
    id: '1',
    name: 'All',
    status: 'good',
    type: 'folder',
    expanded: true,
    children: [
      {
        id: '2',
        name: 'KOZERT (ex JFC3)',
        status: 'alarm',
        type: 'folder',
        expanded: true,
        children: [
          {
            id: '3',
            name: 'ENGRAIS',
            status: 'alarm',
            type: 'folder',
            expanded: true,
            children: [
              {
                id: '4',
                name: 'Elevateur 607AAT01',
                status: 'alarm',
                type: 'folder',
                expanded: true,
                children: [
                  { id: '5', name: 'Moteur', status: 'alarm', type: 'sensor' },
                  { id: '6', name: 'Réducteur', status: 'good', type: 'sensor' },
                  { id: '7', name: 'Tourteux', status: 'good', type: 'sensor' },
                ],
              },
              {
                id: '8',
                name: 'Elevateur 607AAT04',
                status: 'good',
                type: 'folder',
                children: [
                  { id: '9', name: 'Moteur', status: 'good', type: 'sensor' },
                  { id: '10', name: 'Réducteur', status: 'good', type: 'sensor' },
                  { id: '11', name: 'Tourteux', status: 'good', type: 'sensor' },
                ],
              },
              {
                id: '12',
                name: 'Elevateur 607AAT05',
                status: 'good',
                type: 'folder',
                children: [
                  { id: '13', name: 'Moteur', status: 'good', type: 'sensor' },
                  { id: '14', name: 'Réducteur', status: 'good', type: 'sensor' },
                ],
              },
              {
                id: '15',
                name: 'Elevateur 607AAT06',
                status: 'good',
                type: 'folder',
              },
              {
                id: '16',
                name: 'Enrobeur 607AAM04',
                status: 'good',
                type: 'folder',
              },
              {
                id: '17',
                name: 'Granulateur 607AAM03',
                status: 'good',
                type: 'folder',
              },
              {
                id: '18',
                name: 'Tube sécheur 607AAFT02',
                status: 'good',
                type: 'folder',
              },
            ],
          },
          {
            id: '19',
            name: 'TKP',
            status: 'good',
            type: 'folder',
          },
          
        ],
      },
    ],
  },
];

export interface EquipmentDiagram {
  equipmentReference: string;
  equipmentName: string;
  diagram: string;
  sensors: Array<{
    id: string;
    name: string;
    status: 'good' | 'alarm';
    position: { x: number; y: number };
    location: string;
  }>;
}

export const equipmentDiagrams: { [key: string]: EquipmentDiagram } = {
  '607AAT01': {
    equipmentReference: '607AAT01',
    equipmentName: 'Elevateur 607AAT01',
    diagram: '/Illustration_of_industrial_piston_air_compressor.png',
    sensors: [
      {
        id: '5',
        name: 'Moteur',
        status: 'alarm',
        position: { x: 75, y: 35 },
        location: 'Palier moteur - côté accouplement',
      },
      {
        id: '6',
        name: 'Réducteur',
        status: 'good',
        position: { x: 45, y: 30 },
        location: 'Palier réducteur - sortie lente',
      },
      {
        id: '7',
        name: 'Tourteux',
        status: 'good',
        position: { x: 30, y: 45 },
        location: 'Carter de transmission',
      },
    ],
  },
  '607AAT04': {
    equipmentReference: '607AAT04',
    equipmentName: 'Elevateur 607AAT04',
    diagram: '/Illustration_of_industrial_piston_air_compressor.png',
    sensors: [
      {
        id: '9',
        name: 'Moteur',
        status: 'good',
        position: { x: 75, y: 35 },
        location: 'Palier moteur - côté ventilateur',
      },
      {
        id: '10',
        name: 'Réducteur',
        status: 'good',
        position: { x: 45, y: 30 },
        location: 'Palier réducteur',
      },
      {
        id: '11',
        name: 'Tourteux',
        status: 'good',
        position: { x: 30, y: 45 },
        location: 'Carter de transmission',
      },
    ],
  },
};

export const sensorInstallations: { [key: string]: SensorInstallation } = {
  '5': {
    sensorId: '5',
    sensorName: 'Moteur - Elevateur 607AAT01',
    equipmentName: 'Elevateur 607AAT01',
    equipmentReference: '607AAT01',
    installationDate: '2024-03-15',
    installationLocation: 'Palier moteur - côté accouplement',
    sensorType: 'Capteur de vibration triaxial',
    measurementType: 'Accélération RMS / Vélocité / Température',
    manufacturer: 'SKF',
    serialNumber: 'SKF-VIB-2024-001',
    calibrationDate: '2024-03-10',
    nextCalibrationDate: '2025-03-10',
    installedBy: 'Technicien: Jean Dupont',
    notes: 'Installation sur palier moteur électrique à induction. Capteur orienté axial (Z), horizontal (H) et vertical (V). Fixation par aimant permanent. Câble blindé de 5m.',
    diagram: '/Illustration_of_industrial_piston_air_compressor.png',
  },
  '6': {
    sensorId: '6',
    sensorName: 'Réducteur - Elevateur 607AAT01',
    equipmentName: 'Elevateur 607AAT01',
    equipmentReference: '607AAT01',
    installationDate: '2024-03-15',
    installationLocation: 'Palier réducteur - sortie lente',
    sensorType: 'Capteur de vibration triaxial',
    measurementType: 'Accélération RMS / Vélocité / Température',
    manufacturer: 'SKF',
    serialNumber: 'SKF-VIB-2024-002',
    calibrationDate: '2024-03-10',
    nextCalibrationDate: '2025-03-10',
    installedBy: 'Technicien: Jean Dupont',
    notes: 'Installation sur réducteur à engrenages. Capteur positionné sur le palier de sortie lente pour surveiller l\'état des roulements et des engrenages. Surface préparée pour fixation optimale.',
    diagram: '/Illustration_of_industrial_piston_air_compressor.png',
  },
  '7': {
    sensorId: '7',
    sensorName: 'Tourteux - Elevateur 607AAT01',
    equipmentName: 'Elevateur 607AAT01',
    equipmentReference: '607AAT01',
    installationDate: '2024-03-15',
    installationLocation: 'Carter de transmission',
    sensorType: 'Capteur de vibration triaxial',
    measurementType: 'Accélération RMS / Vélocité / Température',
    manufacturer: 'SKF',
    serialNumber: 'SKF-VIB-2024-003',
    calibrationDate: '2024-03-10',
    nextCalibrationDate: '2025-03-10',
    installedBy: 'Technicien: Jean Dupont',
    notes: 'Capteur installé sur le carter de transmission pour la surveillance continue. Permet la détection précoce de défauts mécaniques et la maintenance prédictive.',
    diagram: '/Illustration_of_industrial_piston_air_compressor.png',
  },
  '9': {
    sensorId: '9',
    sensorName: 'Moteur - Elevateur 607AAT04',
    equipmentName: 'Elevateur 607AAT04',
    equipmentReference: '607AAT04',
    installationDate: '2024-04-20',
    installationLocation: 'Palier moteur - côté ventilateur',
    sensorType: 'Capteur de vibration triaxial',
    measurementType: 'Accélération RMS / Vélocité / Température',
    manufacturer: 'SKF',
    serialNumber: 'SKF-VIB-2024-010',
    calibrationDate: '2024-04-15',
    nextCalibrationDate: '2025-04-15',
    installedBy: 'Technicien: Marie Laurent',
    notes: 'Installation standard sur moteur électrique. Surveillance de l\'équilibrage et des roulements. Connexion au système de monitoring centralisé.',
    diagram: '/Illustration_of_industrial_piston_air_compressor.png',
  },
};

export const tableData: SensorData[] = [
  {
    id: '1',
    point: '1RV-O',
    type: '🔌',
    mca: 4.34,
    nov: 12.65,
    temperature: 41.9,
    status: 'alarm',
    lastCommunication: '2025-02-19 14:19:00',
    isActive: true,
    equipmentReference: '1204',
    diagramAvailable: true,
  },
  {
    id: '2',
    point: '2RH-O',
    type: '🔌',
    mca: 4.44,
    nov: 10.51,
    temperature: 34.5,
    status: 'alarm',
    lastCommunication: '2025-02-19 14:19:00',
    isActive: true,
    equipmentReference: '607AAT01',
    diagramAvailable: true,
  },
 
];
