import { Outlet } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import myAppConfig from "./config";

function Admin() {
  return (
    <>
      <GoogleOAuthProvider clientId={myAppConfig.oauth2.GOOGLE_AUTH_CLIENT_ID}>
        <Outlet />
      </GoogleOAuthProvider>
    </>
  );
}

export default Admin;
