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

// PLC Data types from plc_to_spl.py
export interface PLCData {
  timestamp: string;
  vibration_x: number;
  current_value: number;
  pressure: number;
  vx_rms: number;
  psd_band: number;
}

export interface PLCDataPoint {
  time: string;
  fullTime: string;
  timestamp: number;
  vibration_x: number;
  current_value: number;
  pressure: number;
  vx_rms: number;
  psd_band: number;
}
