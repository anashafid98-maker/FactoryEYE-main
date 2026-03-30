import React from 'react';
import { X, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';

interface SensorMarker {
  id: string;
  name: string;
  status: 'good' | 'alarm';
  position: { x: number; y: number };
  location: string;
}

interface AssetDiagramViewProps {
  equipmentName: string;
  equipmentReference: string;
  sensors: SensorMarker[];
  diagram: string;
  onClose: () => void;
}

const AssetDiagramView: React.FC<AssetDiagramViewProps> = ({
  equipmentName,
  equipmentReference,
  sensors,
  diagram,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Schéma d'Installation - {equipmentName}</h2>
            <p className="text-sm text-gray-300">Référence: {equipmentReference}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="relative inline-block">
            <img
              src={diagram}
              alt="Asset Diagram"
              className="w-full h-auto rounded-lg shadow-lg"
            />

            {sensors.map((sensor) => (
              <div
                key={sensor.id}
                className="absolute"
                style={{
                  left: `${sensor.position.x}%`,
                  top: `${sensor.position.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative group">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg border-2 border-white transition-transform hover:scale-125 ${
                      sensor.status === 'alarm'
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-green-500'
                    }`}
                  >
                    {sensor.status === 'alarm' ? (
                      <AlertTriangle className="w-5 h-5 text-white" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-white" />
                    )}
                  </div>

                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                      <div className="font-bold mb-1">{sensor.name}</div>
                      <div className="flex items-center space-x-1 text-gray-300">
                        <MapPin className="w-3 h-3" />
                        <span>{sensor.location}</span>
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            sensor.status === 'alarm'
                              ? 'bg-red-600 text-white'
                              : 'bg-green-600 text-white'
                          }`}
                        >
                          {sensor.status === 'alarm' ? 'Alarme' : 'Normal'}
                        </span>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
                <span className="text-sm text-gray-700">Capteur Normal</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>
                <span className="text-sm text-gray-700">Capteur en Alarme</span>
              </div>
              <div className="text-sm text-gray-600">
                Total: {sensors.length} capteur{sensors.length > 1 ? 's' : ''}
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDiagramView;
