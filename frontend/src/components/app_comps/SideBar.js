import { RouterPath } from "../../assets/dictionary/RouterPath";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Edit, UploadCloud, Search, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Box, Shield, Star, MessageSquare } from 'lucide-react';




export default function SideBar(props) {
  const [currentPage, setCurrentPage] = useState('upload');
  const isAuthenticated = localStorage.getItem("token") ? true : false;
  let navigate = useNavigate();
  const location = useLocation();
  return (
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
              <Box size={20} strokeWidth={2} />
            </div>
            My Model
          </Link>
        </li>
        <li>
          <Link 
            to={RouterPath.DASHBOARD_MY_MODEL}
            onClick={() => setCurrentPage('models')}
            className={`flex items-center p-2 w-full ${currentPage === 'models' ? 'text-sky-400' : 'text-gray-600'}`}
          >
            <div className="mr-3">
              <Shield size={20} strokeWidth={2} />
            </div>
            3DGS
          </Link>
        </li>
        <li>
          <button className="flex items-center p-2 w-full text-gray-600">
            <div className="mr-3">
              <Star size={20} strokeWidth={2} />
            </div>
            Our Favorites
          </button>
        </li>
        <li>
          <Link 
            to={RouterPath.DASHBOARD_FEEDBACK}
            onClick={() => setCurrentPage('feedback')}
            className={`flex items-center p-2 w-full ${currentPage === 'feedback' ? 'text-sky-400' : 'text-gray-600'}`}
          >
            <div className="mr-3">
            <MessageSquare size={20} strokeWidth={2} />
            </div>
            Feedback
          </Link>
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
