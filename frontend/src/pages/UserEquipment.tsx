import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Brush
} from 'recharts';
import { Settings } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface EquipmentData {
  timestamp?: string;
  time: string;
  pressure: number;
  current: number;
  vibrationX: number;
  vibrationY: number;
  vibrationZ: number;
  vibrationMean?: number;
}

interface Zone {
  id: number;
  name: string;
  equipment: string[];
}

const PAGE_SIZE = 20;

const UserEquipment: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [data, setData] = useState<EquipmentData[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [expandedZoneId, setExpandedZoneId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2023-01-01'));
  const [selectedHour, setSelectedHour] = useState<string>('09:00:00');
  const [showSettings, setShowSettings] = useState(false);
  const [page, setPage] = useState(0);

  // Pour le zoom basic (slider)
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);

  // Fetch zones
  const fetchZones = async () => {
    try {
      const res = await fetch('http://localhost:8889/api/zones');
      const json = await res.json();
      type BackendZone = {
        id_zone?: number;
        id?: number;
        zoneName: string;
        equipment?: { name: string }[];
      };
      const safeZones = (json as BackendZone[])
        .map((zone) => {
          const id = zone.id_zone ?? zone.id;
          if (typeof id !== 'number') return null;
          return {
            id,
            name: zone.zoneName,
            equipment: zone.equipment?.map((eq) => eq.name) || []
          };
        })
        .filter((zone): zone is Zone => zone !== null);
      setZones(safeZones.reverse());
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch compressor data
  const fetchCompressorData = async () => {
    try {
      const response = await fetch('http://localhost:8889/api/compresseur/data');
      const backendData = await response.json();
      backendData.sort((a: BackendCompressorData, b: BackendCompressorData) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      type BackendCompressorData = {
        timestamp: string;
        pressure: number;
        currentValue: number;
        vibrationX: number;
        vibrationY: number;
        vibrationZ: number;
      };
      const transformedData = (backendData as BackendCompressorData[]).map((item) => ({
        timestamp: item.timestamp,
        time: new Date(item.timestamp).toLocaleTimeString(),
        pressure: item.pressure,
        current: item.currentValue,
        vibrationX: item.vibrationX,
        vibrationY: item.vibrationY,
        vibrationZ: item.vibrationZ,
        vibrationMean: +((item.vibrationX + item.vibrationY + item.vibrationZ) / 3).toFixed(2)
      }));
      setData(transformedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchZones();
    fetchCompressorData();
    const interval = setInterval(fetchCompressorData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Données filtrées pour l'affichage (date sélectionnée + à partir de l'heure choisie, un point toutes les 20s)
  const filteredData = React.useMemo(() => {
    if (!selectedEquipment) return [];
    const selectedDay = selectedDate.toISOString().slice(0, 10);
    const filtered = data.filter(d => {
      if (!d.timestamp) return false;
      const itemDay = new Date(d.timestamp).toISOString().slice(0, 10);
      return itemDay === selectedDay && d.time >= selectedHour;
    });
    let lastTimestamp: number | null = null;
    return filtered.filter(d => {
      const [h, m, s] = d.time.split(':').map(Number);
      const currentSec = h * 3600 + m * 60 + s;
      if (lastTimestamp === null || currentSec - lastTimestamp >= 20) {
        lastTimestamp = currentSec;
        return true;
      }
      return false;
    });
  }, [data, selectedEquipment, selectedDate, selectedHour]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));

  const paginatedData = React.useMemo(() => {
    if (!selectedEquipment) return [];
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    let pageData = filteredData.slice(start, end);
    // Appliquer le zoom basic si défini
    if (zoomRange && pageData.length > 0) {
      const [zoomStart, zoomEnd] = zoomRange;
      pageData = pageData.slice(zoomStart, zoomEnd + 1);
    }
    return pageData;
  }, [filteredData, selectedEquipment, page, zoomRange]);

  const handlePrev = () => setPage((p) => Math.max(p - 1, 0));
  const handleNext = () => setPage((p) => Math.min(p + 1, totalPages - 1));

  // Reset page and zoom when equipment, date or hour changes
  useEffect(() => {
    setPage(0);
    setZoomRange(null);
  }, [selectedEquipment, totalPages, selectedDate, selectedHour]);

  // Gestion du curseur de zoom (slider)
  const handleZoomSlider = (e: React.ChangeEvent<HTMLInputElement>, bound: 'start' | 'end') => {
    if (!paginatedData.length) return;
    let [start, end] = zoomRange ?? [0, paginatedData.length - 1];
    if (bound === 'start') {
      start = Math.min(Number(e.target.value), end - 1);
    } else {
      end = Math.max(Number(e.target.value), start + 1);
    }
    setZoomRange([start, end]);
  };

  // Réinitialiser le zoom
  const resetZoom = () => setZoomRange(null);

  // Générer les options d'heure pour la recherche rapide (toutes les 5 minutes)
  const hourOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      hourOptions.push(`${hh}:${mm}:00`);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Équipements par Zone</h1>
        <div className="flex items-center gap-2">
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => date && setSelectedDate(date)}
            className="p-2 border rounded-lg"
            dateFormat="dd/MM/yyyy"
          />
          {/* Barre de recherche pour l'heure */}
          <select
            value={selectedHour}
            onChange={e => setSelectedHour(e.target.value)}
            className="p-2 border rounded-lg"
          >
            {hourOptions.map(opt => (
              <option key={opt} value={opt}>{opt.slice(0, 5)}</option>
            ))}
          </select>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {zones.map(zone => (
          <div key={zone.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div
              className="flex justify-between items-center cursor-pointer mb-4 group"
              onClick={() => setExpandedZoneId(expandedZoneId === zone.id ? null : zone.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`transform transition-transform ${expandedZoneId === zone.id ? 'rotate-90' : ''}`}>
                  ➤
                </div>
                <h2 className="text-xl font-semibold text-gray-800">{zone.name}</h2>
              </div>
            </div>

            {expandedZoneId === zone.id && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {zone.equipment.map((eq, i) => (
                    <div
                      key={i}
                      className={`flex flex-col px-4 py-3 rounded-lg cursor-pointer transition-all ${
                        selectedEquipment === eq
                          ? 'bg-blue-100 border-2 border-blue-300'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedEquipment(eq)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">{eq}</span>
                      </div>

                      {selectedEquipment === eq && (
                        <div className="mt-4 space-y-8">
                          {/* Navigation temporelle améliorée */}
                          <div className="flex justify-end gap-2 mb-2 items-center">
                            <button
                              onClick={handlePrev}
                              disabled={page === 0}
                              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                            >
                              &larr; Précédent
                            </button>
                            <span className="text-gray-600">
                              Page {page + 1} / {totalPages}
                            </span>
                            <button
                              onClick={handleNext}
                              disabled={page >= totalPages - 1}
                              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                            >
                              Suivant &rarr;
                            </button>
                          </div>

                          {/* Curseur de zoom basic */}
                          {paginatedData.length > 2 && (
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-xs text-gray-500">Zoom basic :</span>
                              <input
                                type="range"
                                min={0}
                                max={paginatedData.length - 2}
                                value={zoomRange ? zoomRange[0] : 0}
                                onChange={e => handleZoomSlider(e, 'start')}
                                className="w-32"
                              />
                              <input
                                type="range"
                                min={1}
                                max={paginatedData.length - 1}
                                value={zoomRange ? zoomRange[1] : paginatedData.length - 1}
                                onChange={e => handleZoomSlider(e, 'end')}
                                className="w-32"
                              />
                              <button
                                onClick={resetZoom}
                                className="ml-2 px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300"
                                disabled={!zoomRange}
                              >
                                Réinitialiser le zoom
                              </button>
                            </div>
                          )}

                          {/* Pression */}
                          <div className="bg-white p-6 rounded-xl shadow-xl">
                            <h3 className="text-xl font-semibold mb-4">Pression (bar)</h3>
                            <div className="h-96">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={paginatedData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="time" />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Line
                                    type="monotone"
                                    dataKey="pressure"
                                    stroke="#dc2626"
                                    strokeWidth={2}
                                    dot={false}
                                  />
                                  {/* Zoom professionnel : Brush */}
                                  <Brush dataKey="time" height={30} stroke="#8884d8" />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Courant */}
                          <div className="bg-white p-6 rounded-xl shadow-xl">
                            <h3 className="text-xl font-semibold mb-4">Courant (A)</h3>
                            <div className="h-96">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={paginatedData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="time" />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Line
                                    type="monotone"
                                    dataKey="current"
                                    stroke="#16a34a"
                                    strokeWidth={2}
                                    dot={false}
                                  />
                                  {/* Zoom professionnel : Brush */}
                                  <Brush dataKey="time" height={30} stroke="#8884d8" />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Vibrations */}
                          <div className="bg-white p-6 rounded-xl shadow-xl">
                            <h3 className="text-xl font-semibold mb-4">Vibrations (mm/s)</h3>
                            <div className="h-96">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={paginatedData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="time" />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Line
                                    type="monotone"
                                    dataKey="vibrationX"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    name="Vibration X"
                                    dot={false}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="vibrationY"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    name="Vibration Y"
                                    dot={false}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="vibrationZ"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    name="Vibration Z"
                                    dot={false}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="vibrationMean"
                                    stroke="#6b7280"
                                    strokeDasharray="5 5"
                                    strokeWidth={2}
                                    name="Moyenne"
                                    dot={false}
                                  />
                                  {/* Zoom professionnel : Brush */}
                                  <Brush dataKey="time" height={30} stroke="#8884d8" />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserEquipment;