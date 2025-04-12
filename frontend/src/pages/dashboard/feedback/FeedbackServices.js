import axios from 'axios';
import myAppConfig from "../../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/api/v1/feedbacks/";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

const createFeedback = async (data) => {
    try {
        const response = await axios.post(
        API_BASE_URL,
        data,
        {
            headers: getAuthHeaders(),
        }
        );
        return response.data;
    } catch (error) {
        console.log(error)
        throw new Error('Failed to send feedback');
    }   
}

const DataService = {
    createFeedback
};

export default DataService;