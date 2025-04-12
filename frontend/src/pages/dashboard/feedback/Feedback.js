import React, { useState } from 'react';
import DataService from './FeedbackServices';
import {CheckCircle } from 'lucide-react';
import { useSnackbar } from '../../../provider/SnackbarProvider';

function Feedback(props){
    const { showSnackbar } = useSnackbar();
    
    const [email, setEmail] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
          newErrors.email = 'Email is invalid';
        }
        
        if (!suggestion.trim()) {
          newErrors.suggestion = 'Feedback is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
          return;
        }
        
        setIsSubmitting(true);

        const data = {
            comment: suggestion,
            email_contact: email
        }

        console.log(data)
        try{
            
            const response = await DataService.createFeedback(data);
            setIsSubmitting(false);
            setIsSubmitted(true);
            setEmail('');
            setSuggestion('');
            showSnackbar('Feedback sent successfully', 'success')
        }catch (error) {
            setIsSubmitted(false);
            setIsSubmitting(false)
            showSnackbar('Failed to send feedback', 'error')
        }

      };
    

    return(
        <div className="flex-1 py-12 px-24">
            <h1 className="text-2xl font-medium mb-2">Feedback</h1>
            <p className="text-gray-500 mb-8">Leave your feedback and suggestions about 3DScene</p>
            
            {isSubmitted ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center text-green-700 mb-8">
                <CheckCircle size={20} className="mr-2" />
                Thank you for your feedback! We appreciate your input.
              </div>
            ) : null}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="email" className="block text-gray-700 mb-2">Contact email:</label>
                <input
                  type="email"
                  id="email"
                  className={`w-full p-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors({...errors, email: null});
                    }
                  }}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
                <div className="text-right text-gray-400 text-sm mt-1">
                  {email.length} / 30
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="suggestion" className="block text-gray-700 mb-2">Your suggestion</label>
                <textarea
                  id="suggestion"
                  className={`w-full p-3 border ${errors.suggestion ? 'border-red-500' : 'border-gray-300'} rounded-md h-48`}
                  placeholder="What's in your mind?"
                  value={suggestion}
                  onChange={(e) => {
                    setSuggestion(e.target.value);
                    if (errors.suggestion) {
                      setErrors({...errors, suggestion: null});
                    }
                  }}
                />
                {errors.suggestion && (
                  <p className="text-red-500 text-sm mt-1">{errors.suggestion}</p>
                )}
                <div className="text-right text-gray-400 text-sm mt-1">
                  {suggestion.length} / 500
                </div>
              </div>
              
              <div className="flex justify-center">
                <button 
                  type="submit" 
                  className={`px-12 py-3 bg-cyan-400 text-white rounded-md font-medium hover:bg-cyan-500 relative ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="opacity-0">Submit</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      </div>
                    </>
                  ) : 'Submit'}
                </button>
              </div>
            </form>
          </div>
    )
}

export default Feedback