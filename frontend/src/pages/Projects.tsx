import React from 'react';
import { FolderKanban, Clock, Users, CheckCircle } from 'lucide-react';

const Projects = () => {
  const projects = [
    {
      name: 'Maintenance Préventive - Ligne A',
      status: 'En cours',
      team: 'Équipe Maintenance',
      deadline: '2024-03-25',
      progress: 65,
    },
    {
      name: 'Mise à niveau Système Contrôle',
      status: 'Planifié',
      team: 'Équipe Automation',
      deadline: '2024-04-15',
      progress: 20,
    },
    {
      name: 'Remplacement Pompes P-101',
      status: 'Complété',
      team: 'Équipe Technique',
      deadline: '2024-03-10',
      progress: 100,
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Projets</h1>
      
      <div className="grid gap-6">
        {projects.map((project, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FolderKanban className="w-6 h-6 text-blue-500 mr-3" />
                <h2 className="text-lg font-semibold">{project.name}</h2>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                project.status === 'En cours' 
                  ? 'bg-blue-100 text-blue-800'
                  : project.status === 'Planifié'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {project.status}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">Échéance: {project.deadline}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">{project.team}</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">Progrès: {project.progress}%</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  project.status === 'Complété'
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;