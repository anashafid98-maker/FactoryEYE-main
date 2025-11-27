import React from 'react';

type TimeRange = '3days' | 'week' | 'month';

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onChange: (range: TimeRange) => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ selectedRange, onChange }) => {
  return (
    <div className="flex rounded-lg overflow-hidden shadow-sm border border-gray-200">
      <button
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          selectedRange === '3days' 
            ? 'bg-blue-600 text-white' 
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        onClick={() => onChange('3days')}
      >
        Derniers 3 jours
      </button>
      <button
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          selectedRange === 'week' 
            ? 'bg-blue-600 text-white' 
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        onClick={() => onChange('week')}
      >
        Semaine dernière
      </button>
      <button
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          selectedRange === 'month' 
            ? 'bg-blue-600 text-white' 
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
        onClick={() => onChange('month')}
      >
        Mois dernier
      </button>
    </div>
  );
};

export default TimeRangeSelector;