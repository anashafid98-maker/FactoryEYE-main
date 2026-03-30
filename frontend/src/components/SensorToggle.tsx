import React from 'react';
import { Power } from 'lucide-react';

interface SensorToggleProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

const SensorToggle: React.FC<SensorToggleProps> = ({ isActive, onToggle }) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onToggle(!isActive)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isActive
            ? 'bg-green-600 focus:ring-green-500'
            : 'bg-gray-300 focus:ring-gray-400'
        }`}
        role="switch"
        aria-checked={isActive}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isActive ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <div className="flex items-center space-x-1">
        <Power className={`w-4 h-4 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
        <span className={`text-xs font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
          {isActive ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>
  );
};

export default SensorToggle;
