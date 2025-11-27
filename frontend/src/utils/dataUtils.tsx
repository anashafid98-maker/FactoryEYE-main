import { Equipment, TimeRange } from '../types';

export const processSensorData = (data: any[]): Equipment[] => {
  if (!Array.isArray(data)) {
    console.error('Expected array but received:', typeof data);
    return [];
  }

  return data.map((item, index) => ({
    id: item.id || `item_${Date.now()}_${index}`,
    name: item.name || `Equipment ${index + 1}`,
    zone: item.zone || 'Unknown',
    sensorData: [{
      timestamp: item.timestamp || new Date().toISOString(),
      current: Number(item.current) || 0,
      pressure: Number(item.pressure) || 0,
      vibrationX: Number(item.vibrationX) || 0,
      vibrationY: Number(item.vibrationY) || 0,
      vibrationZ: Number(item.vibrationZ) || 0,
      value: Number(item.value) || 0,
      status: item.status || 'normal',
      time: item.time || new Date(item.timestamp).toLocaleTimeString()
    }]
  })).filter(item => item !== null);
};

export const simulateHistoricalData = (range: TimeRange): Equipment[] => {
  const data: Equipment[] = [];
  const interval = 20 * 1000; // 20 secondes
  let current = range.start.getTime();
  
  while (current <= range.end.getTime()) {
    data.push({
      id: `sensor_${current}`,
      name: `Equipment ${new Date(current).toLocaleTimeString()}`,
      zone: 'Simulated',
      sensorData: [{
        timestamp: new Date(current).toISOString(),
        current: 10 + Math.random() * 5,
        pressure: 5 + Math.random() * 5,
        vibration: Math.random() * 10,
        value: Math.random() * 100,
        status: Math.random() > 0.9 ? 'warning' : 'normal',
        time: new Date(current).toLocaleTimeString()
      }]
    });
    current += interval;
  }
  
  return data;
};

export const filterDataByTimeRange = (data: Equipment[], range: TimeRange): Equipment[] => {
  if (!data || !range) return [];
  
  return data.filter(item => {
    try {
      const timestamp = new Date(item.timestamp).getTime();
      return timestamp >= range.start.getTime() && timestamp <= range.end.getTime();
    } catch (e) {
      console.error('Invalid timestamp:', item.timestamp, e);
      return false;
    }
  });
};