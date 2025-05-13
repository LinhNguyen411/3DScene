import axios from 'axios';
import myAppConfig from "../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/users";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('supertoken')}`,
  });


const getUsers = async (page = 1, size = 10) => {
    try {
      const response = await axios.get(API_BASE_URL, {
        params: { page, size },
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch users');
    }
}
const updateUser=  async (id, item) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/${id}`,
        item,
        {
          headers: getAuthHeaders(),
        }
      );
      return response;
    } catch (error) {
      throw new Error('Failed to update user');
    }
}

  // Delete a user
const deleteUser = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${id}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete user');
    }
}

const createUser = async (userData) => {
    try {
      const response = await axios.post(API_BASE_URL, userData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to create user');
    }
  }

const DataService = {
    updateUser,
    deleteUser,
    getUsers,
    createUser
};

export default DataService;