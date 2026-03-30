import React, { useState } from 'react';
import { Settings, Circle, Hash, Building2, Wrench, Grid3x3, MapPin, Zap, Download } from 'lucide-react';
import SensorInstallationReport from './SensorInstallationReport';
import AssetDiagramView from './AssetDiagramView';
import { SensorInstallation, equipmentDiagrams } from '../data/mockData';
import airCompressorDiagram from './assets/Illustration of industrial piston air compressor.png';

interface Equipment {
  id: string;
  reference: string;
  type: string;
  manufacturer: string | null;
  model: string | null;
  diagram_url: string | null;
}

interface SensorInstallationDB {
  id: string;
  equipment_id: string;
  sensor_name: string;
  installation_point: string;
  is_active: boolean;
}

interface ActionsPanelProps {
  selectedSensor: SensorInstallation | null;
  selectedEquipment?: Equipment | null;
  equipmentSensors?: SensorInstallationDB[];
  onViewDiagram?: (equipmentRef: string) => void;
}

// Constants for the fallback air compressor diagram â centralises path and alt text,
// making future asset renames a single-line change.
const AIR_COMPRESSOR_DIAGRAM_SRC = airCompressorDiagram;
const AIR_COMPRESSOR_DIAGRAM_ALT =
  'Industrial piston air compressor schematic diagram';

const ActionsPanel: React.FC<ActionsPanelProps> = ({ selectedSensor, selectedEquipment, equipmentSensors = [], onViewDiagram }) => {
  const [showDiagram, setShowDiagram] = useState(false);
  // Tracks whether the fallback diagram image failed to load so a
  // graceful placeholder can be shown instead of a broken-image icon.
  const [diagramLoadError, setDiagramLoadError] = useState(false);

  const handleViewDiagram = () => {
    if (selectedSensor) {
      const diagram = equipmentDiagrams[selectedSensor.equipmentReference];
      if (diagram) {
        setShowDiagram(true);
      }
    }
  };

  const handleExportEquipmentReport = () => {
    if (equipmentSensors.length > 0) {
      alert('Fonctionnalité dexportation PDF en cours de développement.');
    } else {
      alert('Aucun capteurr installe sur cet equipement.');
    }
  };

  const activeSensorsCount = equipmentSensors.filter(s => s.is_active).length;
  const totalSensorsCount = equipmentSensors.length;

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-screen overflow-y-auto flex-shrink-0">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-3">
        <h2 className="text-sm font-semibold">ACTIONS</h2>
      </div>

      <div className="p-4">
        {selectedEquipment ? (
          <>
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Équipement Sélectionné</h3>

              {selectedEquipment.diagram_url && (
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <img
                    src={selectedEquipment.diagram_url}
                    alt={`${selectedEquipment.type} Diagram`}
                    className="w-full h-auto rounded shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="mb-4 bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg p-4 border border-teal-200">
              <h3 className="text-xs font-semibold text-teal-700 mb-3 uppercase tracking-wide">Détails de l'Équipement</h3>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Hash className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-600">Référence:</div>
                    <div className="text-sm font-semibold text-gray-800">{selectedEquipment.reference}</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Settings className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-600">Type:</div>
                    <div className="text-sm font-semibold text-gray-800">{selectedEquipment.type}</div>
                  </div>
                </div>

                {selectedEquipment.manufacturer && (
                  <div className="flex items-start space-x-3">
                    <Building2 className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-600">Fabricant:</div>
                      <div className="text-sm font-semibold text-gray-800">{selectedEquipment.manufacturer}</div>
                    </div>
                  </div>
                )}

                {selectedEquipment.model && (
                  <div className="flex items-start space-x-3">
                    <Wrench className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-600">Modèle:</div>
                      <div className="text-sm font-semibold text-gray-800">{selectedEquipment.model}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4 bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center">
                <Zap className="w-4 h-4 mr-2 text-orange-500" />
                État des Capteurs
              </h3>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Actifs</div>
                  <div className="text-2xl font-bold text-green-700">{activeSensorsCount}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Total</div>
                  <div className="text-2xl font-bold text-gray-700">{totalSensorsCount}</div>
                </div>
              </div>

              {equipmentSensors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">Points de Mesure:</h4>
                  {equipmentSensors.map((sensor) => (
                    <div key={sensor.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${sensor.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        <div>
                          <div className="text-xs font-medium text-gray-800">{sensor.sensor_name}</div>
                          <div className="text-xs text-gray-500">{sensor.installation_point}</div>
                        </div>
                      </div>
                      <MapPin className="w-3 h-3 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}

              {equipmentSensors.length === 0 && (
                <div className="text-center py-4 text-xs text-gray-500">
                  Aucun capteur installé sur cet équipement
                </div>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <button 
                onClick={handleExportEquipmentReport}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Exporter le Rapport PDF</span>
              </button>
            </div>
          </>
        ) : selectedSensor ? (
          <>
            <div className="mb-4">
              <button
                onClick={handleViewDiagram}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Voir Schéma d'Installation Complet</span>
              </button>
            </div>
            <SensorInstallationReport installation={selectedSensor} />

            {showDiagram && selectedSensor && equipmentDiagrams[selectedSensor.equipmentReference] && (
              <AssetDiagramView
                equipmentName={selectedSensor.equipmentName}
                equipmentReference={selectedSensor.equipmentReference}
                sensors={equipmentDiagrams[selectedSensor.equipmentReference].sensors}
                diagram={equipmentDiagrams[selectedSensor.equipmentReference].diagram}
                onClose={() => setShowDiagram(false)}
              />
            )}
          </>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Schemas / Asset Diagram</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                {!diagramLoadError ? (
                  <img
                    src={AIR_COMPRESSOR_DIAGRAM_SRC}
                    alt={AIR_COMPRESSOR_DIAGRAM_ALT}
                    className="w-full h-auto object-contain rounded"
                    loading="lazy"
                    decoding="async"
                    onError={() => setDiagramLoadError(true)}
                  />
                ) : (
                  // Graceful fallback shown when the asset cannot be fetched
                  <div className="w-full flex flex-col items-center justify-center py-6 text-gray-400">
                    <svg
                      className="w-10 h-10 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-xs">Diagram unavailable</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <button className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-between text-xs font-medium text-gray-700">
                <span>ASSET DETAILS</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-3">CHARACTERISTICS:</h3>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Settings className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Name:</div>
                    <div className="text-xs font-medium text-gray-800">Compresseur NUAIR</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Circle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Status:</div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white">
                        Normal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Hash className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Reference:</div>
                    <div className="text-xs font-medium text-gray-800">1204</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Building2 className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Entity:</div>
                    <div className="text-xs font-medium text-gray-800">Atelier</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Wrench className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Famille:</div>
                    <div className="text-xs font-medium text-gray-800">Machine Tournante</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Grid3x3 className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Class:</div>
                    <div className="text-xs font-medium text-gray-800">A</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 font-medium mb-2">
                Sélectionnez un équipement ou un capteur
              </p>
              <p className="text-xs text-blue-700">
                Cliquez sur un équipement dans l'arborescence pour voir ses détails et capteurs, ou sélectionnez un capteur pour voir son rapport d'installation.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionsPanel;

