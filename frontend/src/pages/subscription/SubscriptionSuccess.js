import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RouterPath } from '../../assets/dictionary/RouterPath';

function SubscriptionSuccess(){

    return(
        <div className='flex justify-center align-center mt-14'>
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-green-500 rounded-full p-3">
                    <Check className="text-white" size={32} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold mb-4">Payment Successful!</h2>
                <p className="text-gray-600 mb-8">
                    Thank you for your subscription. You now have access to all the amazing features!
                    We've sent a confirmation email to your inbox.
                </p>
                <Link
                    to={RouterPath.DASHBOARD}
                    className="flex items-center justify-center mx-auto px-4 py-2 text-gray-600 font-medium"
                >
                    <span className="mr-1">←</span> Back to Dashboard
                </Link>
            </div>

        </div>
    )
}
export default SubscriptionSuccess;