import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// import { HouseDoor, BoxSeam, Gear, People } from 'react-bootstrap-icons';
import { RouterPath } from "../../assets/dictionary/RouterPath";
import {
  Home,
  Box,
  Settings,
  UserCircle,
  CircleDollarSign,
} from "lucide-react";

function Sidebar({user, setUser}) {
  const location = useLocation();
  console.log(user)

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <div className="flex flex-col w-64 bg-white border m-4 rounded-lg shadow-lg">
    <div className="p-4 border-b">
      <div className="flex items-center text-teal-500 text-xl font-bold">
      <div className="flex justify-center align-center mb-3 ml-2">
        <div className="bg-teal-500 logo-icon w-[3em] h-[3em]">
                <div className="logo-bolt w-[2em] h-[1em]"></div>
        </div>
        <div className="flex flex-col text-end ml-2">
        <h1 className="text-teal-500 brand-text text-[1.5em]">3DScene</h1>
        <h1 className="ml-2 text-gray-500 text-[1em]">Admin</h1>
        </div>
              
        </div>
      </div>
    </div>
    
    <nav className="p-4">
      <ul className="space-y-2">
        <li>
          <Link to={RouterPath.ADMIN_DASHBOARD} className={`text-teal-500 flex items-center px-4 py-2 text-gray-700 rounded ${isActive(RouterPath.ADMIN_DASHBOARD) ? "bg-gray-200" : "hover:bg-gray-100"}`}>
          <Home className="w-5 h-5 mr-3" />            
          Dashboard
          </Link>
        </li>
        <li>
          <Link to={RouterPath.ADMIN_USER} className={`text-teal-500 flex items-center px-4 py-2 text-gray-700 rounded ${isActive(RouterPath.ADMIN_USER) ? "bg-gray-200" : "hover:bg-gray-100"}`}>
          <UserCircle className="w-5 h-5 mr-3" />
          Users
          </Link>
        </li>
        <li>
          <Link to={RouterPath.ADMIN_SPLAT} className={`text-teal-500 flex items-center px-4 py-2 text-gray-700 rounded ${isActive(RouterPath.ADMIN_SPLAT) ? "bg-gray-200" : "hover:bg-gray-100"}`}>
          <Box className="w-5 h-5 mr-3" />
          Models
          </Link>
        </li>
        <li>
          <Link to={RouterPath.ADMIN_PAYMENT} className={`text-teal-500 flex items-center px-4 py-2 text-gray-700 rounded ${isActive(RouterPath.ADMIN_PAYMENT) ? "bg-gray-200" : "hover:bg-gray-100"}`}>
          <CircleDollarSign className="w-5 h-5 mr-3" />
          Payments
          </Link>
        </li>
        <li>
          <Link to={RouterPath.ADMIN_SETTINGS} className={`text-teal-500 flex items-center px-4 py-2 text-gray-700 rounded ${isActive(RouterPath.ADMIN_SETTINGS) ? "bg-gray-200" : "hover:bg-gray-100"}`}>
          <Settings className="w-5 h-5 mr-3" />
          Settings
          </Link>
        </li>
      </ul>
    </nav>
    
    <div className="mt-auto p-4 text-sm text-gray-500 border-t">
      Logged in as:<br />
      {user ? user.email : 'Loading...'}
    </div>
  </div>
  );
}

export default Sidebar;