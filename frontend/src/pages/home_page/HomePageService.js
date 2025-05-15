import axios from "axios";
import myAppConfig from "../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/splats";
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const getFeaturedGallery = async (page=1, size=6) => {
  try {
    const response = await axios.get(API_BASE_URL +"/gallery", {
      params: { page, size },
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch splats');
  }
};
const DataService = {
  getFeaturedGallery,
};

export default DataService;
