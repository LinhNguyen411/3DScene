import { X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { RouterPath } from '../../assets/dictionary/RouterPath';
import { useState, useEffect } from 'react';
import DataService from './SubscriptionServices'; // Updated import path

function SubscriptionCancel() {
  const [cancelStatus, setCancelStatus] = useState({
    isProcessed: false,
    isSuccess: false
  });
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract parameters from URL query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('id');
    const isCancel = queryParams.get('cancel') === 'true';
    const status = queryParams.get('status');
    const orderCode = queryParams.get('orderCode');
    
    // Check if this is a cancellation request
    if (id && isCancel && status === 'CANCELLED') {
      handleCancelPayment(id, orderCode);
    }
  }, [location]);
  
  const handleCancelPayment = async (id, orderCode) => {
    if (!id) return;
    
    setCancelStatus({
      isProcessed: false,
      isSuccess: false
    });
    
    try {
      // Using the 'id' parameter for the cancellation
      await DataService.cancelPayment(orderCode);
      console.log(`Payment with ID ${id} and order code ${orderCode} cancelled successfully`);
      setCancelStatus({
        isProcessed: true,
        isSuccess: true
      });
      // Payment cancellation successful
    } catch (err) {
      console.error('Cancel payment error:', err);
      setCancelStatus({
        isProcessed: true,
        isSuccess: false
      });
    }
  };
  
  const handleContactSupport = () => {
    // Navigate to support page or open support chat
    navigate(RouterPath.SUPPORT || '/support');
  };

  return (
    <div className="flex justify-center items-center mt-14">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-500 rounded-full p-3">
            <X className="text-white" size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-4">Payment Cancelled</h2>
        
        {!cancelStatus.isSuccess && cancelStatus.isProcessed && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Failed to cancel payment. Please try again or contact support.
          </div>
        )}
        
        <p className="text-gray-600 mb-8">
          No worries! You can try again whenever you're ready. If you have any questions, feel free to contact our support team.
        </p>
        
        <Link
          to={RouterPath.SUBSCRIPTION}
          className="flex justify-center w-full py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors mb-4"
          disabled={!cancelStatus.isProcessed}
        >
          {!cancelStatus.isProcessed ? 'Processing...' : 'Try Again'}
        </Link>
        
        <button
          className="w-full py-3 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
          onClick={handleContactSupport}
          disabled={!cancelStatus.isProcessed}
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}

export default SubscriptionCancel;