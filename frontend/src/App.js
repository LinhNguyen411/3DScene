import NavBarTop from "./components/app_comps/NavBarTop";
import { Outlet } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import myAppConfig from "./config";
import "./App.css";
function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <GoogleOAuthProvider clientId={myAppConfig.oauth2.GOOGLE_AUTH_CLIENT_ID}>
        <NavBarTop />
        <Outlet />
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
