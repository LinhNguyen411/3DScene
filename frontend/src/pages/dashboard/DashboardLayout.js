import SideBar from '../../components/app_comps/SideBar';
import { Outlet, useOutletContext } from "react-router-dom";

function DashboardLayout() {
  const {user, fetchAuthData} = useOutletContext();
  return (
      <div className="flex flex-1">
        <SideBar />
        <Outlet context={{user, fetchAuthData }}/>
      </div>
  );
}

export default DashboardLayout;