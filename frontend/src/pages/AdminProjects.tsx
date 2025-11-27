import React, { useState } from 'react';
import { FolderKanban, Clock, Users, CheckCircle, Edit3, Save } from 'lucide-react';

const AdminProjects = () => {
  const [projects, setProjects] = useState([
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
  ]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedProject, setEditedProject] = useState({
    name: '',
    status: '',
    team: '',
    deadline: '',
    progress: 0,
  });

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditedProject({ ...projects[index] });
  };

  const handleSave = (index: number) => {
    const updatedProjects = [...projects];
    updatedProjects[index] = editedProject;
    setProjects(updatedProjects);
    setEditingIndex(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: string) => {
    setEditedProject({ ...editedProject, [field]: e.target.value });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Projets</h1>
      
      <div className="grid gap-6">
        {projects.map((project, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            {editingIndex === index ? (
              <div>
                {/* Editable Fields */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Nom du projet</label>
                  <input
                    type="text"
                    value={editedProject.name}
                    onChange={(e) => handleChange(e, 'name')}
                    className="mt-1 block w-full p-2 border rounded-lg"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Statut</label>
                  <select
                    value={editedProject.status}
                    onChange={(e) => handleChange(e, 'status')}
                    className="mt-1 block w-full p-2 border rounded-lg"
                  >
                    <option value="En cours">En cours</option>
                    <option value="Planifié">Planifié</option>
                    <option value="Complété">Complété</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Équipe</label>
                  <input
                    type="text"
                    value={editedProject.team}
                    onChange={(e) => handleChange(e, 'team')}
                    className="mt-1 block w-full p-2 border rounded-lg"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Échéance</label>
                  <input
                    type="date"
                    value={editedProject.deadline}
                    onChange={(e) => handleChange(e, 'deadline')}
                    className="mt-1 block w-full p-2 border rounded-lg"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Progrès (%)</label>
                  <input
                    type="number"
                    value={editedProject.progress}
                    onChange={(e) => handleChange(e, 'progress')}
                    className="mt-1 block w-full p-2 border rounded-lg"
                  />
                </div>
                <button
                  onClick={() => handleSave(index)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  <Save className="w-4 h-4 inline-block mr-2" /> Sauvegarder
                </button>
              </div>
            ) : (
              <div>
                {/* Display Fields */}
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
                <button
                  onClick={() => handleEdit(index)}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Edit3 className="w-4 h-4 inline-block mr-2" /> Modifier
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminProjects;