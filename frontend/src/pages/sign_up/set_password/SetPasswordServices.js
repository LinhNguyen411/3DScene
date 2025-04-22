import axios from "axios";
import myAppConfig from "../../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/api/v1/users/update-my-info";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });


  const postSetPassword = async (password) => {
    try {
      // For password change, we need to include the password in the UserUpdate schema
      const formattedData = {
        password: password,
        // We must include these fields as they're required in UserUpdate
      };
      
      const response = await axios.put(API_BASE_URL, formattedData, {
        headers: getAuthHeaders(),
      });
      return response;
    } catch (error) {
      throw new Error('Failed to set password');
    }
  };

const DataService = {
    postSetPassword,
};

export default DataService;
