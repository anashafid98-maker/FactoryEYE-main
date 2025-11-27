import React from 'react';
import ChartComponent from './charts/chartComponent';
import { Equipment } from '../types';

interface EquipmentDetailChartsProps {
  data: Equipment[];
  equipmentName: string; // Added the missing property
}

const EquipmentDetailCharts: React.FC<EquipmentDetailChartsProps> = ({ data }) => {
  return (
    <div className="mt-4 space-y-8">
      <div className="space-y-6">
        {/* Pression */}
        
        <ChartComponent
          data={data}
          title="Pression"
          dataKeys={["pressure"]}
          colors={["#dc2626"]}
          unit="bar"
          nameLegend={["Pression"]}
          isDashed={[false]}
        />

        {/* Courant */}
        <ChartComponent
          data={data}
          title="Courant"
          dataKeys={["current"]}
          colors={["#16a34a"]}
          nameLegend={[]}
          isDashed={[]}
        />

        {/* Vibrations */}
        <ChartComponent
          data={data}
          title="Vibrations"
          dataKeys={['vibrationX', 'vibrationY', 'vibrationZ', 'vibrationMean']}
          colors={['#2563eb', '#10b981', '#f59e0b', '#6b7280']}
          nameLegend={['Vibration X', 'Vibration Y', 'Vibration Z', 'Moyenne']}
          unit="mm/s"
          isDashed={[false, false, false, true]}
        />
      </div>
    </div>
  );
};

export default EquipmentDetailCharts;