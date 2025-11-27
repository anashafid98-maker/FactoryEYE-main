export interface SensorData {
  id: string;
  timestamp: string;
  current?: number;
  pressure?: number;
  temperature?: number;
  vibration?: number;
  value?: number;
  status: string;
  equipmentName: string;
}

export interface Equipment {
  timestamp: string | number | Date;
  id: string;
  name: string;
  zone: string;
  sensorData: SensorData[];
}

export interface Zone {
  id: string;
  name: string;
  equipment: Equipment[];
}

export interface TimeRange {
  start: Date;
  end: Date;
}