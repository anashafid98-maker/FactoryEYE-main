import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { Plus, Trash2, X } from 'lucide-react';

interface EquipmentData {
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

const Equipment: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [data, setData] = useState<EquipmentData[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [expandedZoneId, setExpandedZoneId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<number | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [newEquipment, setNewEquipment] = useState('');

  const fetchZones = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/zones');
      const json = await res.json();
      
      const safeZones = json.map((zone: any) => ({
        id: zone.id_zone || zone.id,
        name: zone.zoneName,
        equipment: zone.equipment?.map((eq: any) => eq.name) || []
      }));
      
      setZones(safeZones.reverse());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const vibrationX = +(Math.random() * 3).toFixed(2);
      const vibrationY = +(Math.random() * 3).toFixed(2);
      const vibrationZ = +(Math.random() * 3).toFixed(2);
      const vibrationMean = +((vibrationX + vibrationY + vibrationZ) / 3).toFixed(2);

      setData(prev => [
        ...prev.slice(-19),
        {
          time: formattedTime,
          pressure: +(Math.random() * 5 + 2).toFixed(2),
          current: +(Math.random() * 10 + 10).toFixed(2),
          vibrationX,
          vibrationY,
          vibrationZ,
          vibrationMean
        }
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmitZone = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!newZoneName.trim()) {
      alert('Le nom de la zone est obligatoire');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:8080/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneName: newZoneName,
          description: "Description par défaut",
          location: "Localisation par défaut",
          equipment: [newEquipment]
        }),
      });
  
      if (!response.ok) throw new Error('Erreur lors de l\'ajout');
      
      await fetchZones();
      setShowModal(false);
      setNewZoneName('');
      setNewEquipment('');
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la création');
    }
  };

  const handleDeleteEquipment = async (zoneId: number, eq: string) => {
    try {
      const response = await fetch(
        http://localhost:8080/api/zones/${zoneId}/equipment/${encodeURIComponent(eq)},
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Erreur de suppression');
      
      await fetchZones();
      if (selectedEquipment === eq) setSelectedEquipment(null);
    } catch (error) {
      console.error(error);
      alert('Erreur de suppression');
    }
  };

  const handleDeleteZone = async (zoneToDelete: number) => {
    if (!zoneToDelete) return;
    
    try {
      const response = await fetch(http://localhost:8080/api/zones/${zoneToDelete}, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erreur de suppression');
      
      await fetchZones();
      setShowDeleteModal(false);
    } catch (error) {
      console.error(error);
      alert('Erreur de suppression');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Équipements par Zone</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Ajouter une zone
        </button>
      </div>

      <div className="grid gap-6">
        {zones.map(zone => (
          <div key={zone.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div
              className="flex justify-between items-center cursor-pointer mb-4 group"
              onClick={() => setExpandedZoneId(expandedZoneId === zone.id ? null : zone.id)}
            >
              <div className="flex items-center gap-3">
                <div className={transform transition-transform ${expandedZoneId === zone.id ? 'rotate-90' : ''}}>
                ➤
                </div>
                <h2 className="text-xl font-semibold text-gray-800">{zone.name}</h2>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoneToDelete(zone.id);
                  setShowDeleteModal(true);
                }}
                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {expandedZoneId === zone.id && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {zone.equipment.map((eq, i) => (
                  <div
                    key={i}
                    className={`flex justify-between items-center px-4 py-3 rounded-lg cursor-pointer transition-all ${
                      selectedEquipment === eq 
                        ? 'bg-blue-100 border-2 border-blue-300' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedEquipment(eq)}
                  >
                    <span className="font-medium text-gray-700">{eq}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEquipment(zone.id, eq);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-pop-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Nouvelle Zone</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmitZone} className="space-y-4">
              <input
                type="text"
                required
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                placeholder="Nom de la zone"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
              />
              <input
                type="text"
                required
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500"
                placeholder="Nom de l'équipement"
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-pop-in">
            <div className="flex flex-col items-center text-center">
              <Trash2 className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Confirmer la suppression</h2>
              <p className="text-gray-600 mb-6">Cette action est irréversible.</p>
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (zoneToDelete) handleDeleteZone(zoneToDelete);
                  }}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEquipment && (
        <div className="space-y-6 mt-6">
          <h2 className="text-xl font-bold">Mesures en temps réel - {selectedEquipment}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Pression (bar)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pressure" stroke="#dc2626" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold mb-2">Courant (A)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="current" stroke="#16a34a" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Vibrations (mm/s)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="vibrationX" stroke="#2563eb" name="Vibration X" />
                <Line type="monotone" dataKey="vibrationY" stroke="#10b981" name="Vibration Y" />
                <Line type="monotone" dataKey="vibrationZ" stroke="#f59e0b" name="Vibration Z" />
                <Line type="monotone" dataKey="vibrationMean" stroke="#6b7280" strokeDasharray="5 5" name="Vibration Moyenne" />
              </LineChart>
            </ResponsiveContainer>
          </div>F
        </div>
      )}
    </div>
  );
};

export default Equipment;