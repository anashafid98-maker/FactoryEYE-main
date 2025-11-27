import React from 'react';
import { Bell, Lock, Globe, Database, Monitor, HelpCircle } from 'lucide-react';

const Settings = () => {
  const settingsSections = [
    {
      title: 'Notifications',
      icon: Bell,
      settings: [
        { name: 'Alertes critiques', description: 'Notifications pour les événements urgents', enabled: true },
        { name: 'Rapports quotidiens', description: 'Résumé quotidien des performances', enabled: false },
        { name: 'Maintenance planifiée', description: 'Rappels de maintenance', enabled: true },
      ]
    },
    {
      title: 'Sécurité',
      icon: Lock,
      settings: [
        { name: 'Authentification à deux facteurs', description: 'Sécurité renforcée du compte', enabled: true },
        { name: 'Sessions actives', description: 'Gérer les connexions actives', enabled: false },
      ]
    },
    {
      title: 'Système',
      icon: Monitor,
      settings: [
        { name: 'Mode sombre', description: 'Thème de l\'interface', enabled: false },
        { name: 'Mise à jour automatique', description: 'Mises à jour du système', enabled: true },
      ]
    },
    {
      title: 'Données',
      icon: Database,
      settings: [
        { name: 'Sauvegarde automatique', description: 'Backup des données', enabled: true },
        { name: 'Rétention des données', description: 'Durée de conservation', enabled: true },
      ]
    },
    {
      title: 'Langue',
      icon: Globe,
      settings: [
        { name: 'Langue du système', description: 'Français', enabled: true },
        { name: 'Format de date', description: 'DD/MM/YYYY', enabled: true },
      ]
    },
    {
      title: 'Aide',
      icon: HelpCircle,
      settings: [
        { name: 'Guide utilisateur', description: 'Documentation du système', enabled: true },
        { name: 'Support technique', description: 'Contacter le support', enabled: true },
      ]
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      
      <div className="grid gap-6">
        {settingsSections.map((section, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <section.icon className="w-6 h-6 text-blue-500 mr-3" />
              <h2 className="text-lg font-semibold">{section.title}</h2>
            </div>
            
            <div className="space-y-4">
              {section.settings.map((setting, settingIndex) => (
                <div key={settingIndex} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{setting.name}</h3>
                    <p className="text-sm text-gray-600">{setting.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      defaultChecked={setting.enabled}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Settings;