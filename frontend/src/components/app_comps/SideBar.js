import { RouterPath } from "../../assets/dictionary/RouterPath";
import { Link, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { Box, Earth, MessageSquare, UploadCloud, CreditCard, UserCog } from 'lucide-react';

export default function SideBar({supportEmail}) {
  const [currentPage, setCurrentPage] = useState('upload');
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.includes(RouterPath.DASHBOARD_UPLOAD)) {
      setCurrentPage('upload');
    } else if (location.pathname.includes(RouterPath.DASHBOARD_MY_MODEL)) {
      setCurrentPage('models');
    } else if (location.pathname.includes(RouterPath.DASHBOARD_EXPLORE)) {
      setCurrentPage('explore');
    } else if (location.pathname.includes(RouterPath.DASHBOARD_FEEDBACK)) {
      setCurrentPage('feedback');
    } else if (location.pathname.includes(RouterPath.DASHBOARD_BILLING)) {
      setCurrentPage('billing');
    } else if (location.pathname.includes(RouterPath.DASHBOARD_PROFILE)) {
      setCurrentPage('profile');
    }
  }, [location.pathname]);

  const handleContactUs = () => {
    // Open Gmail compose with recipient email already filled in
    window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + supportEmail, '_blank');
  };

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
            Library
          </Link>
        </li>
        <li>
        <Link 
            to={RouterPath.DASHBOARD_EXPLORE}
            onClick={() => setCurrentPage('explore')}
            className={`flex items-center p-2 w-full ${currentPage === 'explore' ? 'text-sky-400' : 'text-gray-600'}`}
          >
            <div className="mr-3">
              <Earth size={20} strokeWidth={2} />
            </div>
            Explore
          </Link>
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
        <li>
          <Link 
            to={RouterPath.DASHBOARD_BILLING}
            onClick={() => setCurrentPage('billing')}
            className={`flex items-center p-2 w-full ${currentPage === 'billing' ? 'text-sky-400' : 'text-gray-600'}`}
          >
            <div className="mr-3">
            <CreditCard size={20} strokeWidth={2} />
            </div>
            Billing
          </Link>
        </li>
        <li>
          <Link 
            to={RouterPath.DASHBOARD_PROFILE}
            onClick={() => setCurrentPage('profile')}
            className={`flex items-center p-2 w-full ${currentPage === 'profile' ? 'text-sky-400' : 'text-gray-600'}`}
          >
            <div className="mr-3">
            <UserCog size={20} strokeWidth={2} />
            </div>
            Profile
          </Link>
        </li>
      </ul>
    </nav>
      
      <div className="mt-auto p-4">
        <button 
          onClick={handleContactUs}
          className="text-gray-600 hover:text-sky-500 w-full text-center py-2 transition-colors"
        >
          Contact Us
        </button>
      </div>
    </div>
  );
}