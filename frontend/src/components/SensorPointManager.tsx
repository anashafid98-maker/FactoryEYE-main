
import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, MapPin, Settings } from 'lucide-react';
import { api, mockData, Equipment, SensorInstallationDB } from '../api/lib/supabase';

interface SensorPointManagerProps {
  equipmentId: string;
  onClose: () => void;
}

const SensorPointManager: React.FC<SensorPointManagerProps> = ({ equipmentId, onClose }) => {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [sensors, setSensors] = useState<SensorInstallationDB[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sensorForm, setSensorForm] = useState({
    sensor_name: '',
    sensor_type: '',
    measurement_type: '',
    installation_point: '',
    position_x: '0',
    position_y: '0',
    manufacturer: '',
    model: '',
    serial_number: '',
    installed_by: '',
    notes: '',
  });

  const loadEquipmentAndSensors = useCallback(async () => {
    setIsLoading(true);
    const numericId = Number(equipmentId);
    try {
      // Get all equipment and filter by ID
      const allEquipment = await api.getEquipment(numericId);
      const equip = Array.isArray(allEquipment) ? allEquipment.find(e => e.id === numericId) : null;
      if (equip) {
        setEquipment(equip);
      } else {
        // Try mock data
        const mockEquip = mockData.equipment.find(e => e.id === numericId);
        if (mockEquip) setEquipment(mockEquip);
      }

      // Get sensors for this equipment
      const allSensors = await api.getSensorInstallations(equipmentId);
      setSensors(Array.isArray(allSensors) ? allSensors : []);
    } catch (error) {
      console.log('Using mock data for sensors:', error);
      // Fall back to mock data
      const mockSensors = mockData.sensorInstallations.filter(s => s.equipment_id === equipmentId);
      setSensors(mockSensors);
      
      const mockEquip = mockData.equipment.find(e => e.id === numericId);
      if (mockEquip) setEquipment(mockEquip);
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    loadEquipmentAndSensors();
  }, [loadEquipmentAndSensors]);

  const handleCreateSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextCalibration = nextYear.toISOString().split('T')[0];

    const newSensor = {
      equipment_id: equipmentId,
      sensor_name: sensorForm.sensor_name,
      sensor_type: sensorForm.sensor_type,
      measurement_type: sensorForm.measurement_type,
      installation_point: sensorForm.installation_point,
      position_x: parseFloat(sensorForm.position_x),
      position_y: parseFloat(sensorForm.position_y),
      manufacturer: sensorForm.manufacturer,
      model: sensorForm.model,
      serial_number: sensorForm.serial_number,
      installation_date: today,
      calibration_date: today,
      next_calibration_date: nextCalibration,
      installed_by: sensorForm.installed_by,
      is_active: true,
      status: 'good' as const,
      notes: sensorForm.notes,
    };

    try {
      await api.createSensorInstallation(newSensor);
      setSensorForm({
        sensor_name: '',
        sensor_type: '',
        measurement_type: '',
        installation_point: '',
        position_x: '0',
        position_y: '0',
        manufacturer: '',
        model: '',
        serial_number: '',
        installed_by: '',
        notes: '',
      });
      setShowForm(false);
      loadEquipmentAndSensors();
    } catch (error) {
      console.error('Error creating sensor:', error);
      // Still close form and reload on mock
      setShowForm(false);
      loadEquipmentAndSensors();
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSensor = async (sensorId: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      await api.toggleSensorStatus(sensorId, !currentStatus);
      loadEquipmentAndSensors();
    } catch (error) {
      console.log('Using mock toggle:', error);
      // Update local state for mock
      setSensors(prev => prev.map(s => 
        s.id === sensorId ? { ...s, is_active: !currentStatus } : s
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Points d'Installation - Capteurs</h2>
              {equipment && (
                <p className="text-sm text-gray-600">{equipment.name} ({equipment.reference})</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          )}

          <div className="mb-4">
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Point d'Installation</span>
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreateSensor} className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Specifier un point d'installation</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nom du-capteur *"
                    value={sensorForm.sensor_name}
                    onChange={(e) => setSensorForm({ ...sensorForm, sensor_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Point d'installation *"
                    value={sensorForm.installation_point}
                    onChange={(e) => setSensorForm({ ...sensorForm, installation_point: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Type de capteur"
                    value={sensorForm.sensor_type}
                    onChange={(e) => setSensorForm({ ...sensorForm, sensor_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Type de mesure"
                    value={sensorForm.measurement_type}
                    onChange={(e) => setSensorForm({ ...sensorForm, measurement_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Position X sur schema"
                    value={sensorForm.position_x}
                    onChange={(e) => setSensorForm({ ...sensorForm, position_x: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Position Y sur schema"
                    value={sensorForm.position_y}
                    onChange={(e) => setSensorForm({ ...sensorForm, position_y: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Fabricant"
                    value={sensorForm.manufacturer}
                    onChange={(e) => setSensorForm({ ...sensorForm, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Modele"
                    value={sensorForm.model}
                    onChange={(e) => setSensorForm({ ...sensorForm, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Numero de serie"
                    value={sensorForm.serial_number}
                    onChange={(e) => setSensorForm({ ...sensorForm, serial_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Installe par"
                  value={sensorForm.installed_by}
                  onChange={(e) => setSensorForm({ ...sensorForm, installed_by: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />

                <textarea
                  placeholder="Notes d'installation"
                  value={sensorForm.notes}
                  onChange={(e) => setSensorForm({ ...sensorForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  rows={3}
                />

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Creer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Capteurs installes ({sensors.length})</h3>

            {sensors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Aucun capteur installe sur cet equipement</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {sensors.map((sensor) => (
                  <div
                    key={sensor.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800">{sensor.sensor_name}</h4>
                          <p className="text-xs text-gray-600">{sensor.installation_point}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            sensor.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {sensor.is_active ? 'Actif' : 'Inactif'}
                        </span>
                        <button
                          onClick={() => handleToggleSensor(sensor.id, sensor.is_active)}
                          disabled={isLoading}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                            sensor.is_active
                              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {sensor.is_active ? 'Desactiver' : 'Activer'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2 text-gray-800">{sensor.sensor_type || 'Non specifie'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Mesure:</span>
                        <span className="ml-2 text-gray-800">{sensor.measurement_type || 'Non specifie'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Position:</span>
                        <span className="ml-2 text-gray-800">X: {sensor.position_x}, Y: {sensor.position_y}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fabricant:</span>
                        <span className="ml-2 text-gray-800">{sensor.manufacturer || 'Non specifie'}</span>
                      </div>
                      {sensor.installation_date && (
                        <div>
                          <span className="text-gray-500">Installe le:</span>
                          <span className="ml-2 text-gray-800">
                            {new Date(sensor.installation_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                      {sensor.installed_by && (
                        <div>
                          <span className="text-gray-500">Par:</span>
                          <span className="ml-2 text-gray-800">{sensor.installed_by}</span>
                        </div>
                      )}
                    </div>

                    {sensor.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-700">{sensor.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorPointManager;

