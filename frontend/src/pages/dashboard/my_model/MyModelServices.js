import axios from 'axios';
import myAppConfig from "../../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/api/v1/splats/";
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
    const formData = new FormData();
    formData.append('title', title);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/${id}`,
        formData,
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

const DataService = {
    updateSplat,
    deleteSplat,
    getSplats,
};

export default DataService;