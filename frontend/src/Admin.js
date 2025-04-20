import { Outlet } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import myAppConfig from "./config";
import "./Admin.css"
import React, { useState, useEffect } from 'react';
import DataService from "./components/admin_auth/Service";
import Sidebar from "./components/admin_comps/Sidebar";
function Admin() {
  const [user, setUser] = useState(null);

  const fetchAuthData = async () => {
    try {
      const response = await DataService.getAuth();
      console.log(response)
      setUser(response);
      console.log(user)
    } catch (error) {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchAuthData();
  }, []);
  return (
    <>
      <GoogleOAuthProvider clientId={myAppConfig.oauth2.GOOGLE_AUTH_CLIENT_ID}>
        <div className="flex h-screen bg-gray-50">
          <Sidebar user={user} setUser={setUser}/>
          {user && <Outlet context={{ user, setUser }}/>}
        </div>
      </GoogleOAuthProvider>
    </>
  );
}

export default Admin;
