import axios from 'axios';
import myAppConfig from "../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/api/v1/splats";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('supertoken')}`,
  });

const uploadSplat = async (formData) => {
    try {
      const response = await axios.post(API_BASE_URL + "/model-upload", formData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create splat');
    }
  }


const getSplats = async (page = 1, size = 10) => {
    try {
      const response = await axios.get(API_BASE_URL, {
        params: { page, size },
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch splats');
    }
}
const updateSplat=  async (id, formData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/${id}`,
        formData,
        {
          headers: getAuthHeaders(),
        }
      );
      return response;
    } catch (error) {
      throw new Error('Failed to update splat');
    }
}

  // Delete a splat
const deleteSplat = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete splat');
    }
}
const downloadSplat = async (id, title) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}/download-ply`, {
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
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    return false;
  }
};

const DataService = {
    uploadSplat,
    updateSplat,
    deleteSplat,
    getSplats,
    downloadSplat,
};

export default DataService;