import axios from 'axios';
import myAppConfig from "../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/api/v1";
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('supertoken')}`,
});

// Get the current user information
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

// Update the current user profile
const updateUserProfile = async (userData) => {
  try {
    // Map to match the UserUpdate schema expected by the API
    const formattedData = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      // We need to include these fields as they're required in UserUpdate
      is_active: true, // Assuming we don't want to deactivate the user
      is_superuser: userData.is_superuser || false, // Keep superuser status unchanged
    };
    const response = await axios.put(`${API_BASE_URL}/users/${userData.id}`, formattedData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to update user profile');
  }
};

// // Check if the user has Pro status
// const checkProStatus = async () => {
//   try {
//     const response = await axios.get(`${API_BASE_URL}/is-pro-user`, {
//       headers: getAuthHeaders(),
//     });
//     return response.data;
//   } catch (error) {
//     throw new Error('Failed to check pro status');
//   }
// };

// Change password
const changePassword = async (userData) => {
  try {
    // For password change, we need to include the password in the UserUpdate schema
    const formattedData = {
      password: userData.new_password,
      // We must include these fields as they're required in UserUpdate
      is_active: true,
      is_superuser: userData.is_superuser || false,
    };

    // We'll use the user's ID to update their record
    const userInfo = await getUserInfo();
    
    const response = await axios.put(`${API_BASE_URL}/users/${userInfo.id}`, formattedData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to update password');
  }
};

const SettingsService = {
  getUserInfo,
  updateUserProfile,
//   checkProStatus,
  changePassword
};

export default SettingsService;