import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, Lock } from 'lucide-react';

interface LoginResponse {
  id: number;
  username: string;
  role: string;
}

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://10.190.50.107:8889/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la connexion');
      }

      const data: LoginResponse = await response.json();

      // Mise à jour synchrone du stockage local
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', data.id.toString());
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', data.role);

      // Redirection immédiate avec remplacement de l'historique
      if (data.role === 'ADMIN') {
        navigate('/overview', { replace: true });
      } else {
        navigate('/user-dashboard', { replace: true });
      }

    } catch (err) {
      localStorage.clear();
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('https://www.actemium.in/app/uploads/sites/339/2023/08/featured-image-actemium-2.png')" }}>
      <div className="bg-white p-8 rounded-lg shadow-md w-96 backdrop-blur-sm bg-opacity-90">
        <div className="flex items-center justify-center mb-6">
          <Factory className="w-10 h-10 text-blue-500" />
          <h1 className="text-2xl font-bold ml-2">
            <span className="text-blue-500">Factory</span>
            <span className="text-green-500">EYE</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom d'utilisateur</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 p-2"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 p-2"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center animate-shake">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connexion...
              </div>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Se connecter
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;