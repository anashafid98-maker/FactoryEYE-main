import axios from 'axios';

// Correction 1: URL propre sans double http:// et avec le bon format de port
const API_URL = 'http://10.190.50.127:8889/api/compresseur';

// Création d'une instance axios configurée une fois pour toutes
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const uploadCompressorData = async (file) => {
  const formData = new FormData();
  formData.append('compressorFullData', file);

  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error.response?.data || error.message);
    throw error;
  }
};

export const getCompressorData = async () => {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    console.error('Error fetching compressor data:', error.response?.data || error.message);
    throw error;
  }
};