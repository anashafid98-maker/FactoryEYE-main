import React, { useState } from 'react';
import { Trash2, Pencil, UserCircle, X } from 'lucide-react';

const Users: React.FC = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Hayyan Mohamed', role: 'BU', lastLogin: '2025-04-09', status: 'Connected', projects: 'All', company: 'Actemium' },
    { id: 2, name: 'Chalkhane Loubna', role: 'EN', lastLogin: '2025-04-08', status: 'Busy', projects: 'All', company: 'Actemium' },
    { id: 3, name: 'Zerki Ikram', role: 'BM', lastLogin: '2025-04-08', status: 'Busy', projects: 'All', company: 'Actemium' },
    { id: 4, name: 'Daoudi Issam', role: 'EN', lastLogin: '2025-04-08', status: 'Busy', projects: 'All', company: 'Actemium' },
    { id: 5, name: 'Admin', role: 'Admin', lastLogin: '2025-04-08', status: 'Connected', projects: 'All', company: 'Actemium' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    role: 'Select',
    status: 'Offline',
    lastLogin: '',
    projects: '',
    company: '',
  });

  const roles = ['Technicien', 'Ingénieur', 'BU', 'BM', 'Admin', 'Client'];

  const handleSave = () => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...editingUser, ...newUser } : u));
    } else {
      const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
      setUsers([...users, { id, ...newUser }]);
    }

    setShowModal(false);
    setNewUser({ name: '', role: 'Technicien', status: 'Offline', lastLogin: '', projects: '', company: '' });
    setEditingUser(null);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setNewUser({ ...user });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    setUsers(users.filter(user => user.id !== id));
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">Gestion des utilisateurs</h1>

      <button
        onClick={() => { setShowModal(true); setEditingUser(null); }}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        + Ajouter un utilisateur
      </button>

      <table className="w-full bg-white rounded shadow text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Nom</th>
            <th className="p-2 text-left">Rôle</th>
            <th className="p-2 text-left">Statut</th>
            <th className="p-2 text-left">Dernière Connexion</th>
            <th className="p-2 text-left">Projets</th>
            <th className="p-2 text-left">Entreprise</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-t">
              <td className="p-2">{user.id}</td>
              <td className="p-2 flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-blue-600" /> {user.name}
              </td>
              <td className="p-2">{user.role}</td>
              <td className="p-2">{user.status}</td>
              <td className="p-2">{user.lastLogin}</td>
              <td className="p-2">{user.projects}</td>
              <td className="p-2">{user.company}</td>
              <td className="p-2 flex gap-2">
                <button onClick={() => handleEdit(user)} className="text-blue-600 hover:underline">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:underline">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md relative">
            <button onClick={() => setShowModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold mb-4">{editingUser ? 'Modifier' : 'Ajouter'} un utilisateur</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nom"
                value={newUser.name}
                onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <select
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full p-2 border rounded"
              >
                {roles.map(role => <option key={role}>{role}</option>)}
              </select>
              <select
                value={newUser.status}
                onChange={e => setNewUser({ ...newUser, status: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option>Connected</option>
                <option>Busy</option>
                <option>Offline</option>
              </select>
              <input
                type="date"
                value={newUser.lastLogin}
                onChange={e => setNewUser({ ...newUser, lastLogin: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Projets assignés (ex: SAP, Inventory)"
                value={newUser.projects}
                onChange={e => setNewUser({ ...newUser, projects: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Entreprise"
                value={newUser.company}
                onChange={e => setNewUser({ ...newUser, company: e.target.value })}
                className="w-full p-2 border rounded"
              />
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
              >
                {editingUser ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
