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
  const [projectDescription, setProjectDescription] = useState("");
  const [projectKeywords, setProjectKeywords] = useState("");
  const [projectIcon, setProjectIcon] = useState("");
  const [stripeMonthlyId, setStripeMonthlyId] = useState("");
  const [stripePublicKey, setStripePublicKey] = useState("");
  const [stripeYearlyId, setStripeYearlyId] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  
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
      setProjectName(response.find(item => item.key === "PROJECT_NAME").value);
      setProjectDescription(response.find(item => item.key === "PROJECT_DESCRIPTION").value);
      setProjectKeywords(response.find(item => item.key === "PROJECT_KEYWORDS").value);
      setProjectIcon(myAppConfig.api.ENDPOINT + response.find(item => item.key === "PROJECT_ICON").value);
      setGoogleClientId(response.find(item => item.key === "GOOGLE_AUTH_CLIENT_ID").value);
      setStripeMonthlyId(response.find(item => item.key === "STRIPE_MONTHLY_ID").value);
      setStripePublicKey(response.find(item => item.key === "STRIPE_PUBLIC_KEY").value);
      setStripeYearlyId(response.find(item => item.key === "STRIPE_YEARLY_ID").value);
      setSupportEmail(response.find(item => item.key === "SUPPORT_EMAIL").value);
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
      <title>{projectName}</title>
      <link rel="icon" href={projectIcon} type="image/png" />
      <meta name="description" content={projectDescription}/>
      <meta name="keywords" content={projectKeywords}/>
      <GoogleOAuthProvider clientId={googleClientId}>
        <NavBarTop user={user} setUser={setUser} projectName={projectName} projectIcon={projectIcon}/>
        <Outlet context={{
          user, 
          fetchAuthData,
          projectName,
          projectIcon,
          stripeMonthlyId,
          stripePublicKey,
          stripeYearlyId,
          supportEmail
        }}/>
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;