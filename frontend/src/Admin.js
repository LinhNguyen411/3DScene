import { Outlet } from "react-router-dom";
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
        <div className="flex h-screen bg-gray-50">
          <div className="min-w-[18em]">
          <Sidebar user={user} setUser={setUser}/>

          </div>
          <div className="flex-1">

          {user && <Outlet context={{ user, setUser }}/>}
          </div>
        </div>
    </>
  );
}

export default Admin;
