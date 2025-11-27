import React, { useState } from 'react';
import { addHours, addDays, format, parseISO, subDays, subHours } from 'date-fns';
import DatePicker from 'react-datepicker';
import { Clock, Calendar, ZoomIn, ZoomOut } from 'lucide-react';
import { TimeRange, TimeRangeOption } from '../types';

interface TimeNavigationProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  selectedTimeOption: TimeRangeOption;
  onTimeOptionChange: (option: TimeRangeOption) => void;
}

const TimeNavigation: React.FC<TimeNavigationProps> = ({
  timeRange, 
  onTimeRangeChange,
  selectedTimeOption,
  onTimeOptionChange
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleTimeOptionClick = (option: TimeRangeOption) => {
    onTimeOptionChange(option);
    const now = new Date();
    
    let newRange: TimeRange;
    switch(option) {
      case '1h':
        newRange = { start: subHours(now, 1), end: now };
        break;
      case '6h':
        newRange = { start: subHours(now, 6), end: now };
        break;
      case '12h':
        newRange = { start: subHours(now, 12), end: now };
        break;
      case '24h':
        newRange = { start: subHours(now, 24), end: now };
        break;
      case '7d':
        newRange = { start: subDays(now, 7), end: now };
        break;
      case 'custom':
        setShowDatePicker(true);
        return; // Don't update time range yet
      default:
        return;
    }
    
    onTimeRangeChange(newRange);
  };

  const handleCustomRangeChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    if (start && end) {
      onTimeRangeChange({ start, end });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-between sm:items-center">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <span className="text-gray-700 font-medium">Période:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {(['1h', '6h', '12h', '24h', '7d'] as TimeRangeOption[]).map((option) => (
            <button
              key={option}
              onClick={() => handleTimeOptionClick(option)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedTimeOption === option
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option}
            </button>
          ))}
          
          <button
            onClick={() => handleTimeOptionClick('custom')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
              selectedTimeOption === 'custom'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Personnalisé</span>
          </button>
        </div>
      </div>
      
      {showDatePicker && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-2 sm:mb-0">
              <Calendar className="w-5 h-5 text-gray-600 mr-2" />
              <span className="text-gray-700 font-medium">Sélectionnez la plage de dates:</span>
            </div>
            <DatePicker
              selected={timeRange.start}
              onChange={handleCustomRangeChange}
              startDate={timeRange.start}
              endDate={timeRange.end}
              selectsRange
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd/MM/yyyy HH:mm"
              className="p-2 border rounded-lg w-full sm:w-auto"
              wrapperClassName="w-full sm:w-auto"
            />
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Plage sélectionnée: {format(timeRange.start, 'dd/MM/yyyy HH:mm')} - {format(timeRange.end, 'dd/MM/yyyy HH:mm')}
          </div>
          
          <button
            onClick={() => setShowDatePicker(false)}
            className="mt-2 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Fermer
          </button>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500 flex items-center">
        <span className="mr-2">Intervalle: 20 secondes</span>
        <div className="h-4 border-l border-gray-300 mx-2"></div>
        <span>Période actuelle: {format(timeRange.start, 'dd/MM/yyyy HH:mm')} - {format(timeRange.end, 'dd/MM/yyyy HH:mm')}</span>
      </div>
    </div>
  );
};

export default TimeNavigation;