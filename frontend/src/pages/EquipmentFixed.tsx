/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, ZoomIn, ZoomOut, Play, Pause, AlertCircle, Settings, TrendingUp, ChevronDown, ChevronUp, Calendar, BarChart3, Hand, Download, FileText, TrendingDown, CheckCircle, XCircle, Users } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ComposedChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

// Register French locale
registerLocale('fr', fr);

const API_BASE = "http://10.190.50.153:5000";
const API_BASE_STATS = "http://10.190.50.153:5001";
const N_POINTS = 1200;
const FS = 1.0;

type TimeFormat = 'seconds' | 'minutes';

const RAW_MAX = 65535.0;
const VIB_MA_MAX = 20.0;
const VIB_MM_S_AT_20MA = 25.0;
const CURRENT_RAW_MAX = 65535.0;
const CURRENT_MA_MAX = 20.0;

type ViewMode = 'live' | 'historic';
type HistoricalPeriod = 'week' | 'month';

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
  vx_peak?: number;
  vx_p2p?: number;
  vx_crest_factor?: number;
  vx_kurtosis?: number;
  vx_skewness?: number;
  vx_dom_freq_hz?: number;
  vx_band_0_10?: number;
  vx_band_10_100?: number;
  vx_band_100_500?: number;
  vx_band_500_1000?: number;
  running?: boolean;
  source?: string;
  is_simulation?: boolean;
  spectrum_vx?: SpectrumData;
  spectrum_vy?: SpectrumData;
}

interface TimeSeriesPoint {
  time: string;
  fullTime: string;
  timestamp: number;
  vibration_x: number;
  vibration_x_mm_s: number;
  vibration_y: number;
  vibration_y_mm_s: number;
  vibration_z: number;
  vx_rms: number;
  vy_rms: number;
  current_value: number;
  current_mA: number;
  pressure: number;
}

interface FFTPoint {
  frequency: number;
  amplitude: number;
}

interface ChartConfig {
  key: string;
  name: string;
  color: string;
  unit: string;
}

interface HistoricalDataPoint {
  period: string;
  avg_vibration_x: number;
  max_vibration_x: number;
  avg_vibration_y: number;
  max_vibration_y: number;
  avg_pressure: number;
  max_pressure: number;
  avg_current: number;
  max_current: number;
  avg_vx_rms: number;
  max_vx_rms: number;
  avg_vy_rms: number;
  max_vy_rms: number;
}

type ApiStatus = 'online' | 'offline' | 'checking';

const METRICS: ChartConfig[] = [
  { key: 'vibration_x_mm_s', name: 'Vibration X (mm/s)', color: '#10B981', unit: 'mm/s' },
  { key: 'vibration_y', name: 'Vibration Y', color: '#A23B72', unit: 'counts' },
  { key: 'vibration_y_mm_s', name: 'Vibration Y (mm/s)', color: '#EC4899', unit: 'mm/s' },
  { key: 'vibration_z', name: 'Vibration Z', color: '#F59E0B', unit: 'counts' },
  { key: 'vx_rms', name: 'VX RMS', color: '#6366F1', unit: 'mm/s' },
  { key: 'vy_rms', name: 'VY RMS', color: '#8B5CF6', unit: 'mm/s' },
  { key: 'current_value', name: 'Current', color: '#3F88C5', unit: 'counts' },
  { key: 'current_mA', name: 'Current (mA)', color: '#F59E0B', unit: 'mA' },
  { key: 'pressure', name: 'Pressure', color: '#C73E1D', unit: 'bar' },
  { key: 'amplitude', name: 'FFT Amplitude', color: '#FF6B6B', unit: '' },
];

const KPI_CARDS = [
  { key: 'vx_peak', name: 'VX Peak', color: '#8B5CF6', unit: 'counts' },
  { key: 'vx_p2p', name: 'VX P2P', color: '#EC4899', unit: 'counts' },
  { key: 'vx_crest_factor', name: 'Crest Factor', color: '#F59E0B', unit: '' },
  { key: 'vx_dom_freq_hz', name: 'Dom Freq', color: '#10B981', unit: 'Hz' },
  { key: 'vx_kurtosis', name: 'Kurtosis', color: '#3B82F6', unit: '' },
  { key: 'vx_skewness', name: 'Skewness', color: '#EF4444', unit: '' },
];

const EquipmentFixed: React.FC = () => {
  // ALL STATE AT TOP - NO CONDITIONALS BEFORE
  const [data, setData] = useState<EquipmentData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['vibration_x_mm_s', 'vx_rms', 'pressure']);
  const [brushRange, setBrushRange] = useState<{ startIndex: number; endIndex: number } | null>(null);
  const [fftVibration, setFftVibration] = useState<FFTPoint[]>([]);
  const [fftZoom, setFftZoom] = useState(20);
  const [rmsZoom, setRmsZoom] = useState(1);
  const [chartMode, setChartMode] = useState<'time' | 'frequency'>('time');
  const [viewMode, setViewMode] = useState<ViewMode>('live');
  const [historicalPeriod, setHistoricalPeriod] = useState<HistoricalPeriod>('week');
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [metricsOpen, setMetricsOpen] = useState<boolean>(false);
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('minutes');

  // ALL CALLBACKS AT TOP
  const vibScaleToMM_S = useCallback((vRaw: number): number => {
    const mA = vRaw * VIB_MA_MAX / RAW_MAX;
    return (mA / VIB_MA_MAX) * VIB_MM_S_AT_20MA;
  }, []);

  const currentScaleToMA = useCallback((iRaw: number): number => {
    return iRaw * CURRENT_MA_MAX / CURRENT_RAW_MAX;
  }, []);

  const computeFFT = useCallback((values: number[]): FFTPoint[] => {
    if (values.length < 16 || FS <= 0) return [];
    const x = values.map(v => Number(v));
    const n = x.length;
    const mean = x.reduce((a, b) => a + b, 0) / n;
    const xCentered = x.map(v => v - mean);
    const w = x.map((_, i) => 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1))));
    const xWindowed = xCentered.map((v, i) => v * w[i]);
    
    const freqs: number[] = [];
    const amps: number[] = [];
    
    for (let k = 0; k <= n / 2; k++) {
      let real = 0, imag = 0;
      for (let j = 0; j < n; j++) {
        const angle = (2 * Math.PI * k * j) / n;
        real += xWindowed[j] * Math.cos(angle);
        imag -= xWindowed[j] * Math.sin(angle);
      }
      let amp = Math.sqrt(real * real + imag * imag) * 2 / n;
      if (k === 0) amp = amp / 2;
      freqs.push(k * FS / n);
      amps.push(amp);
    }
    return freqs.map((f, i) => ({ frequency: f, amplitude: amps[i] }));
  }, []);

  const checkApiStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (response.ok) {
        setApiStatus('online');
        return true;
      }
      setApiStatus('offline');
      return false;
    } catch {
      setApiStatus('offline');
      return false;
    }
  }, []);

  const fetchLiveData = useCallback(async () => {
    setIsLoading(true);
    try {
      setError('');
      const response = await fetch(`${API_BASE}/api/timeseries?n=${N_POINTS}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      let apiData: EquipmentData[] = [];
      if (Array.isArray(json)) apiData = json;
      else if (json.data && Array.isArray(json.data)) apiData = json.data;
      else if (json.ok && json.data) apiData = Array.isArray(json.data) ? json.data : [json.data];
      
      if (apiData.length > 0) {
        const sortedData = apiData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setData(sortedData);
        
        // FFT from latest
        let fftData: FFTPoint[] = [];
        try {
          const latestResponse = await fetch(`${API_BASE}/api/latest`);
          if (latestResponse.ok) {
            const latestJson = await latestResponse.json();
            if (latestJson.spectrum_vx?.freqs && latestJson.spectrum_vx?.psd) {
              const freqs = latestJson.spectrum_vx.freqs;
              const psd = latestJson.spectrum_vx.psd;
              fftData = freqs.map((f: number, i: number) => ({
                frequency: Number(f) || 0,
                amplitude: Math.sqrt(Number(psd[i]) || 1e-10)
              }));
            }
          }
        } catch {}
        
        if (fftData.length === 0) {
          const vxVals = sortedData.map(d => d.vibration_x).filter(v => v !== undefined && v !== null);
          if (vxVals.length >= 16) fftData = computeFFT(vxVals);
        }
        setFftVibration(fftData);
      }
      setLastUpdate(new Date());
      setApiStatus('online');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown');
      setApiStatus('offline');
    } finally {
      setIsLoading(false);
    }
  }, [computeFFT]);

  const fetchHistoricalData = useCallback(async () => {
    setIsLoading(true);
    try {
      const statsPeriod = historicalPeriod === 'week' ? 'day' : 'week';
      const response = await fetch(`http://10.190.50.153:5001/api/stats?period=${statsPeriod}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = JSON.parse(await response.text());
      if (json.ok && json.data && Array.isArray(json.data)) {
        const transformedData = json.data.map((item: any, idx: number) => ({
          period: json.data.length <= 7 ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][idx % 7] : `Sem ${idx + 1}`,
          avg_vibration_x: Number(item['vibration_x__mean']) || 0,
          max_vibration_x: Number(item['vibration_x__max']) || 0,
          avg_vibration_y: Number(item['vibration_y__mean']) || 0,
          max_vibration_y: Number(item['vibration_y__max']) || 0,
          avg_pressure: Number(item['pressure__mean']) || 0,
          max_pressure: Number(item['pressure__max']) || 0,
          avg_current: Number(item['current_value__mean']) || 0,
          max_current: Number(item['current_value__max']) || 0,
          avg_vx_rms: Number(item['vx_rms__mean']) || 0,
          max_vx_rms: Number(item['vx_rms__max']) || 0,
          avg_vy_rms: Number(item['vy_rms__mean']) || 0,
          max_vy_rms: Number(item['vy_rms__max']) || 0,
        }));
        setHistoricalData(transformedData);
      } else {
        setHistoricalData(generateHistoricalData(historicalPeriod));
      }
    } catch {
      setHistoricalData(generateHistoricalData(historicalPeriod));
    } finally {
      setIsLoading(false);
    }
  }, [historicalPeriod]);

  // ALL EFFECTS AT TOP
  useEffect(() => {
    checkApiStatus();
    fetchLiveData();
  }, []);

  useEffect(() => {
    if (autoRefresh && viewMode === 'live') {
      const interval = setInterval(fetchLiveData, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, viewMode, fetchLiveData]);

  useEffect(() => {
    if (viewMode === 'historic') {
      fetchHistoricalData();
    }
  }, [viewMode, historicalPeriod, fetchHistoricalData]);

  useEffect(() => {
    if (chartMode === 'frequency') {
      if (!selectedMetrics.includes('amplitude')) setSelectedMetrics(['amplitude']);
    } else {
      setSelectedMetrics(prev => prev.filter(k => k !== 'amplitude'));
    }
  }, [chartMode]);

  // COMPUTED VALUES
const [customMetrics, setCustomMetrics] = useState<ChartConfig[]>([]);
const allMetrics = useMemo(() => [...METRICS, ...customMetrics], [customMetrics]);

  const timeSeriesData = useMemo((): TimeSeriesPoint[] => {
    let displayData = data;
    if (brushRange && data.length > 0) {
      const start = Math.max(0, brushRange.startIndex);
      const end = Math.min(data.length - 1, brushRange.endIndex);
      displayData = data.slice(start, end + 1);
    } else if (zoomLevel > 1 && data.length > 0) {
      const step = Math.floor(zoomLevel);
      displayData = data.filter((_, i) => i % step === 0);
    }
    return displayData.map(item => ({
      time: formatTime(item.timestamp, timeFormat),
      fullTime: new Date(item.timestamp).toLocaleString('fr-FR'),
      timestamp: new Date(item.timestamp).getTime(),
      vibration_x: item.vibration_x,
      vibration_x_mm_s: vibScaleToMM_S(item.vibration_x),
      vibration_y: item.vibration_y,
      vibration_y_mm_s: vibScaleToMM_S(item.vibration_y),
      vibration_z: item.vibration_z,
      vx_rms: item.vx_rms,
      vy_rms: item.vy_rms,
      current_value: item.current_value,
      current_mA: currentScaleToMA(item.current_value),
      pressure: item.pressure
    }));
  }, [data, zoomLevel, brushRange, timeFormat, vibScaleToMM_S, currentScaleToMA]);

  const latestValues = useMemo(() => data[data.length - 1] || null, [data]);

  const avgVibrationX = useMemo(() => historicalData.reduce((sum, item) => sum + item.avg_vibration_x, 0) / historicalData.length, [historicalData]);
  const avgVibrationMM = useMemo(() => vibScaleToMM_S(avgVibrationX), [avgVibrationX, vibScaleToMM_S]);

  // PURE RENDER FUNCTIONS (NO HOOKS)
  const renderSelectedLines = () => selectedMetrics.map(key => {
    const metric = allMetrics.find(m => m.key === key);
    if (!metric) return null;
    return (
      <Line
        key={key}
        type="monotone"
        dataKey={key}
        stroke={metric.color}
        strokeWidth={2}
        name={metric.name}
        dot={false}
        isAnimationActive={false}
      />
    );
  });

  const renderLiveView = () => (
    // Your full live view JSX here - all conditionals pure
    <div>
      {/* Insert your original live view content */}
      <h2>Live View - Full Original Design</h2>
      {/* All charts, KPIs, etc. */}
    </div>
  );

  const renderHistoricView = () => (
    // Your full historic view JSX here - all pure
    <div>
      {/* Insert your original historic view content */}
      <h2>Historic View - Full Original Design</h2>
    </div>
  );

  if (isLoading && data.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      {/* Your tabs */}
      <div className="tabs">
        <button onClick={() => setViewMode('live')}>Live</button>
        <button onClick={() => setViewMode('historic')}>Historic</button>
      </div>
      {viewMode === 'live' ? renderLiveView() : renderHistoricView()}
    </div>
  );
};

export default EquipmentFixed;

