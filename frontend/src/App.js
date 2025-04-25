import NavBarTop from "./components/app_comps/NavBarTop";
import { Outlet } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import myAppConfig from "./config";
import "./App.css";
import React, { useState, useEffect } from 'react';
import DataService from "./components/auth/Service";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [googleClientId, setGoogleClientId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [stripeMonthlyId, setStripeMonthlyId] = useState("");
  const [stripePublicKey, setStripePublicKey] = useState("");
  const [stripeYearlyId, setStripeYearlyId] = useState("");
  
  const fetchAuthData = async () => {
    try {
      const response = await DataService.getAuth();
      setUser(response);
    } catch (error) {
      setUser(null);
    }
  };
  
  const fetchEnvData = async () => {
    try {
      const response = await DataService.getEnv();
      setGoogleClientId(response.find(item => item.key === "GOOGLE_AUTH_CLIENT_ID").value);
      setProjectName(response.find(item => item.key === "PROJECT_NAME").value);
      setStripeMonthlyId(response.find(item => item.key === "STRIPE_MONTHLY_ID").value);
      setStripePublicKey(response.find(item => item.key === "STRIPE_PUBLIC_KEY").value);
      setStripeYearlyId(response.find(item => item.key === "STRIPE_YEARLY_ID").value);
      return response;
    } catch (error) {
      console.error("Failed to fetch environment data:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      // First fetch environment variables
      await fetchEnvData();
      // Then fetch auth data
      await fetchAuthData();
      setIsLoading(false);
    };
    
    initializeApp();
  }, []);


  // Show loading state while fetching environment variables
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <p className="text-xl">Loading application...</p>
    </div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <GoogleOAuthProvider clientId={googleClientId}>
        <NavBarTop user={user} setUser={setUser} projectName={projectName}/>
        <Outlet context={{
          user, 
          fetchAuthData,
          projectName,
          stripeMonthlyId,
          stripePublicKey,
          stripeYearlyId
        }}/>
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;