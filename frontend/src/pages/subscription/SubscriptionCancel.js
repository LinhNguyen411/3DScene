import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RouterPath } from '../../assets/dictionary/RouterPath';

function SubscriptionCancel(){
    return (
        <div className='flex justify-center align-center mt-14'>
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <div className="flex justify-center mb-4">
                    <div className="bg-red-500 rounded-full p-3">
                    <X className="text-white" size={32} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold mb-4">Payment Cancelled</h2>
                <p className="text-gray-600 mb-8">
                    No worries! You can try again whenever you're ready.
                    If you have any questions, feel free to contact our support team.
                </p>
                <Link
                    to={RouterPath.SUBSCRIPTION}
                    className="flex justify-center w-full py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors mb-4"
                >
                    Try Again
                </Link>
                <button
                    className="w-full py-3 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
                >
                    Contact Support
                </button>
            </div>

        </div>
    )
}

export default SubscriptionCancel;