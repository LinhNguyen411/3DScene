import { RouterPath } from "../../assets/dictionary/RouterPath";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function NavBarTop({ user, setUser, projectName, projectIcon }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check window size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleClickLogOut = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    setUser(null);
    navigate(RouterPath.HOME);
    setIsMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    setIsMenuOpen(false);
    // Only handle scrolling if we're on the homepage
    if (location.pathname === RouterPath.HOME) {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If we're not on the homepage, navigate there with a hash
      navigate(`${RouterPath.HOME}#${sectionId}`);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      {projectName && projectIcon && (
        <header className="bg-white p-4 flex justify-between items-center shadow-sm relative">
        <div className="flex items-center">
          <Link to={RouterPath.HOME} className="flex justify-between items-center">
            <img className="w-12" src={projectIcon} alt={`${projectName} logo`} />
            <h2 className="brand-text text-sky-400 text-2xl ml-2">{projectName}</h2>
          </Link>
        </div>
        
        {/* Mobile menu button */}
        {isMobile && (
          <button 
            onClick={toggleMenu}
            className="md:hidden text-gray-500 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              )}
            </svg>
          </button>
        )}
        
        {/* Desktop navigation */}
        {(!isMobile || isMenuOpen) && (
          <div className={`${isMobile ? 
            'absolute top-full left-0 right-0 bg-white shadow-md flex flex-col p-4 space-y-4 z-50' : 
            'flex items-center space-x-6'}`}>
            <button 
              className={`text-gray-800 font-medium hover:text-sky-500 transition-colors ${isMobile ? 'text-left' : ''}`}
              onClick={() => scrollToSection('showcase-gallery')}
            >
              Join Community
            </button>
            <button 
              className={`text-gray-800 font-medium hover:text-sky-500 transition-colors ${isMobile ? 'text-left' : ''}`}
              onClick={() => scrollToSection('how-to-create')}
            >
              Tutorial
            </button>
            
            {!user && (
              <>
                <Link 
                  to={RouterPath.SUBSCRIPTION} 
                  className={`bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors ${isMobile ? 'block text-center' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {projectName} Pro
                </Link>
                <Link 
                  to={RouterPath.LOGIN} 
                  className={`header-link hover:text-sky-500 transition-colors text-gray-800 font-medium ${isMobile ? 'block text-left' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login/Signup
                </Link>
              </>
            )}
            
            {user && (
              <>
                {!user.is_pro && (
                  <Link 
                    to={RouterPath.SUBSCRIPTION} 
                    className={`bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors ${isMobile ? 'block text-center' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {projectName} Pro
                  </Link>
                )}
                <Link 
                  to={RouterPath.DASHBOARD} 
                  className={`text-gray-800 font-medium hover:text-sky-500 transition-colors ${isMobile ? 'block text-left' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to={RouterPath.DASHBOARD_PROFILE} 
                  className={`header-link ${isMobile ? 'block text-left' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {user?.email}
                  {user?.is_pro && (
                    <span className="bg-gray-900 text-white rounded p-1 ml-1">Pro</span>
                  )}
                </Link>
                <button 
                  onClick={handleClickLogOut} 
                  className={`border-2 border-sky-400 text-sky-400 px-4 py-2 rounded transition-colors hover:bg-sky-500 hover:text-white ${isMobile ? 'block w-full' : ''}`}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </header>
      )}
    </>
  );
}