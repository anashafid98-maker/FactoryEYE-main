import React from 'react';
import { SensorInstallation } from '../data/mockData';
import { Calendar, MapPin, Settings, Package, Hash, User, FileText, Wrench, Download } from 'lucide-react';
import { generateInstallationReportPDF } from '../utils/pdfExport';

interface SensorInstallationReportProps {
  installation: SensorInstallation;
}

const SensorInstallationReport: React.FC<SensorInstallationReportProps> = ({ installation }) => {
  const handleExportPDF = () => {
    generateInstallationReportPDF(installation);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-blue-900 mb-2">RAPPORT D'INSTALLATION</h3>
            <p className="text-xs text-blue-800">{installation.sensorName}</p>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <img
          src={installation.diagram}
          alt="Equipment Diagram"
          className="w-full h-auto rounded"
        />
      </div>

      <div className="space-y-3">
        <div className="border-b border-gray-200 pb-2">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">INFORMATIONS ÉQUIPEMENT</h4>

          <div className="flex items-start space-x-3 mb-2">
            <Settings className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Équipement:</div>
              <div className="text-xs font-medium text-gray-800">{installation.equipmentName}</div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Hash className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Référence:</div>
              <div className="text-xs font-medium text-gray-800">{installation.equipmentReference}</div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-2">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">CAPTEUR</h4>

          <div className="flex items-start space-x-3 mb-2">
            <Package className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Type de capteur:</div>
              <div className="text-xs font-medium text-gray-800">{installation.sensorType}</div>
            </div>
          </div>

          <div className="flex items-start space-x-3 mb-2">
            <Wrench className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Type de mesure:</div>
              <div className="text-xs font-medium text-gray-800">{installation.measurementType}</div>
            </div>
          </div>

          <div className="flex items-start space-x-3 mb-2">
            <Settings className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Fabricant:</div>
              <div className="text-xs font-medium text-gray-800">{installation.manufacturer}</div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Hash className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Numéro de série:</div>
              <div className="text-xs font-medium text-gray-800">{installation.serialNumber}</div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-2">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">INSTALLATION</h4>

          <div className="flex items-start space-x-3 mb-2">
            <Calendar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Date d'installation:</div>
              <div className="text-xs font-medium text-gray-800">
                {new Date(installation.installationDate).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 mb-2">
            <MapPin className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Emplacement:</div>
              <div className="text-xs font-medium text-gray-800">{installation.installationLocation}</div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <User className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Installé par:</div>
              <div className="text-xs font-medium text-gray-800">{installation.installedBy}</div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 pb-2">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">CALIBRATION</h4>

          <div className="flex items-start space-x-3 mb-2">
            <Calendar className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Date de calibration:</div>
              <div className="text-xs font-medium text-gray-800">
                {new Date(installation.calibrationDate).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Calendar className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">Prochaine calibration:</div>
              <div className="text-xs font-medium text-gray-800">
                {new Date(installation.nextCalibrationDate).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2">NOTES</h4>

          <div className="flex items-start space-x-3">
            <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs text-gray-700 leading-relaxed">{installation.notes}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorInstallationReport;
