import React, { useState } from 'react';
import { SensorData } from '../data/mockData';
import StatusBadge from './StatusBadge';
import SensorToggle from './SensorToggle';
import { ChevronDown, FileText, Trash2, ChevronUp, MapPin } from 'lucide-react';

interface Equipment {
  id: string;
  reference: string;
  type: string;
  diagram_url: string | null;
}

interface SensorInstallationDB {
  id: string;
  equipment_id: string;
  position_x: number | null;
  position_y: number | null;
}

interface DataTableProps {
  data: SensorData[];
  onToggleSensor: (sensorId: string, isActive: boolean) => void;
  onViewDiagram: (equipmentRef: string) => void;
  onDeleteSensor: (sensorId: string) => void;
  equipmentDiagrams?: { [key: string]: string };
  equipment?: Equipment[];
  sensors?: SensorInstallationDB[];
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  onToggleSensor,
  onViewDiagram,
  onDeleteSensor,
  equipmentDiagrams = {},
  equipment = [],
  sensors = []
}) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (rowId: string) => {
    setExpandedRow(expandedRow === rowId ? null : rowId);
  };

  const getSensorPosition = (sensorId: string) => {
    const sensor = sensors.find(s => s.id === sensorId);
    return sensor ? { x: sensor.position_x, y: sensor.position_y } : { x: null, y: null };
  };

  return (
    <div className="space-y-4">
      {data.map((row, index) => {
        const isExpanded = expandedRow === row.id;
        const position = getSensorPosition(row.id);
        const equip = equipment.find(e => e.reference === row.equipmentReference);

        return (
          <div
            key={row.id}
            className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">{row.point}</h3>
                    <p className="text-xs text-gray-500">{row.equipmentReference}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={row.status} />
                  <SensorToggle
                    isActive={row.isActive}
                    onToggle={(active) => onToggleSensor(row.id, active)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Type</p>
                  <p className="text-sm font-semibold text-gray-800">{row.type}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">MCA</p>
                  <p className={`text-sm font-semibold ${
                    row.status === 'alarm' ? 'text-red-700' : 'text-green-700'
                  }`}>{row.mca.toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">NOV</p>
                  <p className={`text-sm font-semibold ${
                    row.status === 'alarm' ? 'text-red-700' : 'text-orange-700'
                  }`}>{row.nov.toFixed(2)} mm/s</p>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Température</p>
                  <p className="text-sm font-semibold text-teal-700">{row.temperature.toFixed(1)}°C</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Dernière communication: {row.lastCommunication}
                </p>
                <div className="flex items-center space-x-2">
                  {row.diagramAvailable && row.equipmentReference && equipmentDiagrams[row.equipmentReference] ? (
                    <button
                      onClick={() => toggleRow(row.id)}
                      className="inline-flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-lg text-xs font-medium transition-all shadow-sm"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      <span>{isExpanded ? 'Masquer Position' : 'Voir Position'}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Schéma non disponible</span>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Êtes-vous sûr de vouloir supprimer ce capteur ?')) {
                        onDeleteSensor(row.id);
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                    title="Supprimer le capteur"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {isExpanded && row.equipmentReference && equipmentDiagrams[row.equipmentReference] && (
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-t border-gray-200 p-6">
                <div className="bg-white rounded-lg shadow-sm border border-teal-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-800 mb-1">Position du Capteur</h3>
                      <p className="text-xs text-gray-600">{row.equipmentReference} - {row.point}</p>
                    </div>
                    {position.x !== null && position.y !== null && (
                      <div className="flex items-center space-x-2 bg-teal-50 px-4 py-2 rounded-lg">
                        <MapPin className="w-4 h-4 text-teal-600" />
                        <span className="text-xs font-semibold text-teal-700">
                          X: {position.x}% | Y: {position.y}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="relative flex justify-center items-center bg-gray-100 rounded-lg p-6">
                    <img
                      src={equipmentDiagrams[row.equipmentReference]}
                      alt={`Diagram for ${row.equipmentReference}`}
                      className="max-w-full max-h-96 object-contain rounded shadow-lg"
                    />
                    {position.x !== null && position.y !== null && (
                      <div
                        className="absolute w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow-lg animate-pulse"
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-75"></div>
                      </div>
                    )}
                  </div>
                  {position.x === null || position.y === null ? (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-700">
                        Position du capteur non configurée. Veuillez définir les coordonnées dans les paramètres.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                      <p className="text-xs text-teal-700 font-medium">
                        Le point rouge indique l'emplacement exact du capteur sur l'équipement
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {data.length === 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Aucun capteur trouvé</h3>
          <p className="text-sm text-gray-500">Sélectionnez un équipement dans la barre latérale pour voir ses capteurs</p>
        </div>
      )}
    </div>
  );
};

export default DataTable;
