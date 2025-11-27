import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function EquipmentStats() {
  const [totalEquipment, setTotalEquipment] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEquipmentCount = async () => {
      try {
        const response = await fetch('http://10.190.50.127::8889/api/equipments/total');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setTotalEquipment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch equipment count');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipmentCount();
  }, []);

  if (loading) {
    return (
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-700">Total Equipment</h3>
          <Activity className="text-blue-600 animate-pulse" />
        </div>
        <p className="text-3xl font-bold mt-2 text-gray-400">...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-700">Total Equipment</h3>
          <Activity className="text-red-600" />
        </div>
        <p className="text-red-500 mt-2">Error: {error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants} className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-700">Total Equipment</h3>
        <Activity className="text-blue-600" />
      </div>
      <p className="text-3xl font-bold mt-2">{totalEquipment}</p>
    </motion.div>
  );
}