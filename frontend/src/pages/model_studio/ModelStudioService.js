import axios from 'axios';
import myAppConfig from '../../config';

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/models";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

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

const updateModel = async (id, data) => {
    try {
      console.log(data)
        const response = await axios.put(`${API_BASE_URL}/${id}`, data, {
            headers: getAuthHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error('Failed to update model:', error);
        throw new Error('Failed to update model');
    }
}

const downloadSplat = async (id, title) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}/file/splat`, {
      headers: getAuthHeaders(),
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

const downloadPLY = async (id, title) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}/file/ply`, {
      headers: getAuthHeaders(),
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

const getModel = async (id) => {
  try {

    const response = await axios.get(`${API_BASE_URL}/${id}/file/splat`, {
      headers: getAuthHeaders(),
      responseType: 'blob',
    });
    
    return response;
  } catch (error) {
    console.error('get model failed:', error);
    alert('Failed to get model');
  }
};
const getAuth = async () => {
  try { 
    const response = await axios.post(
      myAppConfig.api.ENDPOINT + "/login/get-my-info",
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    return null
  }
};

const getColmapData = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}/colmap/json`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to colmap data');
    }
}

const downloadColmap = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}/colmap/zip`, {
      headers: getAuthHeaders(),
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
const getProjectInfo = async () =>{
  try {
    const response = await axios.get(myAppConfig.api.ENDPOINT + "/public/project-info");
    return response.data;
  } catch (error) {
    throw new Error('Failed to get project info');
  }
}

const DataService = {
  getAuth,
  getSplat,
  downloadSplat,
  downloadPLY,
  getModel,
  getColmapData,
  downloadColmap,
  getProjectInfo,
  updateModel,
};



export default DataService;