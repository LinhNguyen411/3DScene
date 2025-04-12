import axios from 'axios';
import myAppConfig from "../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/api/v1/stripe/create-checkout-session";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

const createCheckoutSession = async (priceId) => {
    try {
        console.log(priceId)
        const response = await axios.post(
        API_BASE_URL,
        { priceId: priceId },
        {
            headers: getAuthHeaders(),
        }
        );
        return response.data;
    } catch (error) {
        throw new Error('Failed to create checkout session');
    }   
}

const DataService = {
    createCheckoutSession
};

export default DataService;