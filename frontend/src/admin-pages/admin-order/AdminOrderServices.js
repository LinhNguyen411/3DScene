import axios from 'axios';
import myAppConfig from "../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/orders";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('supertoken')}`,
  });


const getOrders = async (page = 1, size = 10) => {
    try {
      const response = await axios.get(API_BASE_URL, {
        params: { page, size },
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch orders');
    }
}
// const updateOrder=  async (id, formData) => {
//     try {
//       const response = await axios.put(
//         `${API_BASE_URL}/${id}`,
//         formData,
//         {
//           headers: getAuthHeaders(),
//         }
//       );
//       return response;
//     } catch (error) {
//       throw new Error('Failed to update Order');
//     }
// }

//   // Delete a Order
// const deleteOrder = async (id) => {
//     try {
//       const response = await axios.delete(`${API_BASE_URL}/${id}`, {
//         headers: getAuthHeaders(),
//       });
//       return response.data;
//     } catch (error) {
//       throw new Error('Failed to delete Order');
//     }
// }


const DataService = {
    getOrders,
};

export default DataService;