import axios from 'axios';
import myAppConfig from "../../config";

const API_BASE_URL = myAppConfig.api.ENDPOINT + "/api/v1/payments/";
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('supertoken')}`,
});

const getPayments = async (page = 1, size = 10) => {
  try {
    const response = await axios.get(API_BASE_URL, {
      params: { page, size },
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch payments');
  }
};

const getPayment = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch payment details');
  }
};

const createPayment = async (userId, paymentData) => {
  try {
    const response = await axios.post(
      API_BASE_URL,
      paymentData,
      {
        params: { user_id: userId },
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to create payment');
  }
};

const updatePayment = async (id, paymentData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/${id}`,
      paymentData,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to update payment');
  }
};

const deletePayment = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to delete payment');
  }
};

// Get payments grouped by day for the chart
const getPaymentsByDay = async (days = 7) => {
    try {
      // Fetch a larger number of payments to process on client side
      const response = await axios.get(`${API_BASE_URL}`, {
        params: { 
          page: 1,
          size: 100 // Use a reasonable number that won't overload the API
        },
        headers: getAuthHeaders(),
      });
      
      // Default empty response structure
      const result = {
        labels: [],
        amounts: []
      };
      
      // Safety check for response data
      if (!response.data || !response.data.items || !Array.isArray(response.data.items)) {
        console.warn('Invalid or empty payment data received');
        return result;
      }
      
      const payments = response.data.items;
      const now = new Date();
      
      // Process data based on selected period
      if (days === 'all') {
        // Total view - Group by month
        const monthData = {};
        
        payments.forEach(payment => {
          if (!payment.created_at) return;
          
          try {
            const paymentDate = new Date(payment.created_at);
            const monthYear = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthData[monthYear]) {
              monthData[monthYear] = 0;
            }
            
            monthData[monthYear] += Number(payment.amount) || 0;
          } catch (e) {
            console.error('Error processing payment:', e);
          }
        });
        
        // Convert to arrays for chart
        const sortedMonths = Object.keys(monthData).sort();
        
        sortedMonths.forEach(month => {
          const [year, monthNum] = month.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const formattedMonth = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
          
          result.labels.push(formattedMonth);
          result.amounts.push(monthData[month]);
        });
        
        // If no data, provide a default empty state
        if (result.labels.length === 0) {
          result.labels = ['No Data'];
          result.amounts = [0];
        }
        
      } else {
        // Day-based views (week, month, year)
        const dayCount = parseInt(days) || 7;
        const dateFormat = dayCount > 31 ? { month: 'short', year: 'numeric' } : { month: 'short', day: 'numeric' };
        const dateMap = {};
        
        // Create date range
        for (let i = dayCount - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const formattedDate = date.toLocaleDateString('en-US', dateFormat);
          
          result.labels.push(formattedDate);
          result.amounts.push(0);
          
          // Store date lookup for faster matching
          const dateKey = date.toISOString().split('T')[0];
          dateMap[dateKey] = result.labels.length - 1;
        }
        
        // Group payments by day
        payments.forEach(payment => {
          if (!payment.created_at) return;
          
          try {
            const paymentDate = new Date(payment.created_at);
            const paymentDateKey = paymentDate.toISOString().split('T')[0];
            
            // Check if payment falls within our date range using the lookup map
            if (dateMap[paymentDateKey] !== undefined) {
              const index = dateMap[paymentDateKey];
              result.amounts[index] += Number(payment.amount) || 0;
            } else {
              // For month/year views, we need to check by formatted date
              const formattedPaymentDate = paymentDate.toLocaleDateString('en-US', dateFormat);
              const index = result.labels.indexOf(formattedPaymentDate);
              
              if (index !== -1) {
                result.amounts[index] += Number(payment.amount) || 0;
              }
            }
          } catch (e) {
            console.error('Error processing payment date:', e);
          }
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('Chart data error:', error);
      // Return empty data structure on error
      return {
        labels: ['Error'],
        amounts: [0]
      };
    }
  };

const PaymentService = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByDay,
};

export default PaymentService;