import React from 'react';

export interface Sensor {
  id: string;
  x: number; // 0-100 percentage coordinate
  y: number; // 0-100 percentage coordinate
}

export interface CompressorDiagramProps {
  sensors: Sensor[];
}

const CompressorDiagram: React.FC<CompressorDiagramProps> = ({ sensors }) => {
  // simple rectangle representing the body
  // sensors placed with relative coordinates
  return (
    <div className="mt-4">
      <svg width="300" height="150" viewBox="0 0 100 50" className="border">
        {/* body */}
        <rect x="5" y="5" width="90" height="40" fill="#e0e0e0" stroke="#333" />
        {/* sensors */}
        {sensors.map((s) => (
          <circle
            key={s.id}
            cx={(s.x / 100) * 100}
            cy={(s.y / 100) * 50}
            r="3"
            fill="red"
          >
            <title>{s.id}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

export default CompressorDiagram;
