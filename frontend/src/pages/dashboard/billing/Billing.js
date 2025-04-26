import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, Clock, AlertCircle } from 'lucide-react';
import DataService from './BillingServices';
import { useSnackbar } from '../../../provider/SnackbarProvider';
import { Link } from 'react-router-dom';
import { RouterPath } from '../../../assets/dictionary/RouterPath';

function Billing() {
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [lastSubscription, setLastSubscription] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [subscriptions, setSubscriptions] = useState(null);

  
  // Format date strings to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${Number(amount).toFixed(2)}`;
  };
  
  // Calculate days remaining until expiration
  const calculateDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 0;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const data = await DataService.getSubscriptions();
      console.log(data)
      setSubscriptions(data.items);
      setLastSubscription(data.items[0]);
      if (data.items[0] && data.items[0].expired_at) {
        setDaysRemaining(calculateDaysRemaining(data.items[0].expired_at));
      }
    } catch (error) {
      showSnackbar('Failed to load lastSubscription data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const getStatusColor = () => {
    if (!lastSubscription) return 'bg-gray-500';
    if (lastSubscription.payment_plan === 'Lifetime Membership') return 'bg-green-500';
    if (daysRemaining < 5) return 'bg-red-500';
    if (daysRemaining < 15) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPlanTypeIcon = () => {
    if (!lastSubscription) return null;
    
    switch(lastSubscription.payment_plan) {
      case 'Monthly Membership':
        return <Calendar className="text-sky-500" />;
      case 'Yearly Membership':
        return <Calendar className="text-sky-500" />;
      case 'Lifetime Membership':
        return <CreditCard className="text-sky-500" />;
      default:
        return <CreditCard className="text-sky-500" />;
    }
  };

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        </div>
      ) : !lastSubscription ? (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-500">No Subscription</h3>
            <p className="text-gray-500 mt-2">You don't have any subscription plan</p>
            <Link 
              to={RouterPath.SUBSCRIPTION}
              className="mt-6 bg-sky-500 hover:bg-sky-600 text-white rounded-md px-4 py-2 flex items-center"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Upgrade to Pro
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Subscription Overview Card */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">Current Subscription</h2>
              <span className={`px-3 py-1 rounded-full text-white text-xs ${getStatusColor()}`}>
                {daysRemaining > 0 || lastSubscription.payment_plan === 'Lifetime Membership'? 'Active' : 'Expired'}
              </span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-4">
                  {getPlanTypeIcon()}
                  <div className="ml-3">
                    <h3 className="font-medium capitalize">{lastSubscription.payment_plan || 'Standard'}</h3>
                    <p className="text-sm text-gray-500">
                      {lastSubscription.payment_plan === 'Lifetime Membership' ? 'Never Expires' : `Renews ${formatDate(lastSubscription.expired_at)}`}
                    </p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Amount</div>
                  <div className="font-medium text-lg">{formatCurrency(lastSubscription.amount)}</div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Billing Cycle</div>
                  <div className="font-medium capitalize">
                    {lastSubscription.payment_plan === 'Lifetime Membership' ? 'One-time Payment' : lastSubscription.payment_plan}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 md:border-t-0 md:border-l md:pl-6 md:pt-0">
                <div className="text-sm text-gray-500 mb-2">Time Remaining</div>
                
                {lastSubscription.payment_plan === 'Lifetime Membership' ? (
                  <div className="flex items-center">
                    <CreditCard className="h-10 w-10 text-sky-500 mr-3" />
                    <div>
                      <div className="font-medium text-lg">Lifetime Access</div>
                      <p className="text-sm text-gray-500">Never expires</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center mb-2">
                      <Clock className="h-10 w-10 text-sky-500 mr-3" />
                      <div>
                        <div className="font-medium text-lg">{daysRemaining} days remaining</div>
                        <p className="text-sm text-gray-500">Expires on {formatDate(lastSubscription.expired_at)}</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                      <div 
                        className={`h-2.5 rounded-full ${getStatusColor()}`} 
                        style={{ width: `${Math.min(100, daysRemaining)}%` }}
                      ></div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Upgrade/Manage Buttons */}
          {/* <div className="flex flex-wrap gap-4 mb-6">
            <button className="bg-sky-500 hover:bg-sky-600 text-white rounded-md px-4 py-2 flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Manage Subscription
            </button>
            
            {lastSubscription.payment_plan !== 'Lifetime Membership' && (
              <button className="bg-white border border-sky-500 text-sky-500 hover:bg-sky-50 rounded-md px-4 py-2 flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Upgrade Plan
              </button>
            )}
          </div> */}
          
          {/* Payment History */}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium">Payment History</h2>
            </div>
            
            <div className="divide-y">
              {subscriptions.map(subscription =>(

                <div className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{subscription.payment_plan}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(subscription.created_at)}
                    </div>
                  </div>
                  <div className="font-medium">{formatCurrency(subscription.amount)}</div>
                </div>
              
              ))}
              
              {/* Example of previous payment - you would map through payment history here */}
              <div className="px-6 py-4 flex justify-between items-center text-gray-500">
                <div>
                  <div className="font-medium">No previous payments</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Billing;