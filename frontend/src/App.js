import NavBarTop from "./components/nav_bar/NavBarTop";
import { Outlet } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import myAppConfig from "./config";

function App() {
  return (
    <>
      <GoogleOAuthProvider clientId={myAppConfig.oauth2.GOOGLE_AUTH_CLIENT_ID}>
        <NavBarTop />
        <Outlet />
      </GoogleOAuthProvider>
    </>
  );
}

export default App;
