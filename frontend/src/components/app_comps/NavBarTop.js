import { RouterPath } from "../../assets/dictionary/RouterPath";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function NavBarTop({ user, setUser, projectName, projectIcon }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClickLogOut = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    setUser(null);
    navigate(RouterPath.HOME);
  };

  const scrollToSection = (sectionId) => {
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

  return (
    <header className="bg-white p-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center">
        <Link to={RouterPath.HOME} className="flex justify-between items-center">
          <img className="w-[3em]" src={projectIcon} />
          <h2 className="brand-text text-sky-400 text-2xl">{projectName}</h2>
        </Link>
      </div>
      
      <div className="space-x-6">
        <button 
          className="text-gray-800 font-medium hover:text-sky-500 transition-colors" 
          onClick={() => scrollToSection('showcase-gallery')}
        >
          Join Community
        </button>
        <button 
          className="text-gray-800 font-medium hover:text-sky-500 transition-colors" 
          onClick={() => scrollToSection('how-to-create')}
        >
          Tutorial
        </button>
       {!user && (
         <>
            <Link to={RouterPath.SUBSCRIPTION} className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors">
              {projectName} Pro
            </Link>
            <Link to={RouterPath.LOGIN} className="header-link hover:text-sky-500 transition-colors text-gray-800 font-medium">
              Login/Signup
            </Link>
          </>
        )}
      {user && (
        <>
        {!user.is_pro && (
          <Link to={RouterPath.SUBSCRIPTION} className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors">
            {projectName} Pro
          </Link>
        )}
        <Link to={RouterPath.DASHBOARD} className="text-gray-800 font-medium hover:text-sky-500 transition-colors">
          Dashboard
        </Link>
        <Link to={RouterPath.DASHBOARD_PROFILE} className="header-link">
          {user?.email}
          {user?.is_pro && (
            <span className="bg-gray-900 text-white rounded p-1 ml-1">Pro</span>
          )}
        </Link>
        <button onClick={handleClickLogOut} className="border-2 border-sky-400 text-sky-400 px-4 py-2 rounded transition-colors hover:bg-sky-500 hover:text-white">
          Logout
        </button>
        </>
      )}
      </div>
    </header>
  );
}