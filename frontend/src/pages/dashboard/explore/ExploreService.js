import axios from "axios";
import myAppConfig from "../../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/api/v1/splats";
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const getFeaturedExplore = async (page=1, size=6) => {
  try {
    const response = await axios.get(API_BASE_URL +"/public", {
      params: { page, size },
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch splats');
  }
};
const DataService = {
  getFeaturedExplore,
};

export default DataService;
