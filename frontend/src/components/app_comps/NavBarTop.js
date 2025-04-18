import { RouterPath } from "../../assets/dictionary/RouterPath";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function NavBarTop(props) {
  const isAuthenticated = localStorage.getItem("token") ? true : false;
  let navigate = useNavigate();
  const location = useLocation();

  const handleClickLogOut = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    navigate(RouterPath.HOME);
  };

  return (
    <header className="bg-white p-4 flex justify-between items-center shadow-sm">
    <div className="flex items-center">
    <Link to={RouterPath.HOME} className="flex justify-between items-center">
      <div className="logo-icon bg-sky-400 border-sky-400 w-[3em] h-[3em]">
        <div className="logo-bolt w-[2em] h-[1em]"></div>
      </div>
      <h2 className="brand-text text-sky-400 text-2xl">3DScene</h2>
    </Link>
      <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">Web</span>
    </div>
    
    <div className="space-x-6">
      <button className="text-gray-800 font-medium">Join Community</button>
      <button className="text-gray-800 font-medium">Tutorial</button>
      <Link to={RouterPath.SUBSCRIPTION} className="bg-gray-900 text-white px-4 py-2 rounded">3DScene Pro</Link>
     {!isAuthenticated && (
          <>
          <Link to={RouterPath.LOGIN} className="header-link">
            Login/Signup
          </Link>
          </>
        )}
        {isAuthenticated && (
          <>
          <Link to={RouterPath.DASHBOARD} className="text-gray-800 font-medium">
            Dashboard
          </Link>
          <button onClick={handleClickLogOut} className="border-2 border-sky-400 text-sky-400 px-4 py-2 rounded transition-colors hover:bg-sky-500 hover:text-white">Logout</button>
          </>
        )}
    </div>
  </header>
  );
}
