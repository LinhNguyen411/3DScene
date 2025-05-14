import axios from 'axios';
import myAppConfig from '../../config';

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/splats";
const getAuthHeaders = (viewer) => {
  const tokenKey = viewer === 'admin' ? 'supertoken' : 'token';
  const token = localStorage.getItem(tokenKey);
  return {
    Authorization: `Bearer ${token}`,
  };
};

const getSplat = async (id, viewer) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`, {
        headers: getAuthHeaders(viewer),
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get splat');
    }
}

const downloadSplat = async (id, title,viewer) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}/download-splat`, {
      headers: getAuthHeaders(viewer),
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;

    // Use title and ensure it ends with .compressed.ply
    let filename = title?.trim() || 'downloaded_file';
    if (!filename.endsWith('.splat')) {
      filename += '.splat';
    }

    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);

    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error('Failed to download .splat');
  }
};

const downloadPLY = async (id, title,viewer) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}/download-ply`, {
      headers: getAuthHeaders(viewer),
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;

    // Use title and ensure it ends with .compressed.ply
    let filename = title?.trim() || 'downloaded_file';
    if (!filename.endsWith('.ply')) {
      filename += '.ply';
    }

    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);

    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error('Failed to download .ply');
  }
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
const getAuth = async (viewer) => {
  try { 
    const response = await axios.post(
      myAppConfig.api.ENDPOINT + "/login/get-my-info",
      {},
      {
        headers: getAuthHeaders(viewer),
      }
    );
    return response.data;
  } catch (error) {
    return null
  }
};

const getColmapData = async (id, viewer) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}/metadata`, {
        headers: getAuthHeaders(viewer),
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to colmap data');
    }
}

const downloadColmap = async (id, viewer) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}/download-colmap`, {
      headers: getAuthHeaders(viewer),
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;

    // Use meaningful filename for COLMAP files
    const filename = `colmap_files_${id}.zip`;

    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);

    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error('Failed to download COLMAP files');
  }
};

const DataService = {
  getAuth,
  getSplat,
  downloadSplat,
  downloadPLY,
  getModel,
  getColmapData,
  downloadColmap,
};



export default DataService;