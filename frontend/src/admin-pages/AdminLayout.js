import { Outlet } from "react-router-dom";
import Sidebar from "../components/admin_comps/Sidebar";

function AdminLayout() {
  return (
    <>
        <Sidebar />
        <Outlet />
    </>
  );
}

export default AdminLayout;
