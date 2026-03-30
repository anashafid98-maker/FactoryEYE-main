import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { api } from '../api/lib/supabase';

interface DiagramManagerProps {
  equipmentId: string;
  equipmentName: string;
  currentDiagram?: string;
  onClose: () => void;
  onDiagramUpdated: () => void;
}

const DiagramManager: React.FC<DiagramManagerProps> = ({
  equipmentId,
  equipmentName,
  currentDiagram,
  onClose,
  onDiagramUpdated,
}) => {
  const [imageUrl, setImageUrl] = useState(currentDiagram || '');
  const [previewUrl, setPreviewUrl] = useState(currentDiagram || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    setPreviewUrl(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImageUrl(dataUrl);
        setPreviewUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await api.updateEquipment(equipmentId, { diagram_url: imageUrl });
      onDiagramUpdated();
      onClose();
    } catch (error) {
      console.error('Error saving diagram:', error);
      alert('Erreur lors de la mise à jour du schéma');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ImageIcon className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">Gérer le Schéma</h2>
              <p className="text-sm text-blue-100">{equipmentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              URL de l'image
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              placeholder="https://exemple.com/schema.png"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Entrez l'URL d'une image hébergée en ligne
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-sm text-gray-500 font-medium">OU</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Télécharger une image locale
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  Cliquez pour télécharger
                </p>
                <p className="text-xs text-gray-500">PNG, JPG ou GIF</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {previewUrl && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Aperçu
              </label>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <img
                  src={previewUrl}
                  alt="Aperçu du schéma"
                  className="w-full h-auto rounded shadow-lg"
                  onError={() => {
                    setPreviewUrl('');
                    alert('Impossible de charger l\'image. Vérifiez l\'URL.');
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!imageUrl || isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagramManager;
