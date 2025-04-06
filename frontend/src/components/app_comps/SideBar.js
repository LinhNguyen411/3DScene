import { RouterPath } from "../../assets/dictionary/RouterPath";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Edit, UploadCloud, Search, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';



export default function SideBar(props) {
  const [currentPage, setCurrentPage] = useState('upload');
  const isAuthenticated = localStorage.getItem("token") ? true : false;
  let navigate = useNavigate();
  const location = useLocation();
  return (
      // <div className="sidebar">
      //     <Link to={RouterPath.DASHBOARD_UPLOAD}  className="upload-btn">
      //       <span className="upload-icon">↑</span>
      //       Upload
      //     </Link>
          
      //     <nav className="nav-menu">
      //       <Link to={RouterPath.HOME}  className="nav-item">
      //         <span className="nav-icon">📦</span>
      //         <span>My Model</span>
      //       </Link>
      //       <Link to={RouterPath.HOME}  className="nav-item active">
      //         <span className="nav-icon">🔮</span>
      //         <span>3DGS</span>
      //       </Link>
      //       <Link to={RouterPath.HOME}  className="nav-item">
      //         <span className="nav-icon">⭐</span>
      //         <span>Our Favorites</span>
      //       </Link>
      //       <Link to={RouterPath.HOME}  className="nav-item">
      //         <span className="nav-icon">💬</span>
      //         <span>Feedback</span>
      //       </Link>
      //     </nav>
          
      //     <div className="sidebar-footer">
      //       <button className="download-app">Download App</button>
      //       <a href="#" className="contact">Contact Us</a>
      //     </div>
      //   </div>
      <div className="w-60 bg-white shadow-md flex flex-col">
      <div className="p-4">
        <Link to={RouterPath.DASHBOARD_UPLOAD}
          onClick={() => setCurrentPage('upload')}
          className="w-full bg-sky-400 hover:bg-sky-500 text-white px-4 py-2 rounded flex items-center justify-center"
        >
          <UploadCloud size={16} className="mr-2" />
          Upload
        </Link>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2 p-4">
          <li>
            <Link 
              to={RouterPath.DASHBOARD_MY_MODEL}
              onClick={() => setCurrentPage('models')}
              className={`flex items-center p-2 w-full ${currentPage === 'models' ? 'text-sky-400' : 'text-gray-600'}`}
            >
              <div className="mr-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
              </div>
              My Model
            </Link>
          </li>
          <li>
            <button className="flex items-center p-2 w-full text-gray-600">
              <div className="mr-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              3DGS
            </button>
          </li>
          <li>
            <button className="flex items-center p-2 w-full text-gray-600">
              <div className="mr-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              Our Favorites
            </button>
          </li>
          <li>
            <button className="flex items-center p-2 w-full text-gray-600">
              <div className="mr-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <path d="M16 17l5-5-5-5"></path>
                  <path d="M21 12H9"></path>
                </svg>
              </div>
              Feedback
            </button>
          </li>
        </ul>
      </nav>
      
      <div className="mt-auto p-4">
        <button className="text-sky-400 font-medium w-full text-center py-2">
          Download App
        </button>
        <button className="text-gray-600 w-full text-center py-2">
          Contact Us
        </button>
      </div>
    </div>
  );
}
