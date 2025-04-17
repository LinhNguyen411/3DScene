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

const DataService = {
  getModel,
};

export default DataService;