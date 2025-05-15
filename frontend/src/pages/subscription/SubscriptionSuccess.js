import { Check } from 'lucide-react';
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { RouterPath } from '../../assets/dictionary/RouterPath';
import { useState, useEffect } from 'react';
import DataService from './SubscriptionServices';

function SubscriptionSuccess(){
    const [confirmStatus, setConfirmStatus] = useState({
        isProcessed: false,
        isSuccess: false
    });
    const location = useLocation();
    const navigate = useNavigate();
    const {fetchAuthData } = useOutletContext();

    // Extract parameters from URL query parameters
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('id');
        const isCancel = queryParams.get('cancel') === 'true';
        const status = queryParams.get('status');
        const orderCode = queryParams.get('orderCode');
        
        // Check if this is a successful payment
        if (id && !isCancel && status === 'PAID') {
            handleConfirmPayment(id, orderCode);
        }
    }, [location]);

    const handleConfirmPayment = async (id, orderCode) => {
        if (!id) return;
        
        setConfirmStatus({
            isProcessed: false,
            isSuccess: false
        });
        
        try {
            // Using the 'id' parameter for the payment confirmation
            await DataService.confirmPayment(orderCode);
            console.log(`Payment with ID ${id} and order code ${orderCode} confirmed successfully`);
            setConfirmStatus({
                isProcessed: true,
                isSuccess: true
            });
            fetchAuthData(); // Refresh auth data to reflect the new subscription status
            // Payment confirmation successful
        } catch (err) {
            console.error('Confirm payment error:', err);
            setConfirmStatus({
                isProcessed: true,
                isSuccess: false
            });
        }
    };

    const handleDashboardRedirect = () => {
        navigate(RouterPath.DASHBOARD);
    };

    return(
        <div className='flex justify-center items-center mt-14'>
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-green-500 rounded-full p-3">
                        <Check className="text-white" size={32} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold mb-4">Payment Successful!</h2>
                
                {!confirmStatus.isSuccess && confirmStatus.isProcessed && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        There was an issue confirming your payment. Please contact support.
                    </div>
                )}
                
                {confirmStatus.isSuccess && confirmStatus.isProcessed && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        Your subscription has been activated successfully!
                    </div>
                )}
                
                <p className="text-gray-600 mb-8">
                    Thank you for your subscription. You now have access to all the amazing features!
                    We've sent a confirmation email to your inbox.
                </p>
                
                {!confirmStatus.isProcessed ? (
                    <div className="flex items-center justify-center mx-auto px-4 py-2 text-gray-600 font-medium">
                        <span className="mr-2">Processing your payment</span>
                        <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : (
                    <Link
                        to={RouterPath.DASHBOARD}
                        className="flex items-center justify-center mx-auto px-4 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                    >
                        <span className="mr-1">←</span> Back to Dashboard
                    </Link>
                )}
            </div>
        </div>
    );
}

export default SubscriptionSuccess;