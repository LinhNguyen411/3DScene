import { Outlet } from "react-router-dom";
import Sidebar from "../components/admin_comps/Sidebar";

function AdminLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <Outlet />
    </div>
  );
}

export default AdminLayout;
