import React from 'react';
import { Zone } from '../types';

interface EquipmentZonesListProps {
  zones: Zone[];
  expandedZoneId: number | null;
  setExpandedZoneId: (id: number | null) => void;
  selectedEquipment: string | null;
  setSelectedEquipment: (equipment: string | null) => void;
}

const EquipmentZonesList: React.FC<EquipmentZonesListProps> = ({
  zones,
  expandedZoneId,
  setExpandedZoneId,
  selectedEquipment,
  setSelectedEquipment
}) => {
  return (
    <div className="grid gap-6">
      {zones.map(zone => (
        <div key={zone.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div
            className="flex justify-between items-center cursor-pointer mb-4 group"
            onClick={() => setExpandedZoneId(expandedZoneId === zone.id ? null : zone.id)}
          >
            <div className="flex items-center gap-3">
              <div className={`transform transition-transform duration-200 ${expandedZoneId === zone.id ? 'rotate-90' : ''}`}>
                ➤
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{zone.name}</h2>
            </div>
          </div>

          {expandedZoneId === zone.id && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {zone.equipment.map((eq, i) => (
                  <div
                    key={i}
                    className={`flex flex-col px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedEquipment === eq 
                        ? 'bg-blue-100 border-2 border-blue-300' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedEquipment(eq === selectedEquipment ? null : eq)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">{eq}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EquipmentZonesList;