import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Power, 
  PowerOff,
  Bell,
  BarChart,
  CheckCircle,
  XCircle,
  Users,
  Settings,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Equipment {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  type: string;
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

function UserDashboard() {

  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'USER') {
      navigate('/unauthorized');
    }
  }, [navigate]);
  
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    firstname: '', 
    lastname: '', 
    role: 'USER' 
  });
  const [showModal, setShowModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [alerts] = useState<AlertSummary>({ critical: 0, major: 0, minor: 0 });
  const [totalEquipment, setTotalEquipment] = useState<number>(0);
  const [loading, setLoading] = useState({
    equipment: true,
    alerts: true,
    total: true
  });
  const [error, setError] = useState<string | null>(null);

  const mockUsers: User[] = [
    { id: '1', name: 'Mohamed Hayyan', avatar: '', lastSeen: new Date().toISOString() },
    { id: '3', name: 'Anas hafid', avatar: '', lastSeen: new Date().toISOString() },
  ];
   
  

  



  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch total equipment
        const totalRes = await fetch('http://10.190.50.127:8889/api/equipments/total');
        if (!totalRes.ok) throw new Error('Failed to fetch total equipment');
        setTotalEquipment(await totalRes.json());

        // Fetch all equipment
        const equipmentRes = await fetch('http://10.190.50.127:8889/api/equipments');
        if (!equipmentRes.ok) throw new Error('Failed to fetch equipment');
        setEquipment(await equipmentRes.json());

        // Fetch alerts
        

        setLoading({ equipment: false, alerts: false, total: false });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading({ equipment: false, alerts: false, total: false });
      }
    };

    fetchData();
  }, []);

  const activeEquipment = equipment.filter(eq => eq.status === 'active').length;
  const inactiveEquipment = equipment.length - activeEquipment;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
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
            Industrial Monitoring Dashboard
          </motion.h1>
          <div className="flex items-center gap-6">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <Users className="text-gray-600" />
              <span className="font-medium">{mockUsers.length} Users Online</span>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Total Equipment */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-700">Total Equipment</h3>
              <Activity className={`text-blue-600 ${loading.total ? 'animate-pulse' : ''}`} />
            </div>
            <p className="text-3xl font-bold mt-2">
              {loading.total ? '...' : totalEquipment}
            </p>
          </motion.div>

          {/* Equipment Status */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-700">Equipment Status</h3>
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

          {/* Alerts */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-700">Current Alerts</h3>
              <Bell className={`text-yellow-600 ${loading.alerts ? 'animate-pulse' : ''}`} />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-red-600">Critical</span>
                <span className="font-bold">
                  {loading.alerts ? '...' : alerts.critical}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-600">Major</span>
                <span className="font-bold">
                  {loading.alerts ? '...' : alerts.major}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Minor</span>
                <span className="font-bold">
                  {loading.alerts ? '...' : alerts.minor}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Production Status */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-700">Production Status</h3>
              <BarChart className="text-blue-600" />
            </div>
            <div className="mt-4">
              <div className="relative pt-1">
                <div className="flex justify-between text-sm text-blue-600 font-semibold">
                  <span>Progress</span>
                  <span>
                    {loading.total || loading.equipment 
                      ? '...' 
                      : `${Math.round((activeEquipment / totalEquipment) * 100)}%`}
                  </span>
                </div>
                <div className="w-full bg-blue-200 h-2 rounded mt-1">
                  <motion.div
                    className="bg-blue-500 h-2 rounded"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: loading.total || loading.equipment 
                        ? '100%' 
                        : `${(activeEquipment / totalEquipment) * 100}%` 
                    }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Equipment Overview */}
        <motion.div
          className="bg-white rounded-xl shadow p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-bold mb-4">Equipment Overview</h2>
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 p-2 text-left">ID</th>
                <th className="border border-gray-200 p-2 text-left">Name</th>
                <th className="border border-gray-200 p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((eq) => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 p-2">{eq.id}</td>
                  <td className="border border-gray-200 p-2">{eq.name}</td>
                  <td className="border border-gray-200 p-2">
                    <span
                      className={`flex items-center gap-2 px-2 py-1 rounded text-white ${
                        eq.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {eq.status === 'active' ? 
                        <CheckCircle className="w-4 h-4" /> : 
                        <XCircle className="w-4 h-4" />}
                      {eq.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

       
           </main>
    </div>
  );
}

export default UserDashboard;