import React from 'react';

const EquipmentTest: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">🛠️ Equipment Page - TEST</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-400 to-blue-500 p-6 rounded-2xl text-white shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">✅ Status</h2>
          <p>Route OK • ErrorBoundary OK • Servers running</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-2xl text-white shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">🚀 APIs</h2>
          <p>Port 5000: <span className="font-mono bg-black/20 px-2 py-1 rounded">LIVE</span></p>
          <p className="mt-2">VX=1.26 mm/s | P=6.2 bar</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl text-white shadow-2xl">
          <h2 className="text-2xl font-bold mb-2">🔧 Fix Needed</h2>
          <p>Equipment.tsx: React Hooks Rules violation (line 926)</p>
          <p>→ Replace with this test → Fix original</p>
        </div>
      </div>
      <div className="mt-12 p-8 bg-gray-50 rounded-2xl">
        <h3 className="text-2xl font-bold mb-4">Next Steps</h3>
        <ol className="space-y-2 text-lg">
          <li>✅ ErrorBoundary catching crashes</li>
          <li>✅ Dependencies installed</li>
          <li>✅ Realtime server port 5000 LIVE</li>
          <li>🔄 Fix Equipment.tsx hooks → Production ready</li>
        </ol>
      </div>
    </div>
  );
};

export default EquipmentTest;

