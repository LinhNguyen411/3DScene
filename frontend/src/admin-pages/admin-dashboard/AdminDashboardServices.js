import axios from 'axios';
import myAppConfig from "../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/api/v1";
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('supertoken')}`,
});

// Get total number of users
const getTotalUsers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/statistic/total-users`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching total users:', error);
    throw new Error('Failed to fetch total users');
  }
};

// Get total number of pro users
const getTotalProUsers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/statistic/total-pro-users`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching pro users:', error);
    throw new Error('Failed to fetch pro users');
  }
};

// Get total payment amount
const getTotalAmount = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/statistic/total-amount`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching total amount:', error);
    throw new Error('Failed to fetch total amount');
  }
};

// Get models (splats) generated in the last 24 hours
const getModelsLast24Hours = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/statistic/get-splats-last-24hours`, {
      headers: getAuthHeaders(),
    });
    
    // Return the response data directly
    // The API should return an array of Splat objects with date_created fields
    return response.data;
  } catch (error) {
    console.error('Error fetching models data:', error);
    throw new Error('Failed to fetch models data');
  }
};

// Get recent feedback
const getRecentFeedback = async (page = 1, size = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/feedbacks/`, {
      params: { page, size },
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw new Error('Failed to fetch feedback');
  }
};

const DashboardService = {
  getTotalUsers,
  getTotalProUsers,
  getTotalAmount,
  getModelsLast24Hours,
  getRecentFeedback,
};

export default DashboardService;