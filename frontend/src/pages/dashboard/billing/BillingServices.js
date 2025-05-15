import axios from 'axios';
import myAppConfig from "../../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/payments";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const getSubscriptions = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch subscription information');
  }
};


const upgradeSubscription = async (planType) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/upgrade`,
      { plan_type: planType },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to upgrade subscription');
  }
};

const cancelSubscription = async () => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/cancel`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to cancel subscription');
  }
};

const DataService = {
  getSubscriptions,
  upgradeSubscription,
  cancelSubscription
};

export default DataService;