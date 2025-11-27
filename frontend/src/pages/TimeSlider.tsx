import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TimeSliderProps {
  min: number;    // Timestamp en ms
  max: number;    // Timestamp en ms
  value: number;  // Timestamp en ms
  onChange: (value: number) => void;
}

const TimeSlider: React.FC<TimeSliderProps> = ({ min, max, value, onChange }) => {
  const [currentTime, setCurrentTime] = useState(value);
  const STEP_MS = 20000; // 20 secondes en millisecondes

  useEffect(() => {
    setCurrentTime(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseInt(e.target.value, 10);
    setCurrentTime(newTime);
    onChange(newTime);
  };

  const handleStepBack = () => {
    const newTime = Math.max(currentTime - STEP_MS, min);
    setCurrentTime(newTime);
    onChange(newTime);
  };

  const handleStepForward = () => {
    const newTime = Math.min(currentTime + STEP_MS, max);
    setCurrentTime(newTime);
    onChange(newTime);
  };

  // Conversion pour l'affichage
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex justify-between text-sm text-gray-600">
        <span>{formatTime(min)}</span>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(max)}</span>
      </div>

      <div className="flex items-center space-x-4 w-full">
        <button
          onClick={handleStepBack}
          disabled={currentTime <= min}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="relative w-full h-8 flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={STEP_MS}
            value={currentTime}
            onChange={handleChange}
            className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer 
              [&::-webkit-slider-thumb]:appearance-none 
              [&::-webkit-slider-thumb]:h-5 
              [&::-webkit-slider-thumb]:w-5 
              [&::-webkit-slider-thumb]:rounded-full 
              [&::-webkit-slider-thumb]:bg-blue-600 
              [&::-webkit-slider-thumb]:border-4 
              [&::-webkit-slider-thumb]:border-white 
              [&::-webkit-slider-thumb]:shadow-lg"
          />
        </div>

        <button
          onClick={handleStepForward}
          disabled={currentTime >= max}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TimeSlider;