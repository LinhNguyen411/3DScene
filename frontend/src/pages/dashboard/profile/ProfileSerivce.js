import axios from 'axios';
import myAppConfig from "../../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const getCurrentUser = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login/get-my-info`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch user information');
  }
};

const updateProfile = async (userData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/users/update-my-info`,
      userData,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to update profile');
  }
};

const changePassword = async (passwordData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/users/update-my-info`,
      passwordData,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to change password');
  }
};

const DataService = {
  getCurrentUser,
  updateProfile,
  changePassword
};

export default DataService;