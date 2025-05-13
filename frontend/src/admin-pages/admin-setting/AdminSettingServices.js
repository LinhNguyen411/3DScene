import axios from 'axios';
import myAppConfig from "../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/admin";
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('supertoken')}`,
});

const getUserInfo = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login/get-my-info`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch user information');
  }
};

const updateUserProfile = async (userData) => {
  try {
    const formattedData = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      is_active: true,
      is_superuser: userData.is_superuser || false,
    };
    const response = await axios.put(`${API_BASE_URL}/users/${userData.id}`, formattedData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to update user profile');
  }
};

const changePassword = async (userData) => {
  try {
    const formattedData = {
      password: userData.new_password,
      is_active: true,
      is_superuser: userData.is_superuser || false,
    };
    const userInfo = await getUserInfo();
    const response = await axios.put(`${API_BASE_URL}/users/${userInfo.id}`, formattedData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to update password');
  }
};

const getEnvironmentVariables = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/config/env`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch environment variables');
  }
};

const updateEnvironmentVariable = async (key, value) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/config/env`,
      { key, value },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to update environment variable');
  }
};

const reloadEnvironmentVariables = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/config/env/reload`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to reload environment variables');
  }
};

const createEnvBackup = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/config/create-env-backup`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to create environment backup');
  }
};

const uploadProjectIcon = async (formData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/config/upload-icon`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to upload project icon');
  }
};

const SettingsService = {
  getUserInfo,
  updateUserProfile,
  changePassword,
  getEnvironmentVariables,
  updateEnvironmentVariable,
  reloadEnvironmentVariables,
  createEnvBackup,
  uploadProjectIcon
};

export default SettingsService;