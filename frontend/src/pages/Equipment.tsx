import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, Activity, Gauge, Zap, ZoomIn, ZoomOut, Play, Pause, Calendar, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';

// Interfaces TypeScript
interface SpectrumData {
  freqs: number[];
  psd: number[];
}

interface EquipmentData {
  id: number;
  timestamp: string;
  vibration_x: number;
  vibration_y: number;
  vibration_z: number;
  vx_rms: number;
  vy_rms: number;
  pressure: number;
  current_value: number;
  running: boolean;
  spectrum_vx: SpectrumData;
  spectrum_vy: SpectrumData;
  source?: string;
  is_simulation?: boolean;
}

interface TimeSeriesData {
  time: string;
  fullTime: string;
  timestamp: number;
  vibration_x: number;
  vibration_y: number;
  vibration_z: number;
  vx_rms: number;
  vy_rms: number;
  pressure: number;
  current_value: number;
}

interface PSDDataPoint {
  frequency: number;
  psd: number;
}

interface ZoomedPSDData {
  vx: PSDDataPoint[];
  vy: PSDDataPoint[];
}

// Couleurs
const colors = {
  vibrationX: '#2E86AB',
  vibrationY: '#A23B72', 
  vibrationZ: '#F18F01',
  vxRMS: '#2E86AB',
  vyRMS: '#A23B72',
  pressure: '#C73E1D',
  current: '#3F88C5',
  psdVX: '#2E86AB',
  psdVY: '#A23B72'
};

type DataMode = 'realtime' | 'historical';
type ApiStatus = 'online' | 'offline' | 'checking';
type ZoomDirection = 'in' | 'out';
type DateDirection = 'prev' | 'next';

const Equipment: React.FC = () => {
  const [data, setData] = useState<EquipmentData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [timeRange, setTimeRange] = useState<number>(60);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [dataMode, setDataMode] = useState<DataMode>('realtime');
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');

  // Vérifier le statut de l'API
  const checkApiStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      if (response.ok) {
        setApiStatus('online');
        return true;
      } else {
        setApiStatus('offline');
        return false;
      }
    } catch (error) {
      setApiStatus('offline');
      return false;
    }
  }, []);

  // Récupère les dates disponibles automatiquement
  const fetchAvailableDates = useCallback(async (): Promise<void> => {
    try {
      console.log('📅 Chargement des dates disponibles...');
      setError('');
      
      // Essayer plusieurs endpoints possibles
      const endpoints: string[] = [
        '/api/dates',
        '/api/simulation/dates', 
        '/api/all-dates'
      ];
      
      let dates: string[] = [];
      let success = false;
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://localhost:5000${endpoint}`);
          if (response.ok) {
            dates = await response.json();
            console.log(`✅ Dates chargées depuis ${endpoint}: ${dates.length} dates`);
            success = true;
            break;
          }
        } catch (error) {
          console.log(`❌ Endpoint ${endpoint} non disponible`);
        }
      }
      
      if (!success) {
        // Fallback: créer des dates simulées
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        dates = [
          today, 
          yesterday,
          '2025-11-27', '2025-11-26', '2025-11-25', 
          '2025-11-24', '2025-11-23', '2025-11-22',
          '2025-11-21', '2025-11-20', '2025-11-19'
        ];
        console.log('📅 Dates simulées utilisées');
      }
      
      setAvailableDates(dates);
      
      // Sélectionner aujourd'hui par défaut
      const today = new Date().toISOString().split('T')[0];
      if (dates.includes(today)) {
        setSelectedDate(today);
        setDataMode('realtime');
      }
      
    } catch (error) {
      console.error('❌ Erreur chargement dates:', error);
      setError('Impossible de charger les dates disponibles');
    }
  }, []);

  // Récupère les données selon le mode
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setError('');
      setIsLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      let url = 'http://localhost:5000/api/data';
      
      if (selectedDate && selectedDate !== today) {
        url = `http://localhost:5000/api/data?date=${selectedDate}`;
        setDataMode('historical');
        console.log(`🕐 Chargement données historiques: ${selectedDate}`);
      } else {
        setDataMode('realtime');
        console.log('🔴 Chargement données temps réel');
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      
      const apiData: EquipmentData[] = await response.json();
      console.log(`✅ ${apiData.length} points reçus (${dataMode})`);
      
      if (apiData.length > 0) {
        // Trier par timestamp
        const sortedData = apiData.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setData(sortedData);
        
        // Afficher info première donnée
        const first = sortedData[0];
        console.log('📊 Première donnée:', {
          time: new Date(first.timestamp).toLocaleString(),
          vx: first.vibration_x,
          source: first.source || 'unknown'
        });
      } else {
        setData([]);
        console.warn('⚠️ Aucune donnée reçue');
        setError('Aucune donnée disponible pour cette date');
      }
      
      setLastUpdate(new Date());
      setApiStatus('online');
      
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      setError(`Impossible de charger les données: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setApiStatus('offline');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, dataMode]);

  // Données filtrées par plage horaire
  const filteredData = useMemo((): EquipmentData[] => {
    if (data.length === 0) return [];
    
    try {
      const targetDate = new Date(selectedDate);
      const startTime = new Date(targetDate);
      startTime.setHours(selectedHour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(selectedHour + Math.ceil(timeRange / 60), 0, 0, 0);
      
      console.log(`🔍 Filtrage: ${startTime.toLocaleString()} -> ${endTime.toLocaleString()}`);
      
      const filtered = data.filter((item: EquipmentData) => {
        try {
          const itemDate = new Date(item.timestamp);
          return itemDate >= startTime && itemDate <= endTime;
        } catch (e) {
          console.warn('❌ Erreur parsing timestamp:', item.timestamp);
          return false;
        }
      });
      
      console.log(`📊 ${filtered.length} points après filtrage`);
      return filtered;
    } catch (error) {
      console.error('❌ Erreur lors du filtrage:', error);
      return data;
    }
  }, [data, selectedDate, selectedHour, timeRange]);

  // Appliquer le zoom
  const zoomedData = useMemo((): EquipmentData[] => {
    if (zoomLevel === 1) return filteredData;
    
    const dataLength = filteredData.length;
    if (dataLength === 0) return filteredData;
    
    const takeCount = Math.max(1, Math.floor(dataLength / zoomLevel));
    const startIndex = Math.floor((dataLength - takeCount) / 2);
    
    const zoomed = filteredData.slice(startIndex, startIndex + takeCount);
    console.log(`🔍 Zoom ${zoomLevel}x: ${dataLength} -> ${zoomed.length} points`);
    return zoomed;
  }, [filteredData, zoomLevel]);

  // Données PSD combinées
  const zoomedPSDData = useMemo((): ZoomedPSDData => {
    if (zoomedData.length === 0) return { vx: [], vy: [] };
    
    const sampleSize = Math.min(zoomedData.length, Math.max(10, Math.floor(zoomedData.length * 0.1)));
    const step = Math.max(1, Math.floor(zoomedData.length / sampleSize));
    
    const sampledData: EquipmentData[] = [];
    for (let i = 0; i < zoomedData.length; i += step) {
      if (sampledData.length >= sampleSize) break;
      sampledData.push(zoomedData[i]);
    }
    
    const combinedPSDVX: PSDDataPoint[] = [];
    const combinedPSDVY: PSDDataPoint[] = [];
    
    sampledData.forEach((item: EquipmentData) => {
      if (item.spectrum_vx && item.spectrum_vx.freqs && item.spectrum_vx.psd) {
        item.spectrum_vx.freqs.forEach((freq: number, index: number) => {
          const existing = combinedPSDVX.find(p => p.frequency === Number(freq.toFixed(1)));
          if (existing) {
            existing.psd = Math.max(existing.psd, item.spectrum_vx.psd[index] || 1e-12);
          } else {
            combinedPSDVX.push({
              frequency: Number(freq.toFixed(1)),
              psd: item.spectrum_vx.psd[index] || 1e-12
            });
          }
        });
      }
      
      if (item.spectrum_vy && item.spectrum_vy.freqs && item.spectrum_vy.psd) {
        item.spectrum_vy.freqs.forEach((freq: number, index: number) => {
          const existing = combinedPSDVY.find(p => p.frequency === Number(freq.toFixed(1)));
          if (existing) {
            existing.psd = Math.max(existing.psd, item.spectrum_vy.psd[index] || 1e-12);
          } else {
            combinedPSDVY.push({
              frequency: Number(freq.toFixed(1)),
              psd: item.spectrum_vy.psd[index] || 1e-12
            });
          }
        });
      }
    });
    
    // Trier par fréquence
    combinedPSDVX.sort((a, b) => a.frequency - b.frequency);
    combinedPSDVY.sort((a, b) => a.frequency - b.frequency);
    
    console.log(`📊 PSD VX: ${combinedPSDVX.length} points, PSD VY: ${combinedPSDVY.length} points`);
    
    return {
      vx: combinedPSDVX,
      vy: combinedPSDVY
    };
  }, [zoomedData]);

  // Données séries temporelles
  const timeSeriesData = useMemo((): TimeSeriesData[] => {
    return zoomedData.map((item: EquipmentData) => {
      try {
        return {
          time: new Date(item.timestamp).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          fullTime: new Date(item.timestamp).toLocaleString('fr-FR'),
          timestamp: new Date(item.timestamp).getTime(),
          vibration_x: item.vibration_x,
          vibration_y: item.vibration_y,
          vibration_z: item.vibration_z,
          vx_rms: item.vx_rms,
          vy_rms: item.vy_rms,
          pressure: item.pressure,
          current_value: item.current_value
        };
      } catch (err) {
        console.warn('❌ Erreur conversion timestamp:', item.timestamp, err);
        return null;
      }
    }).filter((item): item is TimeSeriesData => item !== null);
  }, [zoomedData]);

  // Format PSD
  const formatPSDValue = (value: number): string => {
    if (value >= 1) return value.toFixed(2);
    if (value >= 0.01) return value.toFixed(4);
    if (value >= 0.0001) return value.toFixed(6);
    return value.toExponential(2);
  };

  // Navigation dates
  const navigateDate = (direction: DateDirection): void => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex === -1) return;
    
    if (direction === 'prev' && currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    }
  };

  // Zoom
  const handleZoom = (direction: ZoomDirection): void => {
    setZoomLevel(prev => {
      if (direction === 'in') {
        return Math.min(prev * 2, 8);
      } else {
        return Math.max(prev / 2, 0.125);
      }
    });
  };

  // Heures disponibles
  const hours: number[] = Array.from({ length: 24 }, (_, i) => i);

  // Effets
  useEffect(() => {
    const initializeApp = async (): Promise<void> => {
      await checkApiStatus();
      await fetchAvailableDates();
    };
    initializeApp();
  }, [checkApiStatus, fetchAvailableDates]);

  useEffect(() => {
    fetchData();
    
    // Rafraîchissement automatique seulement pour le temps réel
    const today = new Date().toISOString().split('T')[0];
    if (autoRefresh && selectedDate === today) {
      const interval = setInterval(fetchData, 60000); // 60s pour temps réel
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, selectedDate]);

  // Dernières valeurs
  const lastValues: EquipmentData | null = zoomedData.length > 0 ? zoomedData[zoomedData.length - 1] : null;

  if (isLoading && data.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Chargement des données...</h2>
          <p className="text-gray-600 mt-2">Connexion à l'API FactoryEYE</p>
          <div className="mt-4 text-sm text-gray-500">
            Statut API: <span className={`font-semibold ${apiStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
              {apiStatus === 'online' ? '✅ En ligne' : apiStatus === 'offline' ? '❌ Hors ligne' : '🔄 Vérification...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header avec indicateurs et contrôles de navigation */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">
                🏭 Surveillance {dataMode === 'realtime' ? 'Temps Réel' : 'Historique'}
              </h1>
              <div className={`px-2 py-1 rounded text-xs font-semibold ${
                apiStatus === 'online' ? 'bg-green-100 text-green-800' : 
                apiStatus === 'offline' ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {apiStatus === 'online' ? '✅ En ligne' : 
                 apiStatus === 'offline' ? '❌ Hors ligne' : 
                 '🔄 Vérification'}
              </div>
            </div>
            <p className="text-gray-600">
              {zoomedData.length} points • {dataMode === 'realtime' ? 'Rafraîchissement auto: 60s' : 'Données fixes'}
              {zoomLevel !== 1 && ` • Zoom: ${zoomLevel}x`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              MAJ: {lastUpdate.toLocaleTimeString()}
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              disabled={dataMode === 'historical'}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                autoRefresh && dataMode === 'realtime' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-300 text-gray-700'
              } ${dataMode === 'historical' ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={dataMode === 'historical' ? 'Rafraîchissement auto seulement en mode temps réel' : ''}
            >
              {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autoRefresh ? 'Auto ON' : 'Auto OFF'}
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>

        {/* Contrôles de navigation temporelle */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Date</label>
            <div className="flex gap-2">
              <button
                onClick={() => navigateDate('prev')}
                disabled={availableDates.indexOf(selectedDate) >= availableDates.length - 1}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                title="Date précédente"
              >
                ←
              </button>
              <select
                value={selectedDate}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDate(e.target.value)}
                className="flex-1 px-3 py-1 border rounded"
              >
                {availableDates.map((date: string) => (
                  <option key={date} value={date}>
                    {date} {date === new Date().toISOString().split('T')[0] ? '(Aujourd\'hui)' : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => navigateDate('next')}
                disabled={availableDates.indexOf(selectedDate) <= 0}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                title="Date suivante"
              >
                →
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {availableDates.length} dates disponibles
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Heure de départ</label>
            <select
              value={selectedHour}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedHour(Number(e.target.value))}
              className="px-3 py-1 border rounded"
            >
              {hours.map((hour: number) => (
                <option key={hour} value={hour}>
                  {hour.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Plage temporelle</label>
            <select
              value={timeRange}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTimeRange(Number(e.target.value))}
              className="px-3 py-1 border rounded"
            >
              <option value={30}>30 min</option>
              <option value={60}>1 heure</option>
              <option value={120}>2 heures</option>
              <option value={240}>4 heures</option>
              <option value={480}>8 heures</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Zoom global ({zoomLevel}x)</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleZoom('out')}
                className="flex-1 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                title="Zoom arrière"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom('in')}
                className="flex-1 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                title="Zoom avant"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Indicateurs rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Vibration X</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {lastValues ? lastValues.vibration_x.toFixed(4) : '0.0000'}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {dataMode === 'realtime' ? 'Temps réel' : 'Historique'}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">Vibration Y</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {lastValues ? lastValues.vibration_y.toFixed(4) : '0.0000'}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {lastValues?.source || 'Source inconnue'}
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-800">Pression</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {lastValues ? `${lastValues.pressure.toFixed(1)} bar` : '0.0 bar'}
            </div>
            <div className="text-xs text-red-600 mt-1">
              Plage: 4.0 - 8.0 bar
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Courant</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {lastValues ? `${lastValues.current_value.toFixed(1)} A` : '0.0 A'}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Plage: 8.0 - 16.0 A
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Attention:</strong> {error}
            </div>
          </div>
        )}

        {/* Informations de débogage */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div><strong>Mode:</strong> {dataMode}</div>
            <div><strong>Données:</strong> {data.length}</div>
            <div><strong>Filtrées:</strong> {filteredData.length}</div>
            <div><strong>Zoomées:</strong> {zoomedData.length}</div>
            <div><strong>PSD VX:</strong> {zoomedPSDData.vx.length} pts</div>
            <div><strong>PSD VY:</strong> {zoomedPSDData.vy.length} pts</div>
            <div><strong>Date:</strong> {selectedDate}</div>
            <div><strong>API:</strong> 
              <span className={apiStatus === 'online' ? 'text-green-600' : 'text-red-600'}>
                {apiStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques PSD avec zoom */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* PSD VX */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            PSD VX - Vibration Spectrum {zoomLevel !== 1 && `(Zoom ${zoomLevel}x)`}
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={zoomedPSDData.vx}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="frequency" 
                  label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -5 }}
                  domain={[0, 1000]}
                />
                <YAxis 
                  scale="log"
                  domain={[1e-12, 'auto']}
                  tickFormatter={formatPSDValue}
                />
                <Tooltip 
                  formatter={(value: number) => [formatPSDValue(value), 'PSD']}
                  labelFormatter={(label: number) => `Frequency: ${label} Hz`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="psd"
                  stroke={colors.psdVX}
                  fill={colors.psdVX}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="PSD VX"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PSD VY */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            PSD VY - Vibration Spectrum {zoomLevel !== 1 && `(Zoom ${zoomLevel}x)`}
          </h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={zoomedPSDData.vy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="frequency" 
                  label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -5 }}
                  domain={[0, 1000]}
                />
                <YAxis 
                  scale="log"
                  domain={[1e-12, 'auto']}
                  tickFormatter={formatPSDValue}
                />
                <Tooltip 
                  formatter={(value: number) => [formatPSDValue(value), 'PSD']}
                  labelFormatter={(label: number) => `Frequency: ${label} Hz`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="psd"
                  stroke={colors.psdVY}
                  fill={colors.psdVY}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="PSD VY"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Vibrations Temporelles - Pleine largeur */}
      <div className="bg-white p-6 rounded-xl shadow-lg border">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Vibrations Temporelles {zoomLevel !== 1 && `(Zoom ${zoomLevel}x)`}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => [value, name]}
                labelFormatter={(label: string, payload: any[]) => {
                  if (payload && payload[0]) {
                    return `Time: ${payload[0].payload.fullTime}`;
                  }
                  return `Time: ${label}`;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="vibration_x"
                stroke={colors.vibrationX}
                strokeWidth={2}
                name="Vibration X"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="vibration_y"
                stroke={colors.vibrationY}
                strokeWidth={2}
                name="Vibration Y"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="vibration_z"
                stroke={colors.vibrationZ}
                strokeWidth={2}
                name="Vibration Z"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RMS et Système - 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vibrations RMS */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            Vibrations RMS {zoomLevel !== 1 && `(Zoom ${zoomLevel}x)`}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="vx_rms"
                  stroke={colors.vxRMS}
                  strokeWidth={2}
                  name="VX RMS"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="vy_rms"
                  stroke={colors.vyRMS}
                  strokeWidth={2}
                  name="VY RMS"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pression et Courant */}
        <div className="bg-white p-6 rounded-xl shadow-lg border">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            Pression et Courant {zoomLevel !== 1 && `(Zoom ${zoomLevel}x)`}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pressure"
                  stroke={colors.pressure}
                  strokeWidth={2}
                  name="Pression"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="current_value"
                  stroke={colors.current}
                  strokeWidth={2}
                  name="Courant"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="text-center text-sm text-gray-500 py-4">
        🏭 FactoryEYE - Système de Surveillance Industrielle | 
        API: <span className={apiStatus === 'online' ? 'text-green-600' : 'text-red-600'}>{apiStatus}</span> | 
        Dernière mise à jour: {lastUpdate.toLocaleString()}
      </div>
    </div>
  );
};

export default Equipment;