import SideBar from '../../components/app_comps/SideBar';
import { Outlet, useOutletContext } from "react-router-dom";
import { useState, useEffect } from 'react';

function DashboardLayout() {
  const {user, fetchAuthData, supportEmail} = useOutletContext();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
      <div className="flex flex-1">
        {!isMobile && <SideBar supportEmail={supportEmail}/>}
        <div className="flex-1 overflow-x-hidden">
          <Outlet context={{user, fetchAuthData }}/>
        </div>
      </div>
  );
}

export default DashboardLayout;