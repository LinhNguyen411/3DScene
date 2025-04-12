import { useState, useEffect } from 'react';
import { Check, X, Package, Shield, MessageSquare, Bell, BarChart3 } from 'lucide-react';
import DataService from './SubscriptionServices';
import { loadStripe } from '@stripe/stripe-js';
import myAppConfig from '../../config'
import { useSnackbar } from '../../provider/SnackbarProvider';
function Subscription(props){
    const { showSnackbar } = useSnackbar();
    
    const stripePromise = loadStripe(myAppConfig.stripe.STRIPE_PUBLIC_KEY);

    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
  
    // useEffect(() => {
    //     const url = new URL(window.location.href);
    // }, []);

    const handleSubscribe = async (plan, priceId) => {
        setLoading(true);
        setSelectedPlan(plan);
        console.log(priceId)
        try{
            const stripe = await stripePromise;
            const response = await DataService.createCheckoutSession(priceId)

            stripe.redirectToCheckout({
                sessionId: response.sessionId
            });
        }catch(error){
            setLoading(false);
            setSelectedPlan(null);

            showSnackbar('Failed to create checkout session', 'error')
        }
    };


    const plans = [
        {
        priceId: 'price_1RCdEMIpv2OeX57hkx16Fs0g',
        name: 'Monthly Plan',
        price: 5,
        period: 'month',
        features: [
            { icon: <Package size={20} />, text: 'Basic features access' },
            { icon: <Package size={20} />, text: '5 projects per month' },
            { icon: <MessageSquare size={20} />, text: 'Community support' },
            { icon: <Bell size={20} />, text: 'Weekly updates' }
        ]
        },
        {
        priceId: 'price_1RCdFSIpv2OeX57h2JIVsxpv',
        name: 'Yearly Plan',
        price: 40,
        period: 'year',
        features: [
            { icon: <Package size={20} />, text: 'All Basic features' },
            { icon: <Package size={20} />, text: 'Unlimited projects' },
            { icon: <Shield size={20} />, text: 'Priority support' },
            { icon: <Bell size={20} />, text: 'Daily updates' },
            { icon: <BarChart3 size={20} />, text: 'Advanced analytics' }
        ]
        }
    ];

    return (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 flex-1 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
                <p className="text-gray-600 text-lg">Simple pricing for everyone</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
                {plans.map((plan, index) => (
                <div key={index} className="flex flex-col bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
                    <div className="flex items-end mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-500 ml-1">/{plan.period}</span>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center">
                        <Check className="text-green-500 mr-2" size={20} />
                        <span>{feature.text}</span>
                        </div>
                    ))}
                    </div>
                    
                    <button
                    onClick={() => handleSubscribe(plan.name.toLowerCase().replace(' ', '-'), plan.priceId)}
                    disabled={loading}
                    className={`mt-auto w-full py-3 bg-sky-400 hover:bg-sky-500 text-white font-medium rounded-md transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                    {loading && selectedPlan === plan.name.toLowerCase().replace(' ', '-') ? 'Processing...' : 'Subscribe Now'}
                    </button>
                </div>
                ))}
            </div>
            </div>
        </div>
    );
}

export default Subscription;