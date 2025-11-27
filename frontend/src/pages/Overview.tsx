import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Power, 
  PowerOff,
  Bell,
  CheckCircle,
  XCircle,
  Users,
  Settings,
  Plus,
  User as UserIcon,
  Trash2,
  Gauge
} from 'lucide-react';
import { motion } from 'framer-motion';

// -------------------- INTERFACES --------------------
interface Equipment {
  id: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: string;
}

interface Sensor {
  id: number;
  name: string;
  type: string;
  unit?: string;
  value?: number;
  equipmentId: number;
  status: 'ACTIVE' | 'INACTIVE';
}

interface AlertSummary {
  critical: number;
  major: number;
  minor: number;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  lastSeen: string;
}

// -------------------- ANIMATIONS --------------------
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

// ================================================================
// ========================= COMPONENT ============================
// ================================================================

function Overview() {
  const navigate = useNavigate();

  // -------------------- REDIRECTION --------------------
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'ADMIN') navigate('/unauthorized');
  }, [navigate]);

  // -------------------- ÉTATS --------------------
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [alerts, setAlerts] = useState<AlertSummary>({ critical: 0, major: 0, minor: 0 });
  const [totalEquipment, setTotalEquipment] = useState<number>(0);
  const [totalSensors, setTotalSensors] = useState<number>(0);
  const [loading, setLoading] = useState({ 
    equipment: true, 
    sensors: true, 
    alerts: true, 
    total: true
  });
  const [error, setError] = useState<string | null>(null);

  const [showAddSensorModal, setShowAddSensorModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sensorToDelete, setSensorToDelete] = useState<Sensor | null>(null);
  const [newSensor, setNewSensor] = useState({
    name: '',
    type: '',
    unit: '',
    equipmentId: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // -------------------- MOCK DATA --------------------
  const mockSensors: Sensor[] = [
    { id: 1, name: 'Capteur Température Four 1', type: 'Temperature', unit: '°C', value: 245.5, equipmentId: 1, status: 'ACTIVE' },
    { id: 2, name: 'Capteur Pression Chambre', type: 'Pression', unit: 'bar', value: 2.3, equipmentId: 1, status: 'ACTIVE' },
    { id: 3, name: 'Capteur Vitesse Convoyeur', type: 'Vitesse', unit: 'm/s', value: 1.2, equipmentId: 2, status: 'INACTIVE' },
    { id: 4, name: 'Capteur Niveau Liquide', type: 'Niveau', unit: 'cm', value: 45.0, equipmentId: 3, status: 'ACTIVE' },
  ];

  const mockUsers: User[] = [
    { id: '1', name: 'Mohamed Hayyan', avatar: '', lastSeen: new Date().toISOString() },
    { id: '3', name: 'Anas Hafid', avatar: '', lastSeen: new Date().toISOString() },
  ];

  // -------------------- FETCH DATA --------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const totalRes = await fetch('http://10.190.50.107:8889/api/equipments/total');
        const equipmentRes = await fetch('http://10.190.50.107:8889/api/equipments');
        const alertsRes = await fetch('http://10.190.50.107:8889/api/alerts/summary');
        
        if (!totalRes.ok) throw new Error('Failed to fetch total equipment');
        if (!equipmentRes.ok) throw new Error('Failed to fetch equipment');
        if (!alertsRes.ok) throw new Error('Failed to fetch alerts');

        setTotalEquipment(await totalRes.json());
        setEquipment(await equipmentRes.json());
        setAlerts(await alertsRes.json());
        
        setLoading(prev => ({ ...prev, equipment: false, alerts: false, total: false }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(prev => ({ ...prev, equipment: false, alerts: false, total: false }));
      }
    };
    fetchData();
  }, []);

  // -------------------- FETCH SENSORS --------------------
  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const sensorsRes = await fetch('http://10.190.50.107:8889/api/sensors');
        if (sensorsRes.ok) {
          const sensorsData = await sensorsRes.json();
          setSensors(sensorsData);
          setTotalSensors(sensorsData.length);
        } else {
          setSensors(mockSensors);
          setTotalSensors(mockSensors.length);
        }
        setLoading(prev => ({ ...prev, sensors: false }));
      } catch {
        setSensors(mockSensors);
        setTotalSensors(mockSensors.length);
        setLoading(prev => ({ ...prev, sensors: false }));
      }
    };
    fetchSensors();
  }, []);

  useEffect(() => {
    setConnectedUsers(mockUsers);
    setLoadingUsers(false);
  }, []);

  // -------------------- SENSOR ACTIONS --------------------
  const handleAddSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, sensors: true }));
    
    try {
      const res = await fetch(`http://10.190.50.107:8889/api/sensors/equipment/${newSensor.equipmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSensor.name,
          type: newSensor.type,
          unit: newSensor.unit,
          value: 0,
          status: newSensor.status
        }),
      });
      
      if (res.ok) {
        const addedSensor = await res.json();
        setSensors(prev => [...prev, addedSensor]);
        setTotalSensors(prev => prev + 1);
        setShowAddSensorModal(false);
        setNewSensor({ name: '', type: '', unit: '', equipmentId: '', status: 'ACTIVE' });
        setMessage('Capteur ajouté avec succès!');
        setIsSuccess(true);
      } else {
        const newSensorObj: Sensor = {
          id: Date.now(),
          name: newSensor.name,
          type: newSensor.type,
          unit: newSensor.unit,
          value: 0,
          equipmentId: parseInt(newSensor.equipmentId) || 1,
          status: newSensor.status
        };
        setSensors(prev => [...prev, newSensorObj]);
        setTotalSensors(prev => prev + 1);
        setShowAddSensorModal(false);
        setNewSensor({ name: '', type: '', unit: '', equipmentId: '', status: 'ACTIVE' });
        setMessage('Capteur ajouté localement (API non disponible)');
        setIsSuccess(true);
      }
    } catch {
      const newSensorObj: Sensor = {
        id: Date.now(),
        name: newSensor.name,
        type: newSensor.type,
        unit: newSensor.unit,
        value: 0,
        equipmentId: parseInt(newSensor.equipmentId) || 1,
        status: newSensor.status
      };
      setSensors(prev => [...prev, newSensorObj]);
      setTotalSensors(prev => prev + 1);
      setShowAddSensorModal(false);
      setNewSensor({ name: '', type: '', unit: '', equipmentId: '', status: 'ACTIVE' });
      setMessage('Capteur ajouté localement (Erreur de connexion)');
      setIsSuccess(true);
    } finally {
      setLoading(prev => ({ ...prev, sensors: false }));
      setShowMessageModal(true);
    }
  };

  const handleDeleteClick = (sensor: Sensor) => {
    setSensorToDelete(sensor);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sensorToDelete) return;
    
    try {
      const res = await fetch(`http://10.190.50.107:8889/api/sensors/${sensorToDelete.id}`, { 
        method: 'DELETE' 
      });
      
      if (res.ok) {
        setSensors(prev => prev.filter(s => s.id !== sensorToDelete.id));
        setTotalSensors(prev => prev - 1);
        setMessage('Capteur supprimé avec succès!');
        setIsSuccess(true);
      } else {
        setSensors(prev => prev.filter(s => s.id !== sensorToDelete.id));
        setTotalSensors(prev => prev - 1);
        setMessage('Capteur supprimé localement (API non disponible)');
        setIsSuccess(true);
      }
    } catch {
      setSensors(prev => prev.filter(s => s.id !== sensorToDelete.id));
      setTotalSensors(prev => prev - 1);
      setMessage('Capteur supprimé localement (Erreur de connexion)');
      setIsSuccess(true);
    } finally {
      setShowDeleteModal(false);
      setSensorToDelete(null);
      setShowMessageModal(true);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSensorToDelete(null);
  };

  // -------------------- COMPUTED VALUES --------------------
  const activeEquipment = equipment.filter(eq => eq.status === 'ACTIVE').length;
  const inactiveEquipment = equipment.length - activeEquipment;
  const activeSensors = sensors.filter(sensor => sensor.status === 'ACTIVE').length;
  const inactiveSensors = sensors.length - activeSensors;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  // ================================================================
  // ========================== RENDER ==============================
  // ================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* HEADER */}
      <motion.header 
        className="bg-white shadow-lg p-4" 
        initial={{ y: -100 }} 
        animate={{ y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.h1 
            className="text-2xl font-bold text-gray-800 flex items-center gap-2" 
            whileHover={{ scale: 1.05 }}
          >
            <Activity className="text-blue-600" />
            Tableau de Bord Industriel
          </motion.h1>
          <div className="flex items-center gap-6">
            <motion.div 
              className="flex items-center gap-2" 
              whileHover={{ scale: 1.05 }}
            >
              <Users className="text-gray-600" />
              <span className="font-medium">{mockUsers.length} Utilisateurs en ligne</span>
            </motion.div>
            <motion.button 
              className="p-2 rounded-full hover:bg-gray-100" 
              whileHover={{ rotate: 180 }} 
              transition={{ duration: 0.3 }}
            >
              <Settings className="text-gray-600" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-6">
        {/* STATS CARDS */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Total Equipment */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-700">Équipements Totaux</h3>
              <Activity className={`text-blue-600 ${loading.total ? 'animate-pulse' : ''}`} />
            </div>
            <p className="text-3xl font-bold mt-2">
              {loading.total ? '...' : totalEquipment}
            </p>
          </motion.div>

          {/* Equipment Status */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-700">Statut Équipements</h3>
              <div className="flex gap-2">
                <Power className="text-green-600" />
                <PowerOff className="text-red-600" />
              </div>
            </div>
            <div className="flex gap-4 mt-2 items-center">
              <p className="text-3xl font-bold text-green-600">
                {loading.equipment ? '...' : activeEquipment}
              </p>
              <span className="text-gray-400">/</span>
              <p className="text-3xl font-bold text-red-600">
                {loading.equipment ? '...' : inactiveEquipment}
              </p>
            </div>
          </motion.div>

          {/* Total Sensors */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-700">Capteurs Totaux</h3>
              <Gauge className={`text-purple-600 ${loading.sensors ? 'animate-pulse' : ''}`} />
            </div>
            <p className="text-3xl font-bold mt-2">
              {loading.sensors ? '...' : totalSensors}
            </p>
          </motion.div>

          {/* Sensor Status */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-700">Statut Capteurs</h3>
              <div className="flex gap-2">
                <Power className="text-green-600" />
                <PowerOff className="text-red-600" />
              </div>
            </div>
            <div className="flex gap-4 mt-2 items-center">
              <p className="text-3xl font-bold text-green-600">
                {loading.sensors ? '...' : activeSensors}
              </p>
              <span className="text-gray-400">/</span>
              <p className="text-3xl font-bold text-red-600">
                {loading.sensors ? '...' : inactiveSensors}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* ALERTS CARD */}
        <motion.div 
          variants={itemVariants} 
          className="bg-white rounded-xl shadow p-6 mb-8"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-700">Alertes Actuelles</h3>
            <Bell className={`text-yellow-600 ${loading.alerts ? 'animate-pulse' : ''}`} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-red-600">Critiques</span>
              <span className="font-bold">
                {loading.alerts ? '...' : alerts.critical}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-600">Majeures</span>
              <span className="font-bold">
                {loading.alerts ? '...' : alerts.major}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600">Mineures</span>
              <span className="font-bold">
                {loading.alerts ? '...' : alerts.minor}
              </span>
            </div>
          </div>
        </motion.div>

        {/* SENSOR OVERVIEW */}
        <motion.div 
          className="bg-white rounded-xl shadow p-6 mb-8" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Vue d'ensemble des Capteurs</h2>
            <button
              onClick={() => setShowAddSensorModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter Capteur
            </button>
          </div>
          
          {loading.sensors ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des capteurs...</p>
            </div>
          ) : sensors.length === 0 ? (
            <div className="text-center py-8">
              <Gauge className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun capteur trouvé</p>
              <button
                onClick={() => setShowAddSensorModal(true)}
                className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                Ajouter le premier capteur
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 p-3 text-left">ID</th>
                    <th className="border border-gray-200 p-3 text-left">Nom</th>
                    <th className="border border-gray-200 p-3 text-left">Type</th>
                    <th className="border border-gray-200 p-3 text-left">Valeur</th>
                    <th className="border border-gray-200 p-3 text-left">Unité</th>
                    <th className="border border-gray-200 p-3 text-left">ID Équipement</th>
                    <th className="border border-gray-200 p-3 text-left">Statut</th>
                    <th className="border border-gray-200 p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sensors.map((sensor) => (
                    <tr key={sensor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="border border-gray-200 p-3">{sensor.id}</td>
                      <td className="border border-gray-200 p-3 font-medium">{sensor.name}</td>
                      <td className="border border-gray-200 p-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {sensor.type}
                        </span>
                      </td>
                      <td className="border border-gray-200 p-3">
                        <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
                          sensor.value && sensor.value > 0 ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          {sensor.value || 0}
                        </span>
                      </td>
                      <td className="border border-gray-200 p-3">{sensor.unit || 'N/A'}</td>
                      <td className="border border-gray-200 p-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                          {sensor.equipmentId}
                        </span>
                      </td>
                      <td className="border border-gray-200 p-3">
                        <span
                          className={`flex items-center gap-2 px-3 py-1 rounded text-white ${
                            sensor.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        >
                          {sensor.status === 'ACTIVE' ? 
                            <CheckCircle className="w-4 h-4" /> : 
                            <XCircle className="w-4 h-4" />
                          }
                          {sensor.status}
                        </span>
                      </td>
                      <td className="border border-gray-200 p-3">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleDeleteClick(sensor)}
                            className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* EQUIPMENT OVERVIEW */}
        <motion.div 
          className="bg-white rounded-xl shadow p-6" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-bold mb-4">Vue d'ensemble des Équipements</h2>
          
          {loading.equipment ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des équipements...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-200 p-3 text-left">ID</th>
                    <th className="border border-gray-200 p-3 text-left">Nom</th>
                    <th className="border border-gray-200 p-3 text-left">Type</th>
                    <th className="border border-gray-200 p-3 text-left">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((eq) => (
                    <tr key={eq.id} className="hover:bg-gray-50 transition-colors">
                      <td className="border border-gray-200 p-3">{eq.id}</td>
                      <td className="border border-gray-200 p-3 font-medium">{eq.name}</td>
                      <td className="border border-gray-200 p-3">{eq.type}</td>
                      <td className="border border-gray-200 p-3">
                        <span
                          className={`flex items-center gap-2 px-3 py-1 rounded text-white ${
                            eq.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        >
                          {eq.status === 'ACTIVE' ? 
                            <CheckCircle className="w-4 h-4" /> : 
                            <XCircle className="w-4 h-4" />
                          }
                          {eq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* CONNECTED USERS */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-xl shadow p-6 mt-8"
        >
          <h2 className="text-xl font-bold mb-4">Utilisateurs Connectés</h2>
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 p-3 text-left">ID</th>
                <th className="border border-gray-200 p-3 text-left">Nom</th>
                <th className="border border-gray-200 p-3 text-left">Dernière connexion</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr>
                  <td colSpan={3} className="text-center py-4">Chargement...</td>
                </tr>
              ) : connectedUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-4">Aucun utilisateur connecté</td>
                </tr>
              ) : (
                connectedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="border border-gray-200 p-3">{user.id}</td>
                    <td className="border border-gray-200 p-3 flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <UserIcon className="w-6 h-6 text-gray-400" />
                      )}
                      {user.name}
                    </td>
                    <td className="border border-gray-200 p-3">
                      {new Date(user.lastSeen).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      </main>

      {/* ADD SENSOR MODAL */}
      {showAddSensorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Ajouter un Nouveau Capteur</h2>
            <form onSubmit={handleAddSensor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Capteur *</label>
                <input
                  type="text"
                  placeholder="Entrez le nom du capteur"
                  value={newSensor.name}
                  onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de Capteur *</label>
                <input
                  type="text"
                  placeholder="ex: Température, Pression"
                  value={newSensor.type}
                  onChange={(e) => setNewSensor({ ...newSensor, type: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                <input
                  type="text"
                  placeholder="ex: °C, bar, psi"
                  value={newSensor.unit}
                  onChange={(e) => setNewSensor({ ...newSensor, unit: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Équipement *</label>
                <input
                  type="number"
                  placeholder="Entrez l'ID de l'équipement"
                  value={newSensor.equipmentId}
                  onChange={(e) => setNewSensor({ ...newSensor, equipmentId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    newSensor.status === 'ACTIVE' 
                      ? 'bg-green-100 border-green-500 text-green-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="status"
                      value="ACTIVE"
                      checked={newSensor.status === 'ACTIVE'}
                      onChange={(e) => setNewSensor({ ...newSensor, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      className="hidden"
                    />
                    <CheckCircle className="w-4 h-4 mr-2" />
                    ACTIVE
                  </label>
                  <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    newSensor.status === 'INACTIVE' 
                      ? 'bg-red-100 border-red-500 text-red-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="status"
                      value="INACTIVE"
                      checked={newSensor.status === 'INACTIVE'}
                      onChange={(e) => setNewSensor({ ...newSensor, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      className="hidden"
                    />
                    <XCircle className="w-4 h-4 mr-2" />
                    INACTIVE
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSensorModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={loading.sensors}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  disabled={loading.sensors}
                >
                  {loading.sensors ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Ajout...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Ajouter Capteur
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && sensorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Confirmer la suppression</h2>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                Êtes-vous sûr de vouloir supprimer ce capteur ? Cette action est irréversible.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">Capteur à supprimer :</h3>
                <div className="space-y-1 text-sm text-red-700">
                  <p><span className="font-medium">ID:</span> {sensorToDelete.id}</p>
                  <p><span className="font-medium">Nom:</span> {sensorToDelete.name}</p>
                  <p><span className="font-medium">Type:</span> {sensorToDelete.type}</p>
                  <p><span className="font-medium">Statut:</span> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      sensorToDelete.status === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {sensorToDelete.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer définitivement
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MESSAGE MODAL */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`bg-white rounded-xl p-6 w-full max-w-sm text-center ${
              isSuccess ? 'border-green-500' : 'border-red-500'
            } border-2`}
          >
            <div className="flex justify-center mb-4">
              {isSuccess ? (
                <CheckCircle className="w-12 h-12 text-green-500" />
              ) : (
                <XCircle className="w-12 h-12 text-red-500" />
              )}
            </div>
            <p className="text-lg font-medium mb-4">{message}</p>
            <button
              onClick={() => setShowMessageModal(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Overview;