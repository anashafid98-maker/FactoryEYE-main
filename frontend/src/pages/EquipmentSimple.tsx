import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ZoomIn, ZoomOut, Play, Pause, AlertCircle, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from 'recharts';

const API_BASE = "http://10.190.50.153:5000";
const N_POINTS = 1200;

interface EquipmentData {
  timestamp: string;
  vibration_x: number;
  vx_rms: number;
  pressure: number;
  current_value: number;
}

const EquipmentSimple: React.FC = () => {
  const [data, setData] = useState<EquipmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/timeseries?n=${N_POINTS}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      setData(Array.isArray(json) ? json : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (autoRefresh) {
      const interval = setInterval(fetchData, 2000);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Equipment Monitor</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)} 
            className={`px-4 py-2 rounded ${autoRefresh ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
          >
            {autoRefresh ? <Pause className="w-4 h-4 inline" /> : <Play className="w-4 h-4 inline" />}
            {autoRefresh ? 'Live' : 'Off'}
          </button>
          <button onClick={fetchData} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            <RefreshCw className="w-4 h-4 inline mr-1" /> Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 border border-red-200 rounded text-red-800">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Retry
          </button>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No data available. Check API connection.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={data.slice(-100)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="vibration_x" stroke="#8884d8" name="Vib X" />
            <Line type="monotone" dataKey="vx_rms" stroke="#82ca9d" name="VX RMS" />
            <Line type="monotone" dataKey="pressure" stroke="#ffc658" name="Pressure" />
            <Line type="monotone" dataKey="current_value" stroke="#ff7300" name="Current" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default EquipmentSimple;

