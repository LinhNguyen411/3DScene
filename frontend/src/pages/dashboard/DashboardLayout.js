import SideBar from '../../components/app_comps/SideBar';
import { Outlet } from "react-router-dom";

function DashboardLayout(props) {

  return (
      <div className="flex flex-1">
        <SideBar />
        <Outlet />
      </div>
  );
}

export default DashboardLayout;