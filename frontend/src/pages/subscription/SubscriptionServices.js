import axios from 'axios';
import myAppConfig from "../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/payos";
const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

const createCheckoutSession = async (price) => {
    try {
        const response = await axios.post(
        API_BASE_URL + "/create-checkout-session",
        { price: price },
        {
            headers: getAuthHeaders(),
        }
        );
        return response.data;
    } catch (error) {
        throw new Error('Failed to create checkout session');
    }   
}
const cancelPayment = async (orderCode) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/cancel-payment`,
            { order_code: orderCode },
            {
                headers: getAuthHeaders(),
            }
        );
        return response.data;
    } catch (error) {
        throw new Error('Failed to cancel payment');
    }
}

const confirmPayment = async (orderCode) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/confirm-payment`,
            { order_code: orderCode },
            {
                headers: getAuthHeaders(),
            }
        );
        return response.data;
    } catch (error) {
        throw new Error('Failed to confirm payment');
    }
}

const DataService = {
    createCheckoutSession,
    cancelPayment,
    confirmPayment,
};

export default DataService;