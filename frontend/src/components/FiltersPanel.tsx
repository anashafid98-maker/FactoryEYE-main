import React from 'react';
import { RefreshCw } from 'lucide-react';

const FiltersPanel: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
          <select className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option>All</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Grandeur</label>
          <select className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option>All</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
          <input
            type="date"
            defaultValue="2025-01-19"
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
          <input
            type="date"
            defaultValue="2025-02-19"
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="flex items-end space-x-4 flex-1">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Rechercher</label>
            <input
              type="text"
              placeholder="🔍"
              className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Afficher</label>
            <select className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>10 éléments</option>
              <option>25 éléments</option>
              <option>50 éléments</option>
            </select>
          </div>
        </div>

        <button className="ml-4 px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 flex items-center space-x-1">
          <RefreshCw className="w-3 h-3" />
          <span>Rafraîchir</span>
        </button>
      </div>
    </div>
  );
};

export default FiltersPanel;
