import axios from 'axios';
import myAppConfig from "../../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/api/v1/splats";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });


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
const updateSplat=  async (id, title) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/${id}`,
        {title: title},
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data;
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
  } catch (error) {
    console.error('Download failed:', error);
    alert('Failed to download file');
  }
};


const DataService = {
    updateSplat,
    deleteSplat,
    getSplats,
    downloadSplat,
};

export default DataService;