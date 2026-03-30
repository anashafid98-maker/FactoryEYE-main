import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'good' | 'alarm';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === 'alarm') {
    return (
      <div className="flex items-center space-x-1 text-red-600">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-xs font-medium">Alarm</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 text-green-600">
      <CheckCircle className="w-4 h-4" />
      <span className="text-xs font-medium">good</span>
    </div>
  );
};

export default StatusBadge;
