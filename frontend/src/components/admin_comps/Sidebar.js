import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// import { HouseDoor, BoxSeam, Gear, People } from 'react-bootstrap-icons';
import { RouterPath } from "../../assets/dictionary/RouterPath";



function Sidebar() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <div className="admin-sidebar">
      {/* <div className="admin-sidebar-header">
        <Link to={RouterPath.ADMIN_DASHBOARD} className="logo-wrapper">
          <div className="logo-icon">
            <div className="logo-bolt"></div>
          </div>
          <span className="logo-text">FastAPI</span>
        </Link>
      </div>
      
      <nav className="admin-sidebar-nav">
        <ul>
          <li className={isActive(RouterPath.ADMIN_DASHBOARD)}>
            <Link to={RouterPath.ADMIN_DASHBOARD}>
              <HouseDoor size={18} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li className={isActive(RouterPath.ADMIN_SPLAT)}>
            <Link to={RouterPath.ADMIN_SPLAT}>
              <BoxSeam size={18} />
              <span>Model Management</span>
            </Link>
          </li>
          <li className={isActive(RouterPath.ADMIN_USER)}>
            <Link to={RouterPath.ADMIN_USER}>
              <Gear size={18} />
              <span>User Management</span>
            </Link>
          </li>
          <li className={isActive(RouterPath.ADMIN_SETTINGS)}>
            <Link to={RouterPath.ADMIN_SETTINGS}>
              <People size={18} />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="admin-sidebar-footer">
        <p className="user-info">
          Logged in as:<br />
          NTL
        </p>
      </div> */}
    </div>
  );
}

export default Sidebar;