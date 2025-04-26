import { useState } from 'react';
import {  Shield, MessageSquare, ChartLine, Video, Box, Download, Lock, Settings,ImageUp,Component } from 'lucide-react';
import DataService from './SubscriptionServices';
import { loadStripe } from '@stripe/stripe-js';
import { useSnackbar } from '../../provider/SnackbarProvider';
import { useOutletContext } from 'react-router-dom';

function Subscription() {
    const { showSnackbar } = useSnackbar();
    const {user, stripeMonthlyId, stripePublicKey, stripeYearlyId } = useOutletContext();
    const stripePromise = loadStripe(stripePublicKey);

    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
  
    const handleSubscribe = async (plan, priceId) => {
        if (plan === 'free-membership') {
            showSnackbar('Free membership activated!', 'success');
            return;
        }
        
        setLoading(true);
        setSelectedPlan(plan);
        
        try {
            const stripe = await stripePromise;
            const response = await DataService.createCheckoutSession(priceId);

            stripe.redirectToCheckout({
                sessionId: response.sessionId
            });
        } catch (error) {
            setLoading(false);
            setSelectedPlan(null);
            showSnackbar('Failed to create checkout session', 'error');
        }
    };
    const originalPrice = 129;
    const discountedPrice = 15 * 12;
    const discountPercent = ((discountedPrice- originalPrice) / (discountedPrice)) * 100;

    const plans = [
        {
            name: 'Free Membership',
            price: 0,
            period: 'forever',
            features: [
                { icon: <Video size={20} />, text: 'Up to 3 minutes/project' },
                { icon: <Component size={20} />, text: 'Create up to 3 models/week' },
                { icon: <Box size={20} />, text: 'Basic 3D model quality' },
                { icon: <Download size={20} />, text: 'Standard .splat export' },
                { icon: <Lock size={20} />, text: 'Limited texture resolution' }
            ],
            cta: 'Start Free'
        },
        {
            priceId: stripeMonthlyId,
            name: 'Monthly Membership',
            price: 15,
            period: 'month',
            features: [
                { icon: <Video size={20} />, text: 'Up to 5 minutes/project' },
                { icon: <Component size={20} />, text: 'Create unlimited model' },
                { icon: <ImageUp size={20} />, text: 'Enable image upload' },
                { icon: <Box size={20} />, text: 'High-quality 3D models' },
                { icon: <Download size={20} />, text: 'Multiple export formats' },
                { icon: <MessageSquare size={20} />, text: 'Priority email support' }
            ],
            cta: 'Subscribe Now'
        },
        {
            priceId: stripeYearlyId,
            name: 'Yearly Membership',
            price: 129,
            period: 'year',
            features: [
                { icon: <Video size={20} />, text: 'Up to 5 minutes/project' },
                { icon: <Component size={20} />, text: 'Create unlimited model' },
                { icon: <ImageUp size={20} />, text: 'Enable image upload' },
                { icon: <Box size={20} />, text: 'High-quality 3D models' },
                { icon: <Download size={20} />, text: 'Multiple export formats' },
                { icon: <MessageSquare size={20} />, text: 'Priority email support' }
            ],
            cta: 'Subscribe & Save ' + discountPercent.toFixed(0) + '%'
        }
    ];

    return (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 flex-1 flex flex-col items-center justify-center p-4">
            <div className="max-w-6xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold mb-2">Choose Your 3D Conversion Plan</h1>
                    <p className="text-gray-600 text-lg">Transform any video into stunning 3D models</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan, index) => (
                        <div key={index} className={`flex flex-col bg-white rounded-lg shadow-lg p-8 ${index === 2 ? 'border-2 border-purple-500 relative' : ''}`}>
                            {index === 2 && (
                                <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium">
                                    Best Value
                                </div>
                            )}
                            <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
                            <div className="flex items-end mb-6">
                                <span className="text-4xl font-bold">${plan.price}</span>
                                <span className="text-gray-500 ml-1">/{plan.period}</span>
                            </div>
                            
                            <div className="space-y-4 mb-8 flex-grow">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-center">
                                        <span className="text-blue-500 mr-2">{feature.icon}</span>
                                        <span>{feature.text}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <button
                                onClick={() => handleSubscribe(plan.name.toLowerCase().replace(' ', '-'), plan.priceId)}
                                disabled={loading && selectedPlan === plan.name.toLowerCase().replace(' ', '-')}
                                className={`mt-auto w-full py-3 ${
                                    index === 0 
                                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' 
                                        : index === 2 
                                            ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                } font-medium rounded-md transition-colors ${loading && selectedPlan === plan.name.toLowerCase().replace(' ', '-') ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading && selectedPlan === plan.name.toLowerCase().replace(' ', '-') ? 'Processing...' : plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
                
                <div className="text-center mt-8 text-gray-600">
                    <p>All plans include secure payment processing and our 30-day satisfaction guarantee</p>
                </div>
            </div>
        </div>
    );
}

export default Subscription;