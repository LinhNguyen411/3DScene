import axios from 'axios';
import myAppConfig from "../../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/api/v1/splats/";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

const createSplat = async (title, file, num_iterations = 5000) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('num_iterations', num_iterations);
    try {
        const response = await axios.post(
        API_BASE_URL,
        formData,
        {
            headers: getAuthHeaders(),
        }
        );
        return response.data;
    } catch (error) {
        throw new Error('Failed to create splat');
    }   
}

const DataService = {
    createSplat
};

export default DataService;