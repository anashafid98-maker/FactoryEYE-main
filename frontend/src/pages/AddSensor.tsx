// src/pages/AddSensor.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddSensor: React.FC = () => {
  const navigate = useNavigate();
  const [sensor, setSensor] = useState({
    name: '',
    type: 'Vibration',
    customType: '',
    quantity: 1,
    location: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
              
    const finalSensor = {
      ...sensor,
      type: sensor.type === 'Autre' ? sensor.customType : sensor.type,
    };

    console.log('Sensor to submit:', finalSensor);

    // Simulate submission and go back
    navigate('/overview');
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">Ajouter un nouveau capteur</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4 max-w-lg mx-auto">
        <input
          type="text"
          placeholder="Nom du capteur"
          value={sensor.name}
          onChange={(e) => setSensor({ ...sensor, name: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <select
          value={sensor.type}
          onChange={(e) => setSensor({ ...sensor, type: e.target.value })}
          className="w-full p-2 border rounded"
        >
          <option value="Vibration">Vibration</option>
          <option value="Temperature">Temperature</option>
          <option value="Courant">Courant</option>
          <option value="Pressure">Pressure</option>
          <option value="Débimetre">Débimetre</option>
          <option value="Autre">Autre</option>
        </select>
        {sensor.type === 'Autre' && (
          <input
            type="text"
            placeholder="Spécifier le type"
            value={sensor.customType}
            onChange={(e) => setSensor({ ...sensor, customType: e.target.value })}
            className="w-full p-2 border rounded"
          />
        )}
        <input
          type="number"
          placeholder="Quantité"
          value={sensor.quantity}
          onChange={(e) => setSensor({ ...sensor, quantity: parseInt(e.target.value) })}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Projet"
          value={sensor.location}
          onChange={(e) => setSensor({ ...sensor, location: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        <div className="flex justify-between">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Ajouter
          </button>
          <button
            type="button"
            onClick={() => navigate('/overview')}
            className="text-sm text-gray-500 hover:underline"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSensor;
