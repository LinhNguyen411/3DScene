import axios from 'axios';
import myAppConfig from '../../config';

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/api/v1/splats";

const getAuthHeaders = (viewer) => {
  const tokenKey = viewer === 'admin' ? 'supertoken' : viewer === 'user' ? 'token' : null;
  console.log(tokenKey)
  const token = localStorage.getItem(tokenKey);
  
  return {
    Authorization: `Bearer ${token}`,
  };
};

const getModel = async (id, viewer) => {
  try {

    const response = await axios.get(`${API_BASE_URL}/${id}/download-splat`, {
      headers: getAuthHeaders(viewer),
      responseType: 'blob',
    });
    
    return response;
  } catch (error) {
    console.error('get model failed:', error);
    alert('Failed to get model');
  }
};

const downloadSplat = async (id, title) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}/download-compressed-ply`, {
      headers: getAuthHeaders(),
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;

    // Use title and ensure it ends with .compressed.ply
    let filename = title?.trim() || 'downloaded_file';
    if (!filename.endsWith('.compressed.ply')) {
      filename += '.compressed.ply';
    }

    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);

    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    return false;
  }
};

const getSplat = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to get splat');
  }
}

const DataService = {
  getModel,
  downloadSplat,
  getSplat,
};



export default DataService;