import axios from 'axios';
import myAppConfig from '../../config';

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/api/v1/splats/";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  const getModel = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}/download`, {
        headers: getAuthHeaders(),
        responseType: 'blob',
      });
  
      return response
    } catch (error) {
      console.error('get model failed:', error);
      alert('Failed to get model');
    }
  };

const DataService = {
    getModel,

};

export default DataService;