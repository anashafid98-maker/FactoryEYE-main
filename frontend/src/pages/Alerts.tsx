import React from "react";

import { AlertTriangle, CheckCircle } from 'lucide-react';

const Alerts = () => {
  const predictions = [
    {
      equipment: 'Pompe P-101',
      prediction: 'Risque de panne dans 48h',
      severity: 'high',
      details: 'Vibrations anormales détectées',
    },
    {
      equipment: 'Compresseur C-201',
      prediction: 'Fonctionnement normal',
      severity: 'normal',
      details: 'Aucune anomalie détectée',
    },
    {
      equipment: 'Moteur M-301',
      prediction: 'Maintenance préventive recommandée',
      severity: 'medium',
      details: 'Usure progressive des roulements',
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Prédictions et Alertes</h1>
      
      <div className="grid gap-4">
        {predictions.map((item, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border ${
              item.severity === 'high' 
                ? 'bg-red-50 border-red-200' 
                : item.severity === 'medium'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {item.severity === 'normal' ? (
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                ) : (
                  <AlertTriangle className={`w-6 h-6 ${
                    item.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                  } mr-3`} />
                )}
                <div>
                  <h3 className="font-semibold">{item.equipment}</h3>
                  <p className="text-sm text-gray-600">{item.prediction}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                item.severity === 'high' 
                  ? 'bg-red-100 text-red-800' 
                  : item.severity === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {item.severity === 'high' ? 'Urgent' : item.severity === 'medium' ? 'Attention' : 'Normal'}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{item.details}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Alerts;